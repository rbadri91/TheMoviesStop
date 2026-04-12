# ARCHITECTURE.md

System architecture and code organization for TheMoviesStop.

---

## Overview

TheMoviesStop is a full-stack web application that surfaces movie, TV show, and people data from [The Movie Database (TMDB) API](https://www.themoviedb.org/). It adds a user layer on top — accounts, watchlists, favorites, and ratings — stored in MongoDB.

```
Browser (Angular 21 SPA)
    │
    │  All requests
    ▼
Express Backend (Node.js) — serves Angular static files + handles /api/* routes
    │                │
    │ TMDB API       │ MongoDB
    ▼                ▼
themoviedb.org    User data
```

Express serves the Angular build output (`frontend/dist/frontend/browser/`) as static files. Any URL not matched by a static file or an API route falls back to `index.html`, letting Angular's client-side router handle navigation. The legacy AngularJS app (`public/`) has been removed.

---

## Repository Structure

```
TheMoviesStop/
├── app.js                  # Express app setup (middleware, static serving, error handler)
├── bin/www                 # HTTP server entry point, process crash handlers
├── routes/index.js         # All API route handlers (single file)
├── models/users.js         # Mongoose User schema
├── config/                 # Passport and database config
└── frontend/               # Angular 21 frontend
    ├── dist/frontend/browser/  # Build output (gitignored; built by heroku-postbuild)
    └── src/app/
        ├── app.ts          # Root component
        ├── app.routes.ts   # All client-side routes
        ├── app.config.ts   # App bootstrapping (providers, interceptors)
        ├── core/           # Services, interceptors, guards
        ├── features/       # Page-level components grouped by domain
        ├── shared/         # Reusable components and pipes
        └── models/         # TypeScript interfaces
```

---

## Backend

### Entry points

| File | Role |
|---|---|
| `bin/www` | Creates the HTTP server, sets the port, attaches `uncaughtException` / `unhandledRejection` handlers to prevent crashes |
| `app.js` | Registers middleware (body-parser, session, CORS, JWT), mounts the router, registers the global JSON error handler |
| `routes/index.js` | All route handlers. Exported as a factory function `(router, passport) => void` |

### Route structure (`routes/index.js`)

All routes live in one file. They fall into four categories:

**TMDB proxy routes** — fetch from TMDB and return the result to the browser. All list routes accept an optional `?page=N` query param (default 1), which is forwarded directly to TMDB:
```
GET /movies/popular?page=N
GET /movies/top?page=N
GET /movies/showingnow?page=N
GET /movies/upcoming?page=N
GET /movies/openingThisWeek
GET /movies/:id
GET /tv/popular?page=N
GET /tv/top?page=N
GET /tv/onTV?page=N
GET /tv/airingToday?page=N
GET /tv/:id
GET /tv/:id/allseason
GET /people/popular?page=N
GET /people/:id
...
```

**User auth routes**:
```
POST /register   → creates User, returns JWT
POST /login      → validates password, returns JWT
```

**User data routes** (all require JWT auth):
```
GET  /user/:userId/moviesLikedAndtoWatch/:movieId  → watchlist/favorites/rating status
GET  /user/:userId/tvLikedAndToWatch/:showId
POST /user/movies/addToWatchList
POST /user/movies/addToFavorites
POST /user/movies/rate                              → rate-limited (60/15min)
POST /user/tv/addToWatchList
POST /user/tv/addToFavorites
POST /user/tv/rate                                  → rate-limited (60/15min)
GET  /user/profile                                  → enriched watchlist + favorites + ratings
```

**AI summary route** (rate-limited to 10/15min per IP, no auth required):
```
POST /movies/:id/summary  → spawns MCP server, runs Claude agentic loop,
                            returns { summary } as a plain-text paragraph
```

### MCP movie summary

`mcp/movie-summary-server.js` is an MCP server (stdio transport) exposing one tool:

- **`get_movie_details`** — fetches title, tagline, overview, genres, release date, runtime, vote average, and top-5 cast from TMDB for a given numeric movie ID.

The `POST /movies/:id/summary` route:
1. Spawns the MCP server as a child process via `StdioClientTransport`.
2. Lists the available tools and converts them to Anthropic format (`inputSchema` → `input_schema`).
3. Calls `claude-haiku-4-5-20251001` with the tool definitions and a summary prompt.
4. Runs the agentic loop: on `tool_use` Claude calls `get_movie_details`, the route runs it via `mcpClient.callTool()`, pushes `tool_result` back, and re-invokes Claude.
5. On `end_turn`, the text block is returned as `{ summary }`.
6. The MCP client is always closed in a `finally` block to clean up the child process.

### HTTP fetching

Two helpers are used to call TMDB:

- **`getdata(options, callback)`** — uses Node's built-in `https` module. Used for most routes.
- **`node-libcurl`** — used for `getShowingNowMovies` and `getSeasonInfo`. Introduced to fix intermittent 400 errors from TMDB on those specific endpoints.

A **300ms delay** (`setTimeout`) is applied before the season info fetch inside `GET /tv/:id` because consecutive requests to TMDB can trigger rate limiting, which returns HTML instead of JSON and causes a parse failure.

### Authentication

JWT-based auth via `express-jwt`. The middleware is configured with:

```javascript
var auth = jwt({ secret: process.env.JWT_SECRET, algorithms: ['HS256'], requestProperty: 'payload' });
```

`requestProperty: 'payload'` means the decoded token is available as `req.payload`, **not** `req.user`. This is important when accessing the user ID in protected routes: always use `req.payload._id`.

### Database schema

One Mongoose model: `User` (`models/users.js`).

```
User {
  username: String (unique, lowercase)
  email: String
  hash: String       (PBKDF2 of password)
  salt: String
  watchList: [{ id: Number, mediaType: String }]
  favoritesList: [{ id: Number, mediaType: String }]
  ratings: [{ id: Number, mediaType: String, ratingValue: Number }]
}
```

Passwords are hashed with PBKDF2 (SHA-512, 1000 iterations). JWTs are signed with `JWT_SECRET` from the environment and expire after 60 days.

---

## Frontend (Angular 21)

### Key conventions

- **Standalone components only** — no NgModules anywhere in the app.
- **Signals for state** — all component state uses `signal()` and `computed()`. No `BehaviorSubject` or raw class properties for reactive state.
- **Lazy-loaded routes** — every route uses `loadComponent()` so bundles are split per page.
- **Scoped styles** — each component has its own `.scss` file. Global `styles.scss` is kept minimal. CSS class names in component files must be unique enough to avoid conflicts with the global stylesheet.

### Directory layout

```
core/
├── guards/
│   └── auth.guard.ts         # authGuard (requires login), guestGuard (blocks logged-in users)
├── interceptors/
│   ├── auth.interceptor.ts   # Attaches Bearer token to every outgoing request
│   └── json-parse.interceptor.ts  # Re-parses double-encoded JSON from backend
└── services/
    ├── auth.service.ts        # JWT storage, login/logout, computed isLoggedIn/currentUser
    ├── state.service.ts       # In-memory signals for selected movie/show/person
    ├── movies.service.ts      # TMDB movie endpoints + user movie actions + getAISummary()
    ├── shows.service.ts       # TMDB TV endpoints + user show actions
    ├── people.service.ts      # TMDB people endpoints
    ├── genre.service.ts
    ├── company.service.ts
    ├── all-media.service.ts   # Home feed (combines movies + shows)
    └── user.service.ts        # Profile data fetch

features/
├── auth/login, register      # Login and register forms
├── home/                     # Landing page (now playing, trending, top rated)
├── movies/
│   ├── movie-list/           # Reused for popular, top, upcoming, etc. (mode from URL segment)
│   ├── movie-detail/         # Full detail page with inline section nav
│   ├── full-cast/            # Cast + crew two-column page (shared with TV)
│   ├── reviews/              # Full reviews page (shared with TV)
│   ├── genre/                # Genre-filtered list (shared with TV)
│   └── company-list, company-based/
├── tv/
│   ├── show-list/            # Reused for popular, top, on-TV, airing-today
│   ├── show-detail/          # Full detail with season info
│   └── all-seasons/          # Season reviews page
├── people/
│   ├── people-list/          # Popular people grid (4 per row)
│   └── person-detail/        # Acting + production credits
└── profile/                  # Watchlist, favorites, ratings tabs

shared/
├── components/
│   ├── navbar/               # Auth-aware navigation bar
│   ├── movie-card/           # Poster card used in lists
│   ├── show-card/            # Poster card for TV shows
│   ├── star-rating/          # 10-star interactive rating widget
│   └── paginator/            # Page navigation (prev/next + numbered pages with ellipsis)
└── pipes/
    └── htmlize.pipe.ts       # Sanitizes and renders HTML content from TMDB reviews

models/
├── movie.model.ts            # Movie, CastMember, CrewMember, UserMediaStatus, etc.
├── show.model.ts             # Show, SeasonDetail, etc.
├── person.model.ts
├── user.model.ts             # UserProfile, UserListItem
└── auth.model.ts             # LoginCredentials, AuthResponse, JwtPayload
```

### Data flow

```
User navigates to /movies/desc/123
    │
    ▼
MovieDetailComponent.ngOnInit()
    │  calls
    ▼
MoviesService.getMovieDetails(123)
    │  HTTP GET /api/movies/123
    ▼
authInterceptor        → adds Authorization: Bearer <token>
jsonParseInterceptor   → re-parses double-encoded JSON body
    │
    ▼
Express GET /movies/:id
    │  calls TMDB
    ▼
themoviedb.org/3/movie/123?append_to_response=...
    │
    └──► response flows back up, component sets movie signal, template renders
```

### Auth flow

1. On login/register, the backend returns a JWT.
2. `AuthService` stores it in `localStorage` under `moviestop-token` and sets a signal.
3. `computed(() => isLoggedIn)` checks the token expiry on every read — no manual refresh needed.
4. `authInterceptor` reads the token from `AuthService` and clones every outgoing request with `Authorization: Bearer <token>`.
5. Protected routes use `authGuard`; login/register use `guestGuard` to redirect already-authenticated users.

### State sharing between parent and child routes

`StateService` holds the currently selected movie/show/person as signals. When `MovieDetailComponent` fetches a movie, it calls `this.state.selectedMovie.set(movie)`. Child pages (full cast, reviews) read from `StateService` to avoid re-fetching.

This replaces the AngularJS `$localStorage` pattern used in the legacy app.

### The `jsonParseInterceptor`

Most Express routes forward the raw TMDB response string directly to `res.json()`. This double-encodes the JSON — `res.json(string)` JSON-stringifies the string, so Angular's `HttpClient` receives a JSON string instead of a parsed object.

The interceptor detects when the response body is a `string`, attempts `JSON.parse`, and replaces the body with the parsed result. This is transparent to all services — they always receive plain objects.

The `/allFeeds` and auth endpoints are unaffected because they construct their own response objects before calling `res.json()`.

---

## CSS Architecture

- **Bootstrap 5** is loaded globally for grid, buttons, and utilities.
- **Google Fonts**: Playfair Display (headings/nav labels), Josefin Slab (titles), Lato (metadata).
- `frontend/src/styles.scss` sets `html { font-size: 14px }` — this aligns rem-based sizes with the legacy Bootstrap 3 app which used a 10px root (Bootstrap 5 defaults to 16px).
- Component SCSS files use **encapsulated class names**. Avoid reusing class names that appear in `styles.scss` (e.g. `.imageSettings`, `.resultList`) — Angular's component encapsulation adds an attribute selector, but global styles still win on specificity for matching class names.

---

## Deployment (Heroku)

`npm start` → `node ./bin/www` → Express listens on `process.env.PORT`.

On each deploy, Heroku runs `heroku-postbuild` before starting the server:
```bash
cd frontend && npm install && npm run build
```
This produces `frontend/dist/frontend/browser/` which Express serves as static files. No separate frontend server is needed in production.

Required Heroku config vars: `TMDB_API_KEY`, `JWT_SECRET`, `SESSION_SECRET`, `MONGODB_URL`, `NODE_ENV=production`.
