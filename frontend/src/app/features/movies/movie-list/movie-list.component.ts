import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MoviesService } from '../../../core/services/movies.service';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card.component';
import { PaginatorComponent } from '../../../shared/components/paginator/paginator.component';
import { Movie, MovieListResponse } from '../../../models/movie.model';

type ListMode = 'popular' | 'top' | 'comingUp' | 'showingnow' | 'openingthisweek';

const TITLES: Record<ListMode, string> = {
  popular: 'Popular Movies',
  top: 'Top Rated Movies',
  comingUp: 'Upcoming Movies',
  showingnow: 'Now Showing',
  openingthisweek: 'Opening This Week',
};

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [CommonModule, MovieCardComponent, PaginatorComponent],
  templateUrl: './movie-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieListComponent implements OnInit {
  movies = signal<Movie[]>([]);
  title = signal('Movies');
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);

  private mode!: ListMode;

  constructor(private svc: MoviesService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.mode = this.route.snapshot.url[1]?.path as ListMode;
    this.title.set(TITLES[this.mode] ?? 'Movies');
    this.load(1);
  }

  onPageChange(page: number): void {
    this.load(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private load(page: number): void {
    this.loading.set(true);
    this.currentPage.set(page);
    this.fetch(this.mode, page).subscribe({
      next: (res) => {
        this.movies.set(res.results);
        this.totalPages.set(res.total_pages);
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load movies.'); this.loading.set(false); },
    });
  }

  private fetch(mode: ListMode, page: number): Observable<MovieListResponse> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    switch (mode) {
      case 'popular':         return this.svc.getPopular(page);
      case 'top':             return this.svc.getTopRated(page);
      case 'comingUp':        return this.svc.getUpcoming(page).pipe(
        map((res) => ({ ...res, results: res.results.filter(m => m.release_date && new Date(m.release_date) >= today) }))
      );
      case 'showingnow':      return this.svc.getShowingNow(page);
      case 'openingthisweek': return this.svc.getOpeningThisWeek();
    }
  }
}
