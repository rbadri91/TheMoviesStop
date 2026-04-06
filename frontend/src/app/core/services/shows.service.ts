import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Show, ShowListResponse, SeasonDetail } from '../../models/show.model';
import { StateService } from './state.service';

@Injectable({ providedIn: 'root' })
export class ShowsService {
  constructor(private http: HttpClient, private state: StateService) {}

  getPopular(): Observable<Show[]> {
    return this.http
      .get<ShowListResponse>('/api/tv/popular')
      .pipe(map((res) => res.results));
  }

  getTopRated(): Observable<Show[]> {
    return this.http
      .get<ShowListResponse>('/api/tv/top')
      .pipe(map((res) => res.results));
  }

  getOnTV(): Observable<Show[]> {
    return this.http
      .get<ShowListResponse>('/api/tv/onTV')
      .pipe(map((res) => res.results));
  }

  getAiringToday(): Observable<Show[]> {
    return this.http
      .get<ShowListResponse>('/api/tv/airingToday')
      .pipe(map((res) => res.results));
  }

  getShowDetails(id: number | string): Observable<Show> {
    return this.http
      .get<Show>(`/api/tv/${id}`)
      .pipe(tap((show) => this.state.selectedShow.set(show)));
  }

  getAllSeasonDetails(id: number | string): Observable<SeasonDetail[]> {
    return this.http.get<SeasonDetail[]>(`/api/tv/${id}/allseason`);
  }
}
