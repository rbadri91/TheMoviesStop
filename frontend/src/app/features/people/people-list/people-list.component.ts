import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PeopleService } from '../../../core/services/people.service';
import { PaginatorComponent } from '../../../shared/components/paginator/paginator.component';
import { Person } from '../../../models/person.model';

@Component({
  selector: 'app-people-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginatorComponent],
  templateUrl: './people-list.component.html',
  styleUrl: './people-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeopleListComponent implements OnInit {
  people = signal<Person[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);

  readonly posterBase = 'https://image.tmdb.org/t/p/w300';

  constructor(private svc: PeopleService) {}

  ngOnInit(): void {
    this.load(1);
  }

  onPageChange(page: number): void {
    this.load(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private load(page: number): void {
    this.loading.set(true);
    this.currentPage.set(page);
    this.svc.getPopular(page).subscribe({
      next: (res) => {
        this.people.set(res.results);
        this.totalPages.set(res.total_pages);
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load people.'); this.loading.set(false); },
    });
  }
}
