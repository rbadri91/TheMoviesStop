import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StateService } from '../../../core/services/state.service';
import { ProductionCompany } from '../../../models/movie.model';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './company-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyListComponent {
  readonly movie = computed(() => this.state.selectedMovie());
  readonly companies = computed<ProductionCompany[]>(
    () => this.movie()?.production_companies ?? []
  );

  constructor(private state: StateService) {}
}
