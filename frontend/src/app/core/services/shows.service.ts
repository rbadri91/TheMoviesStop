import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Show, ShowListResponse, SeasonDetail, ShowSummaryResponse } from '../../models/show.model';
import { StateService } from './state.service';
import { AuthService } from './auth.service';
import { UserMediaStatus } from '../../models/movie.model';

@Injectable({ providedIn: 'root' })
export class ShowsService {
  constructor(private http: HttpClient, private state: StateService, private auth: AuthService) {}

  getUserShowStatus(showId: number): Observable<UserMediaStatus> {
    const userId = this.auth.currentUserId();
    return this.http.get<UserMediaStatus>(`/api/user/${userId}/tvLikedAndToWatch/${showId}`);
  }

  addToWatchList(showId: number): Observable<unknown> {
    return this.http.post('/api/user/tv/addToWatchList', { showId });
  }

  addToFavorites(showId: number): Observable<unknown> {
    return this.http.post('/api/user/tv/addToFavorites', { showId });
  }

  rateShow(showId: number, ratingVal: number): Observable<unknown> {
    return this.http.post('/api/user/tv/rate', { showId, ratingVal });
  }

  getPopular(page = 1): Observable<ShowListResponse> {
    return this.http.get<ShowListResponse>(`/api/tv/popular?page=${page}`);
  }

  getTopRated(page = 1): Observable<ShowListResponse> {
    return this.http.get<ShowListResponse>(`/api/tv/top?page=${page}`);
  }

  getOnTV(page = 1): Observable<ShowListResponse> {
    return this.http.get<ShowListResponse>(`/api/tv/onTV?page=${page}`);
  }

  getAiringToday(page = 1): Observable<ShowListResponse> {
    return this.http.get<ShowListResponse>(`/api/tv/airingToday?page=${page}`);
  }

  getShowDetails(id: number | string): Observable<Show> {
    return this.http
      .get<Show>(`/api/tv/${id}`)
      .pipe(tap((show) => this.state.selectedShow.set(show)));
  }

  getAllSeasonDetails(id: number | string): Observable<SeasonDetail[]> {
    return this.http.get<SeasonDetail[]>(`/api/tv/${id}/allseason`);
  }

  getAISummary(showId: number): Observable<ShowSummaryResponse> {
    return this.http.post<ShowSummaryResponse>(`/api/tv/${showId}/summary`, {});
  }
}
