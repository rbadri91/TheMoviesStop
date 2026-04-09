import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MoviesService } from '../../../core/services/movies.service';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card.component';
import { Movie } from '../../../models/movie.model';

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
  imports: [CommonModule, MovieCardComponent],
  templateUrl: './movie-list.component.html',
})
export class MovieListComponent implements OnInit {
  movies = signal<Movie[]>([]);
  title = signal('Movies');
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private svc: MoviesService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const mode = this.route.snapshot.url[1]?.path as ListMode;
    this.title.set(TITLES[mode] ?? 'Movies');
    this.fetch(mode).subscribe({
      next: (movies) => { this.movies.set(movies); this.loading.set(false); },
      error: () => { this.error.set('Failed to load movies.'); this.loading.set(false); },
    });
  }

  private fetch(mode: ListMode): Observable<Movie[]> {
    switch (mode) {
      case 'popular':       return this.svc.getPopular();
      case 'top':           return this.svc.getTopRated();
      case 'comingUp':      return this.svc.getUpcoming().pipe(
        map((movies) => {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          return movies.filter(m => m.release_date && new Date(m.release_date) >= today);
        })
      );
      case 'showingnow':    return this.svc.getShowingNow();
      case 'openingthisweek': return this.svc.getOpeningThisWeek().pipe(map((r) => r.results));
    }
  }
}
