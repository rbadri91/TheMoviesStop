import { Component, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Movie } from '../../../models/movie.model';
import { MoviesService } from '../../../core/services/movies.service';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './movie-card.component.html',
  styleUrl: './movie-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieCardComponent {
  @Input({ required: true }) movie!: Movie;

  readonly posterBase = 'https://image.tmdb.org/t/p/w300';
  readonly summary = signal<string | null>(null);
  readonly summaryLoading = signal(false);
  readonly summaryError = signal<string | null>(null);

  constructor(private svc: MoviesService) {}

  loadSummary(): void {
    if (this.summary() || this.summaryLoading()) return;
    this.summaryLoading.set(true);
    this.summaryError.set(null);
    this.svc.getAISummary(this.movie.id).subscribe({
      next: (res) => {
        this.summary.set(res.summary);
        this.summaryLoading.set(false);
      },
      error: () => {
        this.summaryError.set('Could not load summary. Please try again.');
        this.summaryLoading.set(false);
      },
    });
  }
}
