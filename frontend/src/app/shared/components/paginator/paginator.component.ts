import { Component, Input, Output, EventEmitter, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorComponent {
  @Input() set currentPage(val: number) { this._current.set(val); }
  @Input() set totalPages(val: number) { this._total.set(val); }
  @Output() pageChange = new EventEmitter<number>();

  readonly _current = signal(1);
  readonly _total = signal(1);

  readonly pages = computed(() => {
    const total = this._total();
    const current = this._current();
    const delta = 2;
    const range: (number | '...')[] = [];
    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    range.push(1);
    if (left > 2) range.push('...');
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - 1) range.push('...');
    if (total > 1) range.push(total);
    return range;
  });

  go(page: number | '...'): void {
    if (page === '...' || page === this._current()) return;
    this.pageChange.emit(page);
  }

  prev(): void {
    if (this._current() > 1) this.pageChange.emit(this._current() - 1);
  }

  next(): void {
    if (this._current() < this._total()) this.pageChange.emit(this._current() + 1);
  }
}
