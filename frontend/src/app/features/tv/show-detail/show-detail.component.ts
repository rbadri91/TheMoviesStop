import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ShowsService } from '../../../core/services/shows.service';
import { Show } from '../../../models/show.model';
import { HtmlizePipe } from '../../../shared/pipes/htmlize.pipe';

@Component({
  selector: 'app-show-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HtmlizePipe],
  templateUrl: './show-detail.component.html',
  styleUrl: './show-detail.component.scss',
})
export class ShowDetailComponent implements OnInit {
  show = signal<Show | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeSection = signal('cast');

  readonly posterBase = 'https://image.tmdb.org/t/p/w300';
  readonly backdropBase = 'https://image.tmdb.org/t/p/w1280';

  constructor(
    private route: ActivatedRoute,
    private svc: ShowsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id')!;
      this.loading.set(true);
      this.error.set(null);
      this.show.set(null);
      this.svc.getShowDetails(id).subscribe({
        next: (show) => { this.show.set(show); this.loading.set(false); },
        error: () => { this.error.set('Failed to load show.'); this.loading.set(false); },
      });
    });
  }

  getIframeSrc(key: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${key}`);
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
}
