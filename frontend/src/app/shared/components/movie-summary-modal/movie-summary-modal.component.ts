import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-movie-summary-modal',
  standalone: true,
  template: `
    <div class="modal-header">
      <h5 class="modal-title">&#10024; AI Summary</h5>
      <button type="button" class="btn-close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <h6 class="summaryMovieTitle">{{ title }}</h6>
      <p class="summaryText">{{ summary }}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary btn-sm" (click)="activeModal.close()">Close</button>
    </div>
  `,
  styles: [`
    .summaryMovieTitle { font-weight: 700; margin-bottom: 12px; }
    .summaryText { line-height: 1.7; color: #333; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieSummaryModalComponent {
  @Input() title = '';
  @Input() summary = '';

  constructor(public activeModal: NgbActiveModal) {}
}
