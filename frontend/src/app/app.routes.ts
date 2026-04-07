import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Auth
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },

  // Home
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },

  // Movies — list views (single component, mode derived from URL segment)
  {
    path: 'movies/popular',
    loadComponent: () => import('./features/movies/movie-list/movie-list.component').then((m) => m.MovieListComponent),
  },
  {
    path: 'movies/top',
    loadComponent: () => import('./features/movies/movie-list/movie-list.component').then((m) => m.MovieListComponent),
  },
  {
    path: 'movies/comingUp',
    loadComponent: () => import('./features/movies/movie-list/movie-list.component').then((m) => m.MovieListComponent),
  },
  {
    path: 'movies/showingnow',
    loadComponent: () => import('./features/movies/movie-list/movie-list.component').then((m) => m.MovieListComponent),
  },
  {
    path: 'movies/openingthisweek',
    loadComponent: () => import('./features/movies/movie-list/movie-list.component').then((m) => m.MovieListComponent),
  },

  // Movies — detail & child routes
  {
    path: 'movies/desc/:id',
    loadComponent: () => import('./features/movies/movie-detail/movie-detail.component').then((m) => m.MovieDetailComponent),
  },
  {
    path: 'movies/desc/:id/fullCast',
    loadComponent: () => import('./features/movies/full-cast/full-cast.component').then((m) => m.FullCastComponent),
  },
  {
    path: 'movies/desc/:id/reviews',
    loadComponent: () => import('./features/movies/reviews/reviews.component').then((m) => m.ReviewsComponent),
  },
  {
    path: 'movies/desc/:id/allCompanies',
    loadComponent: () => import('./features/movies/company-list/company-list.component').then((m) => m.CompanyListComponent),
  },

  // Movies — company/genre filtered
  {
    path: 'movies/company/:id',
    loadComponent: () => import('./features/movies/company-based/company-based.component').then((m) => m.CompanyBasedComponent),
  },
  {
    path: 'movies/genre/:id',
    loadComponent: () => import('./features/movies/genre/genre.component').then((m) => m.GenreComponent),
  },

  // Phase 5: TV shows, People routes go here
  { path: '**', redirectTo: 'home' },
];
