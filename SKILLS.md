# SKILLS.md

Developer guidelines for contributing to TheMoviesStop.

---

## Environment Setup

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Backend runtime |
| npm | 9+ | Package manager |
| MongoDB | 6+ | User data storage |
| Memcached | 1.6+ | Session/cache layer |

### First-time setup

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Start Memcached (macOS)
brew services start memcached

# Start MongoDB (macOS)
brew services start mongodb-community

# Copy and fill in environment variables
cp .env.example .env
# Set TMDB_API_KEY, JWT_SECRET in .env
```

### Running the app

```bash
# Backend with auto-reload (port 8000)
npm run start:dev

# Frontend Angular dev server (port 4200)
cd frontend && npx ng serve
```

Both must be running simultaneously. The Angular dev server proxies `/api/*` calls to the Express backend.

### Environment variables

The backend reads the following from `.env`:

| Variable | Description |
|---|---|
| `TMDB_API_KEY` | API key from themoviedb.org |
| `JWT_SECRET` | Secret used to sign/verify JWTs |

Never commit `.env` to version control.

---

## Linting

The Angular frontend uses TypeScript strict mode. The compiler acts as the primary linter.

### Why lints must pass

- **Strict TypeScript** (`strict: true`, `strictTemplates: true`) catches type mismatches in both component logic and HTML templates at build time, not runtime.
- A build that emits TypeScript errors indicates broken type contracts between components, services, and models. These are real bugs, not style warnings.
- Template errors (e.g. accessing a property on a potentially null signal) surface only during `ng build` — passing the build is the minimum bar for a correct change.

### Running the TypeScript check

```bash
cd frontend

# Full build check (catches all template + TS errors)
npx ng build --configuration development

# Type-check only, no output files (faster)
npx tsc --noEmit -p tsconfig.app.json
```

All errors must be resolved before merging. Suppressing errors with `// @ts-ignore` or casting to `any` is not acceptable unless accompanied by a clear explanation.

---

## Unit Tests

### Running tests

```bash
cd frontend

# Run all unit tests (headless)
npx ng test --watch=false --browsers=ChromeHeadless
```

### What to test

- **Services**: Mock `HttpClient` and assert correct URLs, request bodies, and response mappings. This is the most valuable layer to test since services are the data contract between backend and UI.
- **Components**: Test signal state changes (e.g. `inWatchList`, `userRating`) in response to service responses. Do not test DOM rendering details.
- **Pipes**: Pure functions — straightforward input/output assertions.

### Example: testing a service method

```typescript
// movies.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MoviesService } from './movies.service';

describe('MoviesService', () => {
  let service: MoviesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MoviesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MoviesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should fetch user media status including userRating', () => {
    // Why: userRating was previously dropped during response mapping —
    // a test here would have caught that regression immediately.
    service.getUserMediaStatus(123).subscribe((status) => {
      expect(status.userRating).toBe(7);
      expect(status.isInWatchList).toBeTrue();
    });

    http.expectOne(/moviesLikedAndtoWatch\/123/).flush({
      isInWatchList: true,
      isInFavoritesList: false,
      userRating: 7,
    });
  });
});
```

> **Why use real HTTP testing over mocks:** `HttpTestingController` intercepts at the HTTP layer, meaning the full `pipe(map(...))` chain runs. A plain mock of `HttpClient.get` would skip that chain and miss mapping bugs — exactly the class of bug that caused the `userRating` regression in Phase 9.

### Example: testing a component signal

```typescript
// movie-detail.component.spec.ts
it('should set userRating signal from status response', () => {
  // Why: signals are the source of truth for the UI — verifying them
  // directly is more reliable than querying rendered DOM.
  const statusSpy = spyOn(moviesService, 'getUserMediaStatus').and.returnValue(
    of({ isInWatchList: false, isInFavoritesList: false, userRating: 8 })
  );

  component.ngOnInit();
  fixture.detectChanges();

  expect(component.userRating()).toBe(8);
});
```

---

## Security Checks (CodeQL)

Run these checks **before every commit** on any changed `.js` or `.ts` file. They catch the same classes of issue that GitHub CodeQL flags on this repo.

### 1. Insecure randomness

`Math.random()` must never be used for security-sensitive values (tokens, passcodes, secrets).

```bash
grep -rn "Math\.random()" routes/ --include="*.js"
```

Expected: no matches. Use `crypto.randomInt()` or `crypto.randomBytes()` instead.

### 2. NoSQL injection (user-controlled DB queries)

Any `findOne` / `find` / `findOneAndUpdate` using a raw user value must wrap it in `{ $eq: value }`.

```bash
grep -rn "findOne\|find(" routes/ --include="*.js"
```

Review every match: if the value in the query object comes from `req.body`, `req.params`, or `req.query`, it must use `{ $eq: value }`, not bare `value`.

### 3. XSS via innerHTML (frontend)

```bash
grep -rn "innerHTML\|bypassSecurityTrust" frontend/src --include="*.ts" --include="*.html"
```

Any `bypassSecurityTrust*` call must use a `computed()` signal — never call it inside a template binding or a function called from a template (it returns a new object every cycle, causing infinite re-renders).

### Running all checks at once

```bash
echo "=== Math.random ===" && grep -rn "Math\.random()" routes/ --include="*.js"
echo "=== DB queries ===" && grep -rn "findOne\|\.find(" routes/ --include="*.js"
echo "=== innerHTML/bypassSecurity ===" && grep -rn "innerHTML\|bypassSecurityTrust" frontend/src --include="*.ts" --include="*.html"
```

If any result looks unsafe, fix it before committing.

---

## Branch and Pull Request Workflow

**After every `git push`, check whether the previous PR for the branch was already merged:**

```bash
gh pr list --head $(git branch --show-current) --state open
```

If the output is empty (no open PR), create a new one immediately with `gh pr create`. Never leave pushed commits without an open PR.


- All work must be done on a feature branch — never commit directly to `master`.
- **One concern per branch**: When a new request comes in, check the current branch first:
  - If the current branch's PR has already been merged → switch to `master`, pull, create a new branch.
  - If the current branch has commits pushed but the new request is for a **different concern** → switch to `master`, pull, create a new branch for the new concern.
  - If the current branch has local uncommitted changes for the **same concern** → continue on the same branch.
  - Never stack unrelated work on an existing branch that already has pushed commits.
- When a branch is ready, always open a pull request against `master`, even for small fixes.
- Every PR must include a description summarising all changes made on the branch — not just the last commit. Reviewers should be able to understand what changed and why without reading the diff.
- After a PR is merged, delete the source branch. Do not leave stale branches around.

```bash
# Create a branch
git checkout -b my-feature

# Push and open a PR with a description
git push origin my-feature
gh pr create --title "Short title" --body "$(cat <<'EOF'
## Summary
- What was changed and why (cover all commits on the branch)
- Note any non-obvious decisions or side effects

## Test plan
- [ ] Tested locally at localhost:4200
- [ ] Verified the affected routes/pages work end to end
EOF
)"

# After merge, delete the branch locally and remotely
git checkout master
git pull origin master
git branch -d my-feature
git push origin --delete my-feature
```

**Why:** A PR without a description forces reviewers to reconstruct intent from the diff. On this project that matters because many changes involve non-obvious backend/frontend interactions (proxy config, Mongoose version quirks, JWT payload shape) that are not self-evident from the code alone.

---

## Generating Code and Documentation

When adding a new feature, follow these conventions:

### Provide complete, runnable examples

Do not add skeleton code or `// TODO` stubs. A new component should include the full `.ts`, `.html`, and `.scss` files with working logic — not placeholders. A new backend route should include input parsing, DB access, error handling, and a `res.json(...)` response.

**Why:** Partial implementations create ambiguity about intent and often get merged incomplete. Complete examples make review straightforward and can be run immediately.

### Explain architectural choices

When a non-obvious decision is made, leave a comment or PR description note explaining why. Examples:

- Why a `setTimeout(300ms)` delay exists before a second TMDB request (rate limiting)
- Why `req.payload._id` is used instead of `req.user` (express-jwt sets `payload`, not `user`)
- Why `flex: 1 1 0; min-width: 0` is needed on a flex child (prevents overflow from long titles)

**Why:** This codebase has several non-obvious patterns inherited from the legacy AngularJS app and the TMDB API's behaviour. Undocumented decisions get reversed by future contributors who don't have the original context.

### Angular component checklist

When generating a new standalone Angular component:

```typescript
@Component({
  selector: 'app-my-feature',
  standalone: true,                        // always standalone — no NgModules
  imports: [CommonModule, RouterLink],     // import only what the template uses
  templateUrl: './my-feature.component.html',
  styleUrl: './my-feature.component.scss', // scoped styles — avoid global class names
})
export class MyFeatureComponent implements OnInit {
  // Use signals for all local state
  data = signal<MyType | null>(null);
  loading = signal(true);

  // Inject services via constructor, not inject()
  constructor(private svc: MyService) {}
}
```

Key rules:
- Use `signal()` for component state — not class properties or `BehaviorSubject`
- Use unique CSS class names in component SCSS to avoid conflicts with global `styles.scss`
- Never use `object-fit: cover` on people/cast images without explicitly setting a fixed height, or images will be cropped
