import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Widget } from '../../models/page.model';
import { SafeResourceUrlPipe } from '../../pipes/safe-resource-url.pipe';

@Component({
  selector: 'app-widget-renderer',
  standalone: true,
  imports: [CommonModule, SafeResourceUrlPipe],
  templateUrl: './widget-renderer.component.html',
  styleUrls: ['./widget-renderer.component.css']
})
export class WidgetRendererComponent {
  @Input() widget!: Widget;
}
