import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Show } from '../../../models/show.model';

@Component({
  selector: 'app-show-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './show-card.component.html',
  styles: [':host { display: contents; }'],
})
export class ShowCardComponent {
  @Input({ required: true }) show!: Show;
  readonly posterBase = 'https://image.tmdb.org/t/p/w300';
}
