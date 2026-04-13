import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CompanyService } from '../../../core/services/company.service';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card.component';
import { ShowCardComponent } from '../../../shared/components/show-card/show-card.component';
import { Movie } from '../../../models/movie.model';
import { Show } from '../../../models/show.model';

@Component({
  selector: 'app-company-based',
  standalone: true,
  imports: [CommonModule, MovieCardComponent, ShowCardComponent],
  templateUrl: './company-based.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyBasedComponent implements OnInit {
  movies = signal<Movie[]>([]);
  shows = signal<Show[]>([]);
  title = signal('');
  loading = signal(true);
  error = signal<string | null>(null);
  isTV = false;

  constructor(private route: ActivatedRoute, private router: Router, private svc: CompanyService) {}

  ngOnInit(): void {
    this.isTV = this.router.url.includes('/tv/');
    const id = this.route.snapshot.paramMap.get('id')!;
    if (this.isTV) {
      this.title.set('Network Shows');
      this.svc.getShowsByNetwork(id).subscribe({
        next: (shows) => { this.shows.set(shows); this.loading.set(false); },
        error: () => { this.error.set('Failed to load.'); this.loading.set(false); },
      });
    } else {
      this.title.set('Company Movies');
      this.svc.getMoviesByCompany(id).subscribe({
        next: (movies) => { this.movies.set(movies); this.loading.set(false); },
        error: () => { this.error.set('Failed to load.'); this.loading.set(false); },
      });
    }
  }
}
