import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Movie, MovieListResponse, UserMediaStatus } from '../../models/movie.model';
import { StateService } from './state.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  constructor(
    private http: HttpClient,
    private state: StateService,
    private auth: AuthService
  ) {}

  getPopular(): Observable<Movie[]> {
    return this.http
      .get<MovieListResponse>('/api/movies/popular')
      .pipe(map((res) => res.results));
  }

  getTopRated(): Observable<Movie[]> {
    return this.http
      .get<MovieListResponse>('/api/movies/top')
      .pipe(map((res) => res.results));
  }

  getUpcoming(): Observable<Movie[]> {
    return this.http
      .get<MovieListResponse>('/api/movies/upcoming')
      .pipe(map((res) => res.results));
  }

  getShowingNow(): Observable<Movie[]> {
    return this.http
      .get<MovieListResponse>('/api/movies/showingnow')
      .pipe(map((res) => res.results));
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
    return this.http
      .get<{ isInFavoritesList: string; isInWatchList: string }>(
        `/api/user/${userId}/moviesLikedAndtoWatch/${movieId}`
      )
      .pipe(
        map((res) => ({
          isInFavoritesList: JSON.parse(res.isInFavoritesList),
          isInWatchList: JSON.parse(res.isInWatchList),
        }))
      );
  }

  addToFavorites(movieId: number): Observable<unknown> {
    return this.http.post('/api/user/movies/addToFavorites/', { movieId });
  }

  addToWatchList(movieId: number): Observable<unknown> {
    return this.http.post('/api/user/movies/addToWatchList', { movieId });
  }
}
