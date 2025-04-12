// app.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, NgIf],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Landing-CMS';

  constructor(public authService: AuthService) { }

  login(): void {
    // Für Demo-Zwecke automatisch als Admin anmelden
    this.authService.login('admin', 'password');
  }

  logout(): void {
    this.authService.logout();
  }
}
