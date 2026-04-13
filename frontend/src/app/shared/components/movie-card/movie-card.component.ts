import { Component, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Movie } from '../../../models/movie.model';
import { MoviesService } from '../../../core/services/movies.service';
import { MovieSummaryModalComponent } from '../movie-summary-modal/movie-summary-modal.component';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [RouterLink],
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

  constructor(private svc: MoviesService, private modal: NgbModal) {}

  loadSummary(): void {
    if (this.summaryLoading()) return;
    // Already fetched — just re-open the modal
    if (this.summary()) {
      this.openModal();
      return;
    }
    this.summaryLoading.set(true);
    this.summaryError.set(null);
    this.svc.getAISummary(this.movie.id).subscribe({
      next: (res) => {
        this.summary.set(res.summary);
        this.summaryLoading.set(false);
        this.openModal();
      },
      error: () => {
        this.summaryError.set('Could not load summary.');
        this.summaryLoading.set(false);
      },
    });
  }

  private openModal(): void {
    const ref = this.modal.open(MovieSummaryModalComponent, { size: 'lg', centered: true });
    ref.componentInstance.title = this.movie.title;
    ref.componentInstance.summary = this.summary()!;
  }
}
