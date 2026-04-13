import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PeopleService } from '../../../core/services/people.service';
import { Person, PersonCredit, TaggedImage } from '../../../models/person.model';
import { HtmlizePipe } from '../../../shared/pipes/htmlize.pipe';

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HtmlizePipe],
  templateUrl: './person-detail.component.html',
  styleUrl: './person-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonDetailComponent implements OnInit {
  person = signal<Person | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeSection = signal('details');
  filmographyTab = signal<'Movies' | 'TV Shows'>('Movies');

  readonly posterBase = 'https://image.tmdb.org/t/p/w300';
  readonly backdropBase = 'https://image.tmdb.org/t/p/w1280';

  constructor(private route: ActivatedRoute, private svc: PeopleService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id')!;
      this.loading.set(true);
      this.error.set(null);
      this.person.set(null);
      this.svc.getPeopleDetails(id).subscribe({
        next: (person) => { this.person.set(person); this.loading.set(false); },
        error: () => { this.error.set('Failed to load person.'); this.loading.set(false); },
      });
    });
  }

  scrollTo(section: string): void {
    this.activeSection.set(section);
    const el = document.querySelector(`.${section}-section`);
    el?.scrollIntoView({ behavior: 'smooth' });
  }

  getGender(g: number): string {
    return g === 1 ? 'Female' : g === 2 ? 'Male' : 'Not specified';
  }

  getTitle(credit: PersonCredit | TaggedImage): string {
    if ('media' in credit) return credit.media?.title ?? credit.media?.name ?? '';
    return (credit as PersonCredit).title ?? (credit as PersonCredit).name ?? '';
  }

  getShowLink(credit: PersonCredit | TaggedImage): string[] {
    if ('media' in credit) {
      const m = (credit as TaggedImage).media;
      return m.media_type === 'tv' ? ['/tv/desc', String(m.id)] : ['/movies/desc', String(m.id)];
    }
    const c = credit as PersonCredit;
    return c.media_type === 'tv' ? ['/tv/desc', String(c.id)] : ['/movies/desc', String(c.id)];
  }

  getReleaseYear(credit: PersonCredit): string {
    return credit.releaseYear ?? '';
  }

  movieCast(): PersonCredit[] {
    return (this.person()?.combined_credits?.cast ?? []).filter(c => c.media_type === 'movie');
  }

  movieCrew(): PersonCredit[] {
    return (this.person()?.combined_credits?.crew ?? []).filter(c => c.media_type === 'movie');
  }

  tvCast(): PersonCredit[] {
    return (this.person()?.combined_credits?.cast ?? []).filter(c => c.media_type === 'tv');
  }

  tvCrew(): PersonCredit[] {
    return (this.person()?.combined_credits?.crew ?? []).filter(c => c.media_type === 'tv');
  }
}
