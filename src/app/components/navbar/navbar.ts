import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarService } from '../../services/sidebar';

@Component({ selector: 'app-navbar', standalone: true, imports: [RouterModule], templateUrl: './navbar.html', styleUrl: './navbar.css' })
export class NavbarComponent {
  readonly sidebarService = inject(SidebarService);

  toggleSidebar() {
    this.sidebarService.toggle();
  }
}
