import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MoviesService } from '../../../core/services/movies.service';
import { AuthService } from '../../../core/services/auth.service';
import { StateService } from '../../../core/services/state.service';
import { Movie } from '../../../models/movie.model';
import { HtmlizePipe } from '../../../shared/pipes/htmlize.pipe';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HtmlizePipe, StarRatingComponent],
  templateUrl: './movie-detail.component.html',
  styleUrl: './movie-detail.component.scss',
})
export class MovieDetailComponent implements OnInit {
  movie = signal<Movie | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeSection = signal('cast');
  inWatchList = signal(false);
  inFavorites = signal(false);
  userRating = signal(0);

  readonly posterBase = 'https://image.tmdb.org/t/p/w300';
  readonly backdropBase = 'https://image.tmdb.org/t/p/w1280';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: MoviesService,
    public auth: AuthService,
    private state: StateService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id')!;
      this.loading.set(true);
      this.error.set(null);
      this.movie.set(null);
      this.svc.getMovieDetails(id).subscribe({
        next: (movie) => {
          this.movie.set(movie);
          this.loading.set(false);
          if (this.auth.isLoggedIn()) {
            this.svc.getUserMediaStatus(movie.id).subscribe((status) => {
              this.inWatchList.set(status.isInWatchList);
              this.inFavorites.set(status.isInFavoritesList);
              this.userRating.set(status.userRating ?? 0);
            });
          }
        },
        error: () => { this.error.set('Failed to load movie.'); this.loading.set(false); },
      });
    });
  }

  getIframeSrc(key: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${key}`
    );
  }

  getReleaseYear(date: string): string {
    return date?.substring(0, date.indexOf('-')) ?? '';
  }

  getRuntime(mins: number): string {
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  getReleaseDate(date: string): string {
    const d = new Date(date);
    return `${d.getDate()} ${d.toLocaleString('en-us', { month: 'long' })} ${d.getFullYear()}`;
  }

  getCertificate(countries: { iso_3166_1: string; certification: string }[]): string {
    if (!countries?.length) return 'N/A';
    const us = countries.find((c) => c.iso_3166_1 === 'US');
    const cert = us?.certification || countries[0]?.certification || '';
    return cert || 'N/A';
  }

  numberWithCommas(x: number): string {
    return x?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') ?? '0';
  }

  scrollTo(section: string): void {
    this.activeSection.set(section);
    const el = document.querySelector(`.${section}-section`);
    el?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleWatchList(): void {
    const m = this.movie();
    if (!m) return;
    this.svc.addToWatchList(m.id).subscribe();
    this.inWatchList.set(!this.inWatchList());
  }

  toggleFavorites(): void {
    const m = this.movie();
    if (!m) return;
    this.svc.addToFavorites(m.id).subscribe();
    this.inFavorites.set(!this.inFavorites());
  }

  onRate(rating: number): void {
    const m = this.movie();
    if (!m) return;
    this.svc.rateMovie(m.id, rating).subscribe();
    this.userRating.set(rating);
  }
}
