import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ShowsService } from '../../../core/services/shows.service';
import { AuthService } from '../../../core/services/auth.service';
import { StateService } from '../../../core/services/state.service';
import { Show } from '../../../models/show.model';
import { HtmlizePipe } from '../../../shared/pipes/htmlize.pipe';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-show-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HtmlizePipe, StarRatingComponent],
  templateUrl: './show-detail.component.html',
  styleUrl: './show-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowDetailComponent implements OnInit {
  show = signal<Show | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeSection = signal('cast');
  inWatchList = signal(false);
  inFavorites = signal(false);
  userRating = signal(0);

  readonly posterBase = 'https://image.tmdb.org/t/p/w300';
  readonly backdropBase = 'https://image.tmdb.org/t/p/w1280';

  readonly videoSrcs = computed(() => {
    const vids = this.show()?.videos?.results ?? [];
    return new Map(vids.map(v => [v.key, this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${v.key}`)]));
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: ShowsService,
    public auth: AuthService,
    private state: StateService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id')!;
      this.loading.set(true);
      this.error.set(null);
      this.show.set(null);
      this.svc.getShowDetails(id).subscribe({
        next: (show) => {
          this.show.set(show);
          this.loading.set(false);
          if (this.auth.isLoggedIn()) {
            this.svc.getUserShowStatus(show.id).subscribe((status) => {
              this.inWatchList.set(status.isInWatchList);
              this.inFavorites.set(status.isInFavoritesList);
              this.userRating.set(status.userRating ?? 0);
            });
          }
        },
        error: () => { this.error.set('Failed to load show.'); this.loading.set(false); },
      });
    });
  }

  getFirstAirYear(date: string): string {
    return date?.substring(0, date.indexOf('-')) ?? '';
  }

  getEpisodeRuntime(times: number[]): string {
    if (!times?.length) return '';
    return times.map(t => `${t}m`).join(', ');
  }

  getCertificate(ratings: { iso_3166_1: string; rating: string }[]): string {
    if (!ratings?.length) return 'N/A';
    const us = ratings.find(r => r.iso_3166_1 === 'US');
    return us?.rating || ratings[0]?.rating || 'N/A';
  }

  scrollTo(section: string): void {
    this.activeSection.set(section);
    const el = document.querySelector(`.${section}-section`);
    el?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleWatchList(): void {
    const s = this.show();
    if (!s) return;
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    const prev = this.inWatchList();
    this.inWatchList.set(!prev);
    this.svc.addToWatchList(s.id).subscribe({
      error: () => this.inWatchList.set(prev),
    });
  }

  toggleFavorites(): void {
    const s = this.show();
    if (!s) return;
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    const prev = this.inFavorites();
    this.inFavorites.set(!prev);
    this.svc.addToFavorites(s.id).subscribe({
      error: () => this.inFavorites.set(prev),
    });
  }

  onRate(rating: number): void {
    const s = this.show();
    if (!s) return;
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    const prev = this.userRating();
    this.userRating.set(rating);
    this.svc.rateShow(s.id, rating).subscribe({
      error: () => this.userRating.set(prev),
    });
  }
}
