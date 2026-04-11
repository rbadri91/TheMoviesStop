import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ShowsService } from '../../../core/services/shows.service';
import { ShowCardComponent } from '../../../shared/components/show-card/show-card.component';
import { PaginatorComponent } from '../../../shared/components/paginator/paginator.component';
import { Show, ShowListResponse } from '../../../models/show.model';

type ListMode = 'popular' | 'top' | 'onTV' | 'airingToday';

const TITLES: Record<ListMode, string> = {
  popular: 'Popular Shows',
  top: 'Top Rated Shows',
  onTV: 'On TV',
  airingToday: 'Airing Today',
};

@Component({
  selector: 'app-show-list',
  standalone: true,
  imports: [CommonModule, ShowCardComponent, PaginatorComponent],
  templateUrl: './show-list.component.html',
})
export class ShowListComponent implements OnInit {
  shows = signal<Show[]>([]);
  title = signal('Shows');
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);

  private mode!: ListMode;

  constructor(private svc: ShowsService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.mode = this.route.snapshot.url[1]?.path as ListMode;
    this.title.set(TITLES[this.mode] ?? 'Shows');
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
        this.shows.set(res.results);
        this.totalPages.set(res.total_pages);
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load shows.'); this.loading.set(false); },
    });
  }

  private fetch(mode: ListMode, page: number): Observable<ShowListResponse> {
    switch (mode) {
      case 'popular':     return this.svc.getPopular(page);
      case 'top':         return this.svc.getTopRated(page);
      case 'onTV':        return this.svc.getOnTV(page);
      case 'airingToday': return this.svc.getAiringToday(page);
    }
  }
}
