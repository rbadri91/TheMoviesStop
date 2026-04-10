import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PeopleService } from '../../../core/services/people.service';
import { Person } from '../../../models/person.model';

@Component({
  selector: 'app-people-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './people-list.component.html',
  styleUrl: './people-list.component.scss',
})
export class PeopleListComponent implements OnInit {
  people = signal<Person[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly posterBase = 'https://image.tmdb.org/t/p/w300';

  constructor(private svc: PeopleService) {}

  ngOnInit(): void {
    this.svc.getPopular().subscribe({
      next: (people) => { this.people.set(people); this.loading.set(false); },
      error: () => { this.error.set('Failed to load people.'); this.loading.set(false); },
    });
  }
}
