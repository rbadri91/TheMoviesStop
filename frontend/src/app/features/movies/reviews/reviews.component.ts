import { Component, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StateService } from '../../../core/services/state.service';
import { Review } from '../../../models/movie.model';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
})
export class ReviewsComponent {
  readonly posterBase = 'https://image.tmdb.org/t/p/w300';

  /** Works for both movie and show — whichever was last selected. */
  readonly media = computed(() => {
    const movie = this.state.selectedMovie();
    const show = this.state.selectedShow();
    // Prefer show if current URL has /tv/, else movie
    const url = this.route.snapshot.pathFromRoot.map((s) => s.url.join('/')).join('/');
    return url.includes('/tv/') ? show : movie;
  });

  readonly reviews = computed<Review[]>(() => this.media()?.reviews?.results ?? []);

  constructor(private state: StateService, private route: ActivatedRoute) {}

  getMediaTitle(m: any): string {
    return m?.title ?? m?.name ?? '';
  }
}
