import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Movie, MovieListResponse } from '../../models/movie.model';
import { Show, ShowListResponse } from '../../models/show.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  constructor(private http: HttpClient) {}

  getMoviesByCompany(companyId: number | string): Observable<Movie[]> {
    return this.http
      .get<MovieListResponse>(`/api/movies/company/${companyId}`)
      .pipe(map((res) => res.results));
  }

  getShowsByNetwork(networkId: number | string): Observable<Show[]> {
    return this.http
      .get<ShowListResponse>(`/api/tv/network/${networkId}`)
      .pipe(map((res) => res.results));
  }
}
