import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ShowsService } from '../../../core/services/shows.service';
import { ShowCardComponent } from '../../../shared/components/show-card/show-card.component';
import { Show } from '../../../models/show.model';
import { Observable } from 'rxjs';

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
  imports: [CommonModule, ShowCardComponent],
  templateUrl: './show-list.component.html',
})
export class ShowListComponent implements OnInit {
  shows = signal<Show[]>([]);
  title = signal('Shows');
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private svc: ShowsService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const mode = this.route.snapshot.url[1]?.path as ListMode;
    this.title.set(TITLES[mode] ?? 'Shows');
    this.fetch(mode).subscribe({
      next: (shows) => { this.shows.set(shows); this.loading.set(false); },
      error: () => { this.error.set('Failed to load shows.'); this.loading.set(false); },
    });
  }

  private fetch(mode: ListMode): Observable<Show[]> {
    switch (mode) {
      case 'popular':     return this.svc.getPopular();
      case 'top':         return this.svc.getTopRated();
      case 'onTV':        return this.svc.getOnTV();
      case 'airingToday': return this.svc.getAiringToday();
    }
  }
}
