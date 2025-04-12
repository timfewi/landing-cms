// core/services/auth.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUser = { isAdmin: false };

  constructor() { }

  isAdmin(): boolean {
    return this.currentUser.isAdmin;
  }

  login(isAdmin: boolean): void {
    this.currentUser.isAdmin = isAdmin;
  }

  logout(): void {
    this.currentUser.isAdmin = false;
  }
}
