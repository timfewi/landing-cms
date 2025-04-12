// core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { User } from '../models/user-types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;

  constructor() {
    // Demo-Anmeldedaten aus dem localStorage laden, falls vorhanden
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  login(username: string, password: string): boolean {
    // In einer echten Anwendung würde hier eine API-Anfrage erfolgen
    // Für Demozwecke akzeptieren wir bestimmte Anmeldedaten
    if (username === 'admin' && password === 'password') {
      this.currentUser = { username, role: 'admin' };
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      return true;
    } else if (username && password) {
      this.currentUser = { username, role: 'user' };
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }
}
