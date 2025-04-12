import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PageService } from '../../services/page.service';
import { Page } from '../../models/page.model';
import { SortByOrderPipe } from '../../pipes/sort-by-order.pipe';
import { SectionRendererComponent } from '../section-renderer/section-renderer.component';

@Component({
  selector: 'app-page-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule, SortByOrderPipe, SectionRendererComponent],
  templateUrl: './page-viewer.component.html',
  styleUrls: ['./page-viewer.component.css']
})
export class PageViewerComponent implements OnInit {
  @Input() page: Page | null = null;
  @Input() previewMode = false;

  isLoading = true;
  errorMessage = '';

  constructor(
    private pageService: PageService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Only load from route if not in preview mode and page is not provided
    if (!this.previewMode && !this.page) {
      this.route.paramMap.subscribe(params => {
        const slug = params.get('slug');
        this.loadPage(slug);
      });
    } else if (this.page) {
      // If page is directly provided (e.g., in preview mode)
      this.isLoading = false;
    }
  }

  private loadPage(slug: string | null): void {
    this.isLoading = true;

    if (slug) {
      this.pageService.getPageBySlug(slug).subscribe({
        next: (page) => {
          this.page = page;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = `Fehler beim Laden der Seite: ${error.message}`;
          this.isLoading = false;
        }
      });
    } else {
      // Wenn kein Slug angegeben ist, lade die Startseite
      this.pageService.getPageBySlug('demo-page').subscribe({
        next: (page) => {
          this.page = page;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = `Fehler beim Laden der Startseite: ${error.message}`;
          this.isLoading = false;
        }
      });
    }
  }
}
