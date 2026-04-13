import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Movie, MovieListResponse, UserMediaStatus, MovieSummaryResponse } from '../../models/movie.model';
import { StateService } from './state.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  constructor(
    private http: HttpClient,
    private state: StateService,
    private auth: AuthService
  ) {}

  getPopular(page = 1): Observable<MovieListResponse> {
    return this.http.get<MovieListResponse>(`/api/movies/popular?page=${page}`);
  }

  getTopRated(page = 1): Observable<MovieListResponse> {
    return this.http.get<MovieListResponse>(`/api/movies/top?page=${page}`);
  }

  getUpcoming(page = 1): Observable<MovieListResponse> {
    return this.http.get<MovieListResponse>(`/api/movies/upcoming?page=${page}`);
  }

  getShowingNow(page = 1): Observable<MovieListResponse> {
    return this.http.get<MovieListResponse>(`/api/movies/showingnow?page=${page}`);
  }

  getOpeningThisWeek(): Observable<MovieListResponse> {
    return this.http.get<MovieListResponse>('/api/movies/openingThisWeek');
  }

  getMovieDetails(id: number | string): Observable<Movie> {
    return this.http.get<Movie>(`/api/movies/${id}`).pipe(
      tap((movie) => this.state.selectedMovie.set(movie))
    );
  }

  getUserMediaStatus(movieId: number): Observable<UserMediaStatus> {
    const userId = this.auth.currentUserId();
    return this.http.get<UserMediaStatus>(
      `/api/user/${userId}/moviesLikedAndtoWatch/${movieId}`
    );
  }

  addToFavorites(movieId: number): Observable<unknown> {
    return this.http.post('/api/user/movies/addToFavorites/', { movieId });
  }

  addToWatchList(movieId: number): Observable<unknown> {
    return this.http.post('/api/user/movies/addToWatchList', { movieId });
  }

  rateMovie(movieId: number, ratingVal: number): Observable<unknown> {
    return this.http.post('/api/user/movies/rate/', { movieId, ratingVal });
  }

  getAISummary(movieId: number): Observable<MovieSummaryResponse> {
    return this.http.post<MovieSummaryResponse>(`/api/movies/${movieId}/summary`, {});
  }
}
