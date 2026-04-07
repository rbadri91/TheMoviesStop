import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbDropdownModule, NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgbDropdownModule, NgbCollapseModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  isMenuCollapsed = signal(true);

  constructor(public auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }

  collapseMenu(): void {
    this.isMenuCollapsed.set(true);
  }
}
