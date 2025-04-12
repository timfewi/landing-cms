// modules/public/pages/landing-page/landing-page.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  standalone: false,
  template: `
    <!-- <app-navbar></app-navbar> -->

    <section>
      <h2>Willkommen auf dem Dashboard</h2>
      <p>Weitere Inhalte und Informationen...</p>
    </section>
  `,
  styles: [`
    section {
      margin: 2rem;
      text-align: center;
    }
  `],

})
export class DashboardComponent { }
