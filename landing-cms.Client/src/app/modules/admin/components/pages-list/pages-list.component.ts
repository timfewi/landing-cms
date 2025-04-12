import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PageService } from '../../../landing-page/services/page.service';
import { Page } from '../../../landing-page/models/page.model';

@Component({
  selector: 'app-pages-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './pages-list.component.html',
  styleUrls: ['./pages-list.component.css']
})
export class PagesListComponent implements OnInit {
  pages: Page[] = [];
  isLoading = true;
  errorMessage = '';

  // Für Suche und Filtern
  searchText = '';
  statusFilter: boolean | null = null;

  // Für Paginierung
  currentPage = 1;
  pageSize = 10;

  // Für Sortierung
  sortField: keyof Page = 'lastModifiedDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Für Modals
  showDeleteModal = false;
  pageToDelete: Page | null = null;
  isDeleting = false;

  // ID der zuletzt bearbeiteten Seite
  lastEditedPageId: string | null = null;

  constructor(
    private pageService: PageService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Query-Parameter prüfen für lastEditedPageId
    this.route.queryParams.subscribe(params => {
      this.lastEditedPageId = params['lastEdited'] || null;

      // Falls eine bestimmte Seite zuletzt bearbeitet wurde,
      // sicherstellen, dass wir zur richtigen Seite scrollen
      if (this.lastEditedPageId) {
        setTimeout(() => this.scrollToHighlightedPage(), 300);
      }
    });

    this.loadPages();
  }

  loadPages(): void {
    this.isLoading = true;
    this.pageService.getAllPages().subscribe({
      next: (pages) => {
        this.pages = pages;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = `Fehler beim Laden der Seiten: ${error.message}`;
        this.isLoading = false;
      }
    });
  }

  // Suchfunktion
  filterPages(): Page[] {
    return this.pages.filter(page => {
      // Filtern nach Suchtext
      const matchesSearch = !this.searchText ||
        page.title.toLowerCase().includes(this.searchText.toLowerCase()) ||
        page.slug.toLowerCase().includes(this.searchText.toLowerCase());

      // Filtern nach Status
      const matchesStatus = this.statusFilter === null || page.isPublished === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  // Sortierungsfunktion
  sortPages(field: keyof Page): void {
    if (this.sortField === field) {
      // Wenn das gleiche Feld angeklickt wird, die Richtung umkehren
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Neues Sortierfeld setzen und standardmäßig absteigend sortieren
      this.sortField = field;
      this.sortDirection = 'desc';
    }
  }

  // Liefert sortierte und gefilterte Seiten zurück
  get filteredPages(): Page[] {
    const filtered = this.filterPages();

    return filtered.sort((a, b) => {
      const valueA = a[this.sortField];
      const valueB = b[this.sortField];

      if (valueA === valueB) return 0;

      let comparison = 0;
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        comparison = valueA.localeCompare(valueB);
      } else if (valueA !== undefined && valueB !== undefined && valueA < valueB) {
        comparison = -1;
      } else {
        comparison = 1;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Liefert die Seiten für die aktuelle Seite zurück
  get paginatedPages(): Page[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredPages.slice(startIndex, startIndex + this.pageSize);
  }

  // Liefert die Gesamtzahl der Seiten zurück
  get totalPages(): number {
    return Math.ceil(this.filteredPages.length / this.pageSize);
  }

  // Hilfsfunktion für die Pagination-Anzeige
  getMaxPageItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredPages.length);
  }

  // Paginierung-Hilfsfunktionen
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Erzeugt ein Array mit den Seitenzahlen für die Pagination
  getPageNumbers(): number[] {
    const pages = [];
    const total = this.totalPages;

    // Zeige maximal 5 Seitenzahlen
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, start + 4);

    // Anpassen, wenn wir am Ende sind
    if (end - start < 4 && start > 1) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Hilfsfunktionen für die UI
  getSortIcon(field: keyof Page): string {
    if (this.sortField !== field) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getStatusLabel(status: boolean): string {
    return status ? 'Veröffentlicht' : 'Entwurf';
  }

  getStatusClass(status: boolean): string {
    return status ? 'badge-success' : 'badge-secondary';
  }

  // Funktion zum Scrollen zur hervorgehobenen Seite
  scrollToHighlightedPage(): void {
    if (this.lastEditedPageId) {
      const element = document.getElementById(`page-row-${this.lastEditedPageId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  // Funktion zum Prüfen, ob eine Seite hervorgehoben werden soll
  isHighlightedPage(pageId: string): boolean {
    return this.lastEditedPageId === pageId;
  }

  // CRUD-Operationen
  deletePage(page: Page): void {
    this.pageToDelete = page;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.pageToDelete) return;

    this.isDeleting = true;
    this.pageService.deletePage(this.pageToDelete.id).subscribe({
      next: () => {
        this.pages = this.pages.filter(p => p.id !== this.pageToDelete!.id);
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.pageToDelete = null;
      },
      error: (error) => {
        this.errorMessage = `Fehler beim Löschen der Seite: ${error.message}`;
        this.isDeleting = false;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.pageToDelete = null;
  }

  duplicatePage(page: Page): void {
    const duplicatedPage: Omit<Page, 'id'> = {
      ...page,
      title: `Kopie von ${page.title}`,
      slug: `${page.slug}-copy`,
      isPublished: false,
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString()
    };

    this.pageService.createPage(duplicatedPage).subscribe({
      next: (newPage) => {
        this.pages = [...this.pages, newPage];
      },
      error: (error) => {
        this.errorMessage = `Fehler beim Duplizieren der Seite: ${error.message}`;
      }
    });
  }

  // Weiterleitungsfunktion zum Editor mit lastEdited Parameter
  editPage(page: Page): void {
    this.router.navigate(['/admin/pages/edit', page.id]);
  }
}
