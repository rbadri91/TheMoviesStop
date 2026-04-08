import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../../models/movie.model';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './movie-card.component.html',
  styles: [':host { display: contents; }'],
})
export class MovieCardComponent {
  @Input({ required: true }) movie!: Movie;
  readonly posterBase = 'https://image.tmdb.org/t/p/w300';
}
