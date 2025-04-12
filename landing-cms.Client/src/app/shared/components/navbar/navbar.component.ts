// shared/components/navbar/navbar.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: false,
  template: `
    <nav>
      <a routerLink="/">Home</a>
      <a routerLink="/admin">Admin</a>
    </nav>
  `,
  styles: [`
    nav {
      display: flex;
      gap: 1rem;
      background-color: #f8f9fa;
      padding: 0.5rem 1rem;
    }
    a {
      text-decoration: none;
      color: #007bff;
    }
  `]
})
export class NavbarComponent { }
