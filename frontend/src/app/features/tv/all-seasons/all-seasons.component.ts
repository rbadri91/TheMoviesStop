import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ShowsService } from '../../../core/services/shows.service';
import { StateService } from '../../../core/services/state.service';
import { SeasonDetail } from '../../../models/show.model';
import { HtmlizePipe } from '../../../shared/pipes/htmlize.pipe';

@Component({
  selector: 'app-all-seasons',
  standalone: true,
  imports: [CommonModule, HtmlizePipe],
  templateUrl: './all-seasons.component.html',
  styleUrl: './all-seasons.component.scss',
})
export class AllSeasonsComponent implements OnInit {
  seasons = signal<SeasonDetail[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly show = computed(() => this.state.selectedShow());
  readonly posterBase = 'https://image.tmdb.org/t/p/w300';
  readonly backdropBase = 'https://image.tmdb.org/t/p/w1280';

  constructor(
    private route: ActivatedRoute,
    private svc: ShowsService,
    private state: StateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getAllSeasonDetails(id).subscribe({
      next: (seasons) => { this.seasons.set(seasons); this.loading.set(false); },
      error: () => { this.error.set('Failed to load seasons. Please navigate from a show detail page first.'); this.loading.set(false); },
    });
  }

  getReleaseYear(date: string): string {
    return date?.substring(0, date.indexOf('-')) ?? '';
  }

  getOverview(overview: string): string {
    return overview?.trim() ? overview : 'This season does not have any summary.';
  }
}
