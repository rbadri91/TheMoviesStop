import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbDropdownModule, NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgbDropdownModule, NgbCollapseModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  isMenuCollapsed = signal(true);

  constructor(public auth: AuthService, public theme: ThemeService) {}

  logout(): void {
    this.auth.logout();
  }

  collapseMenu(): void {
    this.isMenuCollapsed.set(true);
  }
}
