import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Section } from '../../models/page.model';
import { SortByOrderPipe } from '../../pipes/sort-by-order.pipe';
import { WidgetRendererComponent } from '../widget-renderer/widget-renderer.component';

@Component({
  selector: 'app-section-renderer',
  standalone: true,
  imports: [CommonModule, SortByOrderPipe, WidgetRendererComponent],
  templateUrl: './section-renderer.component.html',
  styleUrls: ['./section-renderer.component.css']
})
export class SectionRendererComponent {
  @Input() section!: Section;
  @Input() previewMode: boolean = false;
}
