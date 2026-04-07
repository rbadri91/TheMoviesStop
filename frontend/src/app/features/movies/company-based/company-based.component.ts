import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CompanyService } from '../../../core/services/company.service';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card.component';
import { Movie } from '../../../models/movie.model';

@Component({
  selector: 'app-company-based',
  standalone: true,
  imports: [CommonModule, MovieCardComponent],
  templateUrl: './company-based.component.html',
})
export class CompanyBasedComponent implements OnInit {
  items = signal<Movie[]>([]);
  title = signal('');
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(private route: ActivatedRoute, private svc: CompanyService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    // Route is /movies/company/:id
    this.svc.getMoviesByCompany(id).subscribe({
      next: (movies) => { this.items.set(movies); this.loading.set(false); },
      error: () => { this.error.set('Failed to load.'); this.loading.set(false); },
    });
  }
}
