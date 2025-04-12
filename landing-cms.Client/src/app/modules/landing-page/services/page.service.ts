import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { Page } from '../models/page.model';

/**
 * In-Memory-Datenbank für Pages
 */
export class InMemoryDatabase<T extends { id: string }> {
  private data: T[] = [];
  private idCounter: number = 1;

  constructor(initialData: T[] = []) {
    // Wenn Initialdaten vorhanden sind, füge diese hinzu und setze den idCounter entsprechend
    if (initialData && initialData.length > 0) {
      this.data = [...initialData];

      // Finde die höchste numerische ID, um den Counter zu setzen
      const numericIds = initialData
        .map(item => {
          const match = item.id.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter(id => !isNaN(id));

      if (numericIds.length > 0) {
        this.idCounter = Math.max(...numericIds) + 1;
      }
    }
  }

  /**
   * Holt alle Einträge
   */
  getAll(): T[] {
    return [...this.data];
  }

  /**
   * Sucht einen Eintrag nach seiner ID
   */
  getById(id: string): T | undefined {
    return this.data.find(item => item.id === id);
  }

  /**
   * Findet Einträge, die der Filterbedingung entsprechen
   */
  findWhere(predicate: (item: T) => boolean): T[] {
    return this.data.filter(predicate);
  }

  /**
   * Erstellt einen neuen Eintrag
   */
  create(item: Omit<T, 'id'>): T {
    const newId = this.generateId();
    const newItem = { ...item, id: newId } as T;
    this.data.push(newItem);
    return { ...newItem };
  }

  /**
   * Aktualisiert einen vorhandenen Eintrag
   */
  update(id: string, updates: Partial<T>): T | undefined {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return undefined;

    const updatedItem = { ...this.data[index], ...updates, id };
    this.data[index] = updatedItem;
    return { ...updatedItem };
  }

  /**
   * Löscht einen Eintrag nach seiner ID
   */
  delete(id: string): boolean {
    const initialLength = this.data.length;
    this.data = this.data.filter(item => item.id !== id);
    return this.data.length < initialLength;
  }

  /**
   * Generiert eine neue ID im Format "id_NUMBER"
   */
  private generateId(): string {
    return `id_${this.idCounter++}`;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PageService {
  private apiUrl = '/api/pages';
  private db: InMemoryDatabase<Page>;

  // Initial-Daten für die In-Memory-Datenbank
  private initialPages: Page[] = [
    {
      id: '1',
      title: 'Willkommen zur Demo-Landing-Page',
      slug: 'demo-page',
      description: 'Eine Beispiel-Landing-Page zur Demonstration des CMS',
      isPublished: true,
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
      sections: [
        {
          id: 's1',
          title: 'Hero-Bereich',
          type: 'hero',
          order: 1,
          widgets: [
            {
              id: 'w1',
              type: 'heading',
              order: 1,
              settings: { align: 'center', size: 'large' },
              content: { text: 'Willkommen zum Landing-CMS!' }
            },
            {
              id: 'w2',
              type: 'paragraph',
              order: 2,
              settings: { align: 'center' },
              content: { text: 'Ein modernes CMS zur einfachen Erstellung von Landing-Pages.' }
            },
            {
              id: 'w3',
              type: 'button',
              order: 3,
              settings: { align: 'center', style: 'primary', size: 'large' },
              content: { text: 'Mehr erfahren', link: '#features' }
            }
          ]
        },
        {
          id: 's2',
          title: 'Features',
          type: 'features',
          order: 2,
          widgets: [
            {
              id: 'w4',
              type: 'heading',
              order: 1,
              settings: { align: 'center', size: 'medium' },
              content: { text: 'Unsere Features' }
            },
            {
              id: 'w5',
              type: 'feature-item',
              order: 2,
              settings: {},
              content: {
                title: 'Einfache Bedienung',
                description: 'Das CMS ist intuitiv und einfach zu bedienen.',
                icon: 'fa-user-friendly'
              }
            },
            {
              id: 'w6',
              type: 'feature-item',
              order: 3,
              settings: {},
              content: {
                title: 'Flexibles Layout',
                description: 'Passe das Layout deiner Landing-Page ganz nach deinen Wünschen an.',
                icon: 'fa-layout'
              }
            },
            {
              id: 'w7',
              type: 'feature-item',
              order: 4,
              settings: {},
              content: {
                title: 'Modernes Design',
                description: 'Alle Landing-Pages sind responsiv und modern gestaltet.',
                icon: 'fa-design'
              }
            }
          ]
        },
        {
          id: 's3',
          title: 'Kontakt',
          type: 'contact',
          order: 3,
          widgets: [
            {
              id: 'w8',
              type: 'heading',
              order: 1,
              settings: { align: 'center', size: 'medium' },
              content: { text: 'Kontaktiere uns' }
            },
            {
              id: 'w9',
              type: 'paragraph',
              order: 2,
              settings: { align: 'center' },
              content: { text: 'Hast du Fragen? Wir sind für dich da!' }
            },
            {
              id: 'w10',
              type: 'button',
              order: 3,
              settings: { align: 'center', style: 'secondary', size: 'medium' },
              content: { text: 'Kontakt aufnehmen', link: 'mailto:info@example.com' }
            }
          ]
        }
      ]
    },
    {
      id: '2',
      title: 'Produktseite',
      slug: 'product-page',
      description: 'Eine Beispiel-Produktseite',
      isPublished: false,
      createdDate: new Date(Date.now() - 86400000).toISOString(), // Gestern
      lastModifiedDate: new Date(Date.now() - 3600000).toISOString(), // Vor einer Stunde
      sections: [
        {
          id: 's1',
          title: 'Produkt-Showcase',
          type: 'showcase',
          order: 1,
          widgets: [
            {
              id: 'w1',
              type: 'heading',
              order: 1,
              settings: { align: 'left', size: 'large' },
              content: { text: 'Unser neues Produkt' }
            },
            {
              id: 'w2',
              type: 'image',
              order: 2,
              settings: { size: 'large' },
              content: { url: 'https://placehold.co/600x400', alt: 'Produktbild' }
            }
          ]
        }
      ]
    }
  ];

  constructor(private readonly http: HttpClient) {
    // Initialisiere die In-Memory-Datenbank mit den Mock-Daten
    this.db = new InMemoryDatabase<Page>(this.initialPages);

    // Füge eine weitere Test-Seite hinzu
    this.db.create({
      title: 'Über uns',
      slug: 'about-us',
      description: 'Lernen Sie unser Team kennen',
      isPublished: true,
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
      sections: [
        {
          id: 's1',
          title: 'Team',
          type: 'team',
          order: 1,
          widgets: [
            {
              id: 'w1',
              type: 'heading',
              order: 1,
              settings: { align: 'center', size: 'h2' },
              content: { text: 'Unser Team' }
            },
            {
              id: 'w2',
              type: 'paragraph',
              order: 2,
              settings: { align: 'center' },
              content: { text: 'Wir sind ein Team von engagierten Spezialisten.' }
            }
          ]
        }
      ]
    });
  }

  getAllPages(): Observable<Page[]> {
    // In einer echten Anwendung: return this.http.get<Page[]>(this.apiUrl);
    return of(this.db.getAll()).pipe(delay(500)); // Simuliere Netzwerklatenz
  }

  getPageById(id: string): Observable<Page> {
    // In einer echten Anwendung: return this.http.get<Page>(`${this.apiUrl}/${id}`);
    const page = this.db.getById(id);
    if (!page) {
      return throwError(() => new Error('Page not found'));
    }
    return of(page).pipe(delay(300));
  }

  getPageBySlug(slug: string): Observable<Page> {
    // In einer echten Anwendung: return this.http.get<Page>(`${this.apiUrl}/by-slug/${slug}`);
    const pages = this.db.findWhere(page => page.slug === slug && page.isPublished);
    if (pages.length === 0) {
      // Fallback auf die erste veröffentlichte Seite
      const publishedPages = this.db.findWhere(page => page.isPublished);
      if (publishedPages.length === 0) {
        return throwError(() => new Error('No published pages found'));
      }
      return of(publishedPages[0]).pipe(delay(300));
    }
    return of(pages[0]).pipe(delay(300));
  }

  createPage(page: Omit<Page, 'id'>): Observable<Page> {
    // In einer echten Anwendung: return this.http.post<Page>(this.apiUrl, page);
    const newPage = this.db.create({
      ...page,
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString()
    });
    return of(newPage).pipe(delay(500));
  }

  updatePage(id: string, page: Partial<Page>): Observable<Page> {
    // In einer echten Anwendung: return this.http.put<Page>(`${this.apiUrl}/${id}`, page);
    const updatedPage = this.db.update(id, {
      ...page,
      lastModifiedDate: new Date().toISOString()
    });

    if (!updatedPage) {
      return throwError(() => new Error('Page not found'));
    }

    return of(updatedPage).pipe(delay(500));
  }

  deletePage(id: string): Observable<void> {
    // In einer echten Anwendung: return this.http.delete<void>(`${this.apiUrl}/${id}`);
    const success = this.db.delete(id);

    if (!success) {
      return throwError(() => new Error('Page not found'));
    }

    return of(undefined).pipe(delay(500));
  }

  duplicatePage(id: string): Observable<Page> {
    const pageToDuplicate = this.db.getById(id);

    if (!pageToDuplicate) {
      return throwError(() => new Error('Page not found'));
    }

    const duplicatedPage = this.db.create({
      ...pageToDuplicate,
      title: `Kopie von ${pageToDuplicate.title}`,
      slug: `${pageToDuplicate.slug}-copy`,
      isPublished: false,
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString()
    });

    return of(duplicatedPage).pipe(delay(500));
  }

  publishPage(id: string): Observable<Page> {
    return this.updatePage(id, { isPublished: true });
  }

  unpublishPage(id: string): Observable<Page> {
    return this.updatePage(id, { isPublished: false });
  }

  // Methoden für fortgeschrittenere Suche/Filterung

  /**
   * Sucht Seiten nach einem Suchbegriff
   */
  searchPages(term: string): Observable<Page[]> {
    const normalizedTerm = term.toLowerCase();
    const results = this.db.findWhere(page =>
      page.title.toLowerCase().includes(normalizedTerm) ||
      page.description?.toLowerCase().includes(normalizedTerm) ||
      page.slug.toLowerCase().includes(normalizedTerm)
    );
    return of(results).pipe(delay(300));
  }

  /**
   * Holt alle veröffentlichten Seiten
   */
  getPublishedPages(): Observable<Page[]> {
    return of(this.db.findWhere(page => page.isPublished)).pipe(delay(300));
  }

  /**
   * Holt alle Entwürfe (nicht veröffentlichte Seiten)
   */
  getDraftPages(): Observable<Page[]> {
    return of(this.db.findWhere(page => !page.isPublished)).pipe(delay(300));
  }

  /**
   * Holt die neuesten Seiten, sortiert nach Änderungsdatum
   */
  getRecentPages(limit: number = 5): Observable<Page[]> {
    const pages = this.db.getAll()
      .sort((a, b) => new Date(b.lastModifiedDate).getTime() - new Date(a.lastModifiedDate).getTime())
      .slice(0, limit);
    return of(pages).pipe(delay(300));
  }
}
