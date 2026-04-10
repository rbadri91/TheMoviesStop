import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile, UserListItem } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<'watchlist' | 'favorites'>('watchlist');

  readonly posterBase = 'https://image.tmdb.org/t/p/w300';

  constructor(private userSvc: UserService, public auth: AuthService) {}

  ngOnInit(): void {
    this.userSvc.getProfile().subscribe({
      next: (p) => { this.profile.set(p); this.loading.set(false); },
      error: () => { this.error.set('Failed to load profile.'); this.loading.set(false); },
    });
  }

  getLink(item: UserListItem): string[] {
    return item.mediaType === 'movie'
      ? ['/movies/desc', String(item.id)]
      : ['/tv/desc', String(item.id)];
  }
}
