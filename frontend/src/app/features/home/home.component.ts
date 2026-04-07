import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AllMediaService, AllMediaFeeds } from '../../core/services/all-media.service';
import { Movie } from '../../models/movie.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  nowShowing = signal<Movie[]>([]);
  openingThisWeek = signal<Movie[]>([]);
  upcoming = signal<Movie[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly posterBase = 'https://image.tmdb.org/t/p/w300';

  constructor(private allMedia: AllMediaService) {}

  ngOnInit(): void {
    this.allMedia.getAllMediaDetails().subscribe({
      next: (feeds: AllMediaFeeds) => {
        this.nowShowing.set((feeds.nowShowing?.results ?? []).slice(0, 4));
        this.openingThisWeek.set((feeds.OpeningThisWeek?.results ?? []).slice(0, 4));
        this.upcoming.set((feeds.upcoming?.results ?? []).slice(0, 4));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load movies. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
