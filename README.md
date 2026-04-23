# TheMoviesStop

A full-stack web app for discovering movies, TV shows, and people. Powered by the [TMDB API](https://www.themoviedb.org/), built with Angular 21 and Node.js.

## Features

- **Browse content** — popular, top-rated, upcoming, now showing, and opening-this-week movies; popular, top-rated, on-TV, and airing-today shows; popular people
- **Filter** — by genre, production company, or TV network
- **Detail pages** — full cast & crew, season info, reviews, trailers
- **AI summaries** — one-click Claude-generated summary for any movie or TV show
- **User accounts** — register, log in, change password, forgot/reset password via email
- **Watchlist & favorites** — add movies and shows to personal lists, toggle on/off
- **Ratings** — 10-star rating widget on movie and show pages
- **Profile page** — view all saved watchlist items, favorites, and ratings enriched with poster art
- **Light / dark theme** — persisted per browser, respects `prefers-color-scheme` on first load

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (standalone components, signals, OnPush, lazy routes) |
| Backend | Node.js + Express |
| Database | MongoDB via Mongoose |
| Auth | JWT (jsonwebtoken + express-jwt) + Passport local strategy |
| AI summaries | Anthropic Claude (Haiku) via MCP stdio servers |
| Styling | Bootstrap 5 + component-scoped SCSS + CSS custom properties |
| Tests | Jest + Supertest |
| Deployment | Heroku |

## Prerequisites

- Node.js 18+
- MongoDB running locally (default: `mongodb://localhost/`)
- Memcached running on `127.0.0.1:11211`
- A [TMDB API key](https://developer.themoviedb.org/docs/getting-started)
- (Optional) An Anthropic API key for AI summaries
- (Optional) SMTP credentials for password-reset emails

## Getting started

```bash
git clone https://github.com/rbadri91/TheMoviesStop.git
cd TheMoviesStop
npm install
```

Create a `.env` file in the project root:

```env
TMDB_API_KEY=your_tmdb_key
JWT_SECRET=a_random_secret
SESSION_SECRET=another_random_secret
MONGODB_URL=mongodb://localhost/themoviesstop

# Optional — AI summaries
ANTHROPIC_API_KEY=your_anthropic_key

# Optional — password reset emails
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=you@example.com
EMAIL_PASS=your_smtp_password
EMAIL_FROM=noreply@example.com
```

Build the Angular frontend:

```bash
cd frontend
npm install
npm run build
cd ..
```

Start the server:

```bash
npm start          # production
npm run start:dev  # auto-reload via nodemon
```

Open [http://localhost:3000](http://localhost:3000).

## Running tests

```bash
npm test
```

Tests connect to your local MongoDB (`MONGODB_URL` from `.env`). Each test suite creates and cleans up its own isolated test users. Rate limiters are automatically bypassed during tests.

## Project structure

```
TheMoviesStop/
├── app.js              # Express app — middleware, static serving, error handler
├── bin/www             # HTTP server entry point
├── routes/index.js     # All API route handlers
├── models/users.js     # Mongoose User schema (watchlist, favorites, ratings)
├── config/             # Passport and database config
├── mcp/                # MCP stdio servers for AI summaries
├── tests/              # Jest integration tests
└── frontend/           # Angular 21 SPA
    └── src/app/
        ├── core/       # Auth service, interceptors, guards, theme service
        ├── features/   # Page components (movies, TV, people, auth, profile)
        └── shared/     # Navbar, movie/show cards, star rating, paginator
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for a detailed breakdown of the backend routes, frontend conventions, and data flow.

## Deployment

The app is configured for Heroku. On each deploy, `heroku-postbuild` builds the Angular app automatically:

```bash
cd frontend && npm install && npm run build
```

Required config vars: `TMDB_API_KEY`, `JWT_SECRET`, `SESSION_SECRET`, `MONGODB_URL`, `NODE_ENV=production`.
