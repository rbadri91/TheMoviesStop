import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Person, PersonListResponse } from '../../models/person.model';
import { StateService } from './state.service';

@Injectable({ providedIn: 'root' })
export class PeopleService {
  constructor(private http: HttpClient, private state: StateService) {}

  getPopular(): Observable<Person[]> {
    return this.http.get<PersonListResponse>('/api/people/popular').pipe(
      map((res) => res.results.map((p) => this._withKnownFor(p)))
    );
  }

  getPeopleDetails(id: number | string): Observable<Person> {
    return this.http
      .get<Person>(`/api/people/${id}`)
      .pipe(tap((person) => this.state.selectedPerson.set(person)));
  }

  /** Builds a comma-separated "known for" string, matching the AngularJS service logic. */
  private _withKnownFor(person: Person): Person {
    const knownFor = (person.known_for ?? [])
      .map((k) => k.original_title ?? k.original_name ?? '')
      .filter(Boolean)
      .join(', ');
    return { ...person, knownFor };
  }
}
