import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StateService } from '../../../core/services/state.service';
import { CastMember, CrewMember } from '../../../models/movie.model';

@Component({
  selector: 'app-full-cast',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './full-cast.component.html',
})
export class FullCastComponent {
  readonly posterBase = 'https://image.tmdb.org/t/p/w300';

  readonly movie = computed(() => this.state.selectedMovie());

  /** Groups crew by department, matching AngularJS chunk() helper. */
  readonly crewByDept = computed<Record<string, CrewMember[]>>(() => {
    const crew = this.movie()?.credits?.crew ?? [];
    return crew.reduce<Record<string, CrewMember[]>>((acc, m) => {
      (acc[m.department] ??= []).push(m);
      return acc;
    }, {});
  });

  readonly cast = computed<CastMember[]>(() => this.movie()?.credits?.cast ?? []);

  constructor(private state: StateService) {}

  deptKeys(): string[] {
    return Object.keys(this.crewByDept());
  }
}
