// modules/public/public-routing.module.ts
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LandingPageComponent } from './pages/landing-page.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent },
  // more routes
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class PublicRoutingModule {}
