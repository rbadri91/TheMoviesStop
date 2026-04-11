import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
})
export class StarRatingComponent {
  @Input() set rating(val: number) { this._rating.set(val); }
  @Output() ratingChange = new EventEmitter<number>();

  readonly _rating = signal(0);
  readonly hovered = signal(0);
  readonly stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  getStarClass(star: number): string {
    const active = this.hovered() || this._rating();
    return star <= active ? 'star filled' : 'star';
  }

  onHover(star: number): void { this.hovered.set(star); }
  onLeave(): void { this.hovered.set(0); }

  onClick(star: number): void {
    const newRating = star === this._rating() ? 0 : star;
    this._rating.set(newRating);
    this.ratingChange.emit(newRating);
  }
}
