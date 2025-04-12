// modules/public/components/hero-section.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-hero-section',
  standalone: false,
  template: `
    <section class="hero">
      <h1>Willkommen bei unserer Angular Anwendung</h1>
      <p>Erleben Sie moderne Webtechnologien in Aktion!</p>
    </section>
  `,
  styles: [`
    .hero {
      background: url('/assets/hero-bg.jpg') no-repeat center center;
      background-size: cover;
      padding: 4rem 2rem;
      color: #fff;
      text-align: center;
    }
  `]
})
export class HeroSectionComponent { }
