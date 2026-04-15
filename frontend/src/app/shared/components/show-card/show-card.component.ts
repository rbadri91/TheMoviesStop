import { Component, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Show } from '../../../models/show.model';
import { ShowsService } from '../../../core/services/shows.service';
import { MovieSummaryModalComponent } from '../movie-summary-modal/movie-summary-modal.component';

@Component({
  selector: 'app-show-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './show-card.component.html',
  styleUrl: './show-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowCardComponent {
  @Input({ required: true }) show!: Show;

  readonly posterBase = 'https://image.tmdb.org/t/p/w300';
  readonly summary = signal<string | null>(null);
  readonly summaryLoading = signal(false);
  readonly summaryError = signal<string | null>(null);

  constructor(private svc: ShowsService, private modal: NgbModal) {}

  loadSummary(): void {
    if (this.summaryLoading()) return;
    if (this.summary()) {
      this.openModal();
      return;
    }
    this.summaryLoading.set(true);
    this.summaryError.set(null);
    this.svc.getAISummary(this.show.id).subscribe({
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
    ref.componentInstance.title = this.show.name;
    ref.componentInstance.summary = this.summary()!;
  }
}
