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

  // Profile
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'change-password',
    loadComponent: () => import('./features/auth/change-password/change-password.component').then((m) => m.ChangePasswordComponent),
    canActivate: [authGuard],
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

  // TV Shows — list views
  {
    path: 'tv/popular',
    loadComponent: () => import('./features/tv/show-list/show-list.component').then((m) => m.ShowListComponent),
  },
  {
    path: 'tv/top',
    loadComponent: () => import('./features/tv/show-list/show-list.component').then((m) => m.ShowListComponent),
  },
  {
    path: 'tv/onTV',
    loadComponent: () => import('./features/tv/show-list/show-list.component').then((m) => m.ShowListComponent),
  },
  {
    path: 'tv/airingToday',
    loadComponent: () => import('./features/tv/show-list/show-list.component').then((m) => m.ShowListComponent),
  },

  // TV Shows — detail & child routes
  {
    path: 'tv/desc/:id',
    loadComponent: () => import('./features/tv/show-detail/show-detail.component').then((m) => m.ShowDetailComponent),
  },
  {
    path: 'tv/desc/:id/fullCast',
    loadComponent: () => import('./features/movies/full-cast/full-cast.component').then((m) => m.FullCastComponent),
  },
  {
    path: 'tv/desc/:id/reviews',
    loadComponent: () => import('./features/movies/reviews/reviews.component').then((m) => m.ReviewsComponent),
  },
  {
    path: 'tv/desc/:id/allseason',
    loadComponent: () => import('./features/tv/all-seasons/all-seasons.component').then((m) => m.AllSeasonsComponent),
  },

  // TV Shows — filtered views
  {
    path: 'tv/genre/:id',
    loadComponent: () => import('./features/movies/genre/genre.component').then((m) => m.GenreComponent),
  },
  {
    path: 'tv/network/:id',
    loadComponent: () => import('./features/movies/company-based/company-based.component').then((m) => m.CompanyBasedComponent),
  },

  // People
  {
    path: 'people/popular',
    loadComponent: () => import('./features/people/people-list/people-list.component').then((m) => m.PeopleListComponent),
  },
  {
    path: 'people/desc/:id',
    loadComponent: () => import('./features/people/person-detail/person-detail.component').then((m) => m.PersonDetailComponent),
  },

  { path: '**', redirectTo: 'home' },
];
