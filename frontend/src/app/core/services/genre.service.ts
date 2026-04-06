import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { Movie, MovieListResponse } from '../../models/movie.model';
import { Show, ShowListResponse } from '../../models/show.model';
import { Genre } from '../../models/movie.model';

@Injectable({ providedIn: 'root' })
export class GenreService {
  /** Cached genre list — fetched once and shared. */
  private readonly genres$: Observable<Genre[]>;

  constructor(private http: HttpClient) {
    this.genres$ = this.http
      .get<Genre[]>('/genres.json')
      .pipe(shareReplay(1));
  }

  getGenres(): Observable<Genre[]> {
    return this.genres$;
  }

  getMoviesByGenre(genreId: number | string): Observable<Movie[]> {
    return this.http
      .get<MovieListResponse>(`/api/movies/genre/${genreId}`)
      .pipe(map((res) => res.results));
  }

  getShowsByGenre(genreId: number | string): Observable<Show[]> {
    return this.http
      .get<ShowListResponse>(`/api/tv/genre/${genreId}`)
      .pipe(map((res) => res.results));
  }
}
