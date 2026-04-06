import { Injectable, signal } from '@angular/core';
import { Movie } from '../../models/movie.model';
import { Show } from '../../models/show.model';
import { Person } from '../../models/person.model';

/**
 * Replaces AngularJS $localStorage for passing data between routes.
 * Holds the currently selected movie/show/person detail so that
 * child routes (fullCast, reviews, seasons) can read it without
 * re-fetching from the API.
 */
@Injectable({ providedIn: 'root' })
export class StateService {
  readonly selectedMovie = signal<Movie | null>(null);
  readonly selectedShow = signal<Show | null>(null);
  readonly selectedPerson = signal<Person | null>(null);
}
