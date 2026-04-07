import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movie } from '../../models/movie.model';

export interface AllMediaFeeds {
  upcoming: { results: Movie[] };
  nowShowing: { results: Movie[] };
  OpeningThisWeek: { results: Movie[] };
}

@Injectable({ providedIn: 'root' })
export class AllMediaService {
  constructor(private http: HttpClient) {}

  getAllMediaDetails(): Observable<AllMediaFeeds> {
    return this.http.get<AllMediaFeeds>('/api/allFeeds');
  }
}
