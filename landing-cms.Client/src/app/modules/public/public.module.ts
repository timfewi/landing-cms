// modules/public/public.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicRoutingModule } from './public-routing.module';
import { LandingPageComponent } from './pages/landing-page.component';
import { HeroSectionComponent } from './components/hero-section.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    LandingPageComponent,
    HeroSectionComponent
  ],
  imports: [
    CommonModule,
    PublicRoutingModule,
    SharedModule
  ]
})

export class PublicModule { }
