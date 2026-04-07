import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { GenreService } from '../../../core/services/genre.service';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card.component';
import { Movie } from '../../../models/movie.model';

@Component({
  selector: 'app-genre',
  standalone: true,
  imports: [CommonModule, MovieCardComponent],
  templateUrl: './genre.component.html',
})
export class GenreComponent implements OnInit {
  movies = signal<Movie[]>([]);
  genreName = signal('');
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private route: ActivatedRoute, private svc: GenreService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      movies: this.svc.getMoviesByGenre(id),
      genres: this.svc.getGenres(),
    }).subscribe({
      next: ({ movies, genres }) => {
        this.movies.set(movies);
        this.genreName.set(genres.find((g) => g.id === +id)?.name ?? 'Genre');
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load.'); this.loading.set(false); },
    });
  }
}
