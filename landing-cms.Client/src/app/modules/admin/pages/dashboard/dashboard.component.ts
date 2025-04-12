import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageService } from '../../../landing-page/services/page.service';
import { Page } from '../../../landing-page/models/page.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  pages: Page[] = [];
  filteredPages: Page[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  statusFilter = 'all';
  sortBy = 'updatedAt';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  showDeleteModal = false;
  isDeleting = false;
  pageToDelete: Page | null = null;

  constructor(private readonly pageService: PageService) { }

  ngOnInit(): void {
    this.loadPages();
  }

  loadPages(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.pageService.getAllPages().subscribe({
      next: (pages) => {
        this.pages = pages;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = `Fehler beim Laden der Landing Pages: ${error.message}`;
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.pages];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(page =>
        page.title.toLowerCase().includes(term) ||
        page.slug.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      result = result.filter(page =>
        (this.statusFilter === 'published' && page.isPublished) ||
        (this.statusFilter === 'draft' && !page.isPublished)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (this.sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (this.sortBy === 'createdAt') {
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      } else {
        return new Date(b.lastModifiedDate).getTime() - new Date(a.lastModifiedDate).getTime();
      }
    });

    this.filteredPages = result;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPages.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  getPageRange(): number[] {
    const range: number[] = [];
    const maxVisiblePages = 5;

    let start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(this.totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getLastItemIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredPages.length);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.applyFilters();
  }

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
        this.showDeleteModal = false;
        this.pageToDelete = null;
        this.isDeleting = false;
        this.applyFilters();
      },
      error: (error) => {
        this.errorMessage = `Fehler beim Löschen der Landing Page: ${error.message}`;
        this.isDeleting = false;
      }
    });
  }

  duplicatePage(page: Page): void {
    this.isLoading = true;

    this.pageService.duplicatePage(page.id).subscribe({
      next: (newPage) => {
        this.pages.push(newPage);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = `Fehler beim Duplizieren der Landing Page: ${error.message}`;
        this.isLoading = false;
      }
    });
  }
}
