import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { GenreService } from '../../../core/services/genre.service';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card.component';
import { ShowCardComponent } from '../../../shared/components/show-card/show-card.component';
import { Movie } from '../../../models/movie.model';
import { Show } from '../../../models/show.model';

@Component({
  selector: 'app-genre',
  standalone: true,
  imports: [CommonModule, MovieCardComponent, ShowCardComponent],
  templateUrl: './genre.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenreComponent implements OnInit {
  movies = signal<Movie[]>([]);
  shows = signal<Show[]>([]);
  genreName = signal('');
  loading = signal(true);
  error = signal<string | null>(null);
  isTV = false;

  constructor(private route: ActivatedRoute, private router: Router, private svc: GenreService) {}

  ngOnInit(): void {
    this.isTV = this.router.url.includes('/tv/');
    const id = this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      items: this.isTV ? this.svc.getShowsByGenre(id) : this.svc.getMoviesByGenre(id),
      genres: this.svc.getGenres(),
    }).subscribe({
      next: ({ items, genres }) => {
        if (this.isTV) {
          this.shows.set(items as Show[]);
        } else {
          this.movies.set(items as Movie[]);
        }
        this.genreName.set(genres.find((g) => g.id === +id)?.name ?? 'Genre');
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load.'); this.loading.set(false); },
    });
  }
}
