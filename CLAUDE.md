# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start the server (production)
npm start

# Start with auto-reload on changes
npm run start:dev

# Rebuild index.ejs script/CSS includes after adding/removing frontend files
grunt includeSource

# Watch for frontend file changes and auto-rebuild includes
grunt watch
```

The app requires **Memcached** running on `127.0.0.1:11211` and **MongoDB** running locally.

## Architecture

This is a full-stack Node.js + AngularJS 1.x app that wraps The Movie Database (TMDB) API.

### Backend (`routes/index.js`)
All API routes are defined in a single file exported as a factory function receiving `(router, passport)`. It proxies TMDB API requests to the frontend and handles user auth/data:

- **HTTP fetching**: Most endpoints use the `getdata()` helper (Node `https` module). Some endpoints (`getShowingNowMovies`, `getSeasonInfo`) use `node-libcurl` instead — this was introduced to fix intermittent 400 errors from TMDB.
- **Caching**: Memcached is initialized but minimally used (stores season count for TV shows in session).
- **Auth**: JWT-based via `express-jwt`. Secret is hardcoded as `'SECRET'`. User data (watchlist, favorites, ratings) is stored in MongoDB via Mongoose.
- **Session**: `express-session` stores `numSeasons` and `hasSeason0` for the `/tv/:show/allseason` endpoint — these must be set by first calling `/tv/:show`.

### Frontend (`public/`)
AngularJS 1.x SPA loaded via a single `views/index.ejs` shell. The app module is `themoviesStop`.

- **Module bootstrap**: `public/javascripts/sampleCode.js` defines the Angular module and `ui-router` states (only `home`, `login`, `register` are defined here; other states are defined in individual controllers).
- **Services** (`public/common/services/`): Each service wraps HTTP calls to the Node backend. `movies.service.js`, `shows.service.js`, `people.service.js`, etc.
- **Controllers** (`public/controllers/`): One controller per view, injecting the relevant service.
- **Templates** (`public/templates/`): EJS files served as Angular templates via ui-router `templateUrl`.
- **Directives** (`public/common/directives/`): `navigation` directive for the nav bar; `compareTo` for password confirmation; `fireStarEvent` for ratings UI.

### Script/CSS inclusion
`views/index.ejs` uses `grunt-include-source` comment markers to auto-include all `public/**/*.js` and `public/**/*.css` files. Run `grunt includeSource` after adding or removing frontend JS/CSS files, otherwise they won't be loaded.

### Data flow
Browser → AngularJS service (`$http`) → Express route → TMDB API → response back through the chain. No server-side rendering of data; the Express backend is purely an API proxy + auth layer.
