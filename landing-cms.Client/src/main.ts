import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { initOpenTelemetry } from './otel/instrumentation';

initOpenTelemetry();
bootstrapApplication(AppComponent)
  .catch((err) => console.error(err));
