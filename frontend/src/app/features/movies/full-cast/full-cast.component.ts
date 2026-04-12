import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StateService } from '../../../core/services/state.service';
import { CastMember, CrewMember } from '../../../models/movie.model';

@Component({
  selector: 'app-full-cast',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './full-cast.component.html',
  styleUrl: './full-cast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullCastComponent {
  readonly posterBase = 'https://image.tmdb.org/t/p/w300';
  readonly backdropBase = 'https://image.tmdb.org/t/p/w1280';

  readonly media = computed(() => {
    const url = this.route.snapshot.pathFromRoot.map((s) => s.url.join('/')).join('/');
    return url.includes('/tv/') ? this.state.selectedShow() : this.state.selectedMovie();
  });

  readonly crewByDept = computed<Record<string, CrewMember[]>>(() => {
    const crew = this.media()?.credits?.crew ?? [];
    return crew.reduce<Record<string, CrewMember[]>>((acc, m) => {
      (acc[m.department] ??= []).push(m);
      return acc;
    }, {});
  });

  readonly cast = computed<CastMember[]>(() => this.media()?.credits?.cast ?? []);

  constructor(private state: StateService, private route: ActivatedRoute) {}

  getTitle(m: any): string {
    return m?.title ?? m?.name ?? '';
  }

  deptKeys(): string[] {
    return Object.keys(this.crewByDept());
  }
}
