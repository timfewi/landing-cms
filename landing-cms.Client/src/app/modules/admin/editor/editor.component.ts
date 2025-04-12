import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { EditorService } from './services/editor.service';
import { PageService } from '../../landing-page/services/page.service';
import { SectionEditorComponent } from './sections/section-editor/section-editor.component';
import { SectionListComponent } from './sections/section-list/section-list.component';
import { WidgetEditorComponent } from './widgets/widget-editor/widget-editor.component';
import { WidgetListComponent } from './widgets/widget-list/widget-list.component';
import { WidgetCategoriesComponent } from './widgets/widget-categories/widget-categories.component';
import { PreviewRendererComponent } from './preview/preview-renderer/preview-renderer.component';
import { DevicePreviewControlsComponent } from './preview/device-preview-controls/device-preview-controls.component';
import { Page } from '../../landing-page/models/page.model';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    SectionEditorComponent,
    SectionListComponent,
    WidgetEditorComponent,
    WidgetListComponent,
    WidgetCategoriesComponent,
    PreviewRendererComponent,
    DevicePreviewControlsComponent
  ],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent implements OnInit, OnDestroy {
  currentPage: Page | null = null;
  selectedSectionIndex: number = -1;
  selectedWidgetData: { sectionIndex: number, widgetIndex: number } = { sectionIndex: -1, widgetIndex: -1 };
  previewMode: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  zoom: number = 100; // Zoomfaktor für die Vorschau
  isDirty: boolean = false;
  widgetCategory: string = 'basic'; // Standardkategorie für Widgets
  activeTab: 'sections' | 'widgets' = 'sections'; // Aktives Tab in der Seitenleiste
  pagePropertiesTab: string = 'basic'; // Tab für die Seiteneigenschaften

  // Für Benachrichtigungen
  notification: { type: string, message: string } | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly editorService: EditorService,
    private readonly pageService: PageService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) { }

  // Warnung anzeigen, wenn der Benutzer die Seite verlassen möchte und Änderungen nicht gespeichert sind
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.isDirty) {
      $event.returnValue = true;
    }
  }

  ngOnInit(): void {
    // Parameter aus der Route auslesen (pageId)
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const pageId = params.get('id');

      if (pageId) {
        // Bestehende Seite vom PageService laden
        this.editorService.loadPageById(pageId).subscribe({
          next: (page) => {
            console.log('Seite erfolgreich geladen:', page);
          },
          error: (error: Error) => {
            console.error('Fehler beim Laden der Seite:', error);
          }
        });
      } else {
        // Neue Seite erstellen
        this.createNewPage();
      }
    });

    // Abonnieren der Änderungen aus dem EditorService
    this.editorService.page$.pipe(takeUntil(this.destroy$)).subscribe(page => {
      this.currentPage = page;
    });

    this.editorService.isDirty$.pipe(takeUntil(this.destroy$)).subscribe(isDirty => {
      this.isDirty = isDirty;
    });

    this.editorService.selectedSection$.pipe(takeUntil(this.destroy$)).subscribe(index => {
      this.selectedSectionIndex = index;

      // Wenn eine Sektion ausgewählt wird, zur Sektionen-Ansicht wechseln
      if (index !== -1) {
        this.activeTab = 'sections';
      }
    });

    this.editorService.selectedWidget$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data) {
        this.selectedWidgetData = data;

        // Wenn ein Widget ausgewählt wird, zur Widgets-Ansicht wechseln
        if (data.widgetIndex !== -1) {
          this.activeTab = 'widgets';
        }
      } else {
        this.selectedWidgetData = { sectionIndex: -1, widgetIndex: -1 };
      }
    });

    this.editorService.previewMode$.pipe(takeUntil(this.destroy$)).subscribe(mode => {
      this.previewMode = mode;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Hilfsmethoden für die Tabs
  setActiveTab(tab: 'sections' | 'widgets'): void {
    this.activeTab = tab;
  }

  // Hilfsmethoden für Template-Zugriff
  getForm() {
    return this.editorService.getForm();
  }

  onSectionSelected(index: number): void {
    this.editorService.selectSection(index);
  }

  onWidgetSelected(sectionIndex: number, widgetIndex: number): void {
    this.editorService.selectWidget({
      sectionIndex,
      widgetIndex
    });
  }

  onAddSection(template?: any): void {
    this.editorService.addSection(template);
  }

  onDeleteSection(index: number): void {
    this.editorService.deleteSection(index);
  }

  onMoveSection(index: number, direction: 'up' | 'down'): void {
    this.editorService.moveSection(index, direction);
  }

  onAddWidget(sectionIndex: number, widgetType: string): void {
    this.editorService.addWidget(sectionIndex, widgetType);
  }

  onDeleteWidget(sectionIndex: number, widgetIndex: number): void {
    this.editorService.deleteWidget(sectionIndex, widgetIndex);
  }

  onMoveWidget(sectionIndex: number, oldIndex: number, newIndex: number): void {
    this.editorService.moveWidget(sectionIndex, oldIndex, newIndex);
  }

  onChangePreviewMode(mode: 'desktop' | 'tablet' | 'mobile'): void {
    this.editorService.setPreviewMode(mode);
  }

  onZoomChanged(zoom: number): void {
    this.editorService.setZoom(zoom);
  }

  // Neue Methoden, die in der HTML-Datei verwendet werden
  onPreviewPage(): void {
    if (!this.currentPage?.id) {
      this.showNotification('info', 'Bitte speichern Sie die Seite zuerst, bevor Sie eine Vorschau anzeigen.');
      return;
    }

    // Öffne die Vorschau in einem neuen Tab
    const url = `/preview/${this.currentPage.id}`;
    window.open(url, '_blank');
  }

  onPublish(): void {
    if (!this.currentPage) return;

    // Toggle den Veröffentlichungsstatus
    const isPublished = !this.currentPage.isPublished;

    // Aktualisiere den Status
    this.currentPage.isPublished = isPublished;
    this.editorService.setDirty(true);

    // Zeige Benachrichtigung
    const message = isPublished
      ? 'Seite zum Veröffentlichen vorgemerkt. Bitte speichern Sie die Änderungen.'
      : 'Veröffentlichungsstatus geändert. Bitte speichern Sie die Änderungen.';
    this.showNotification('info', message);
  }

  onWidgetDroppedOnPreview(event: CdkDragDrop<any[]>): void {
    // Wenn keine Container vorhanden sind, abbrechen
    if (!event.previousContainer || !event.container) {
      this.showNotification('error', 'Drag & Drop Operation konnte nicht abgeschlossen werden.');
      return;
    }

    // Widget-Daten aus dem vorherigen Container extrahieren
    const widgetData = event.previousContainer.data[event.previousIndex];

    // Prüfen, ob gültige Widget-Daten vorhanden sind
    if (!widgetData || !widgetData.type) {
      this.showNotification('error', 'Widget-Typ konnte nicht erkannt werden.');
      return;
    }

    // Container-ID analysieren, um herauszufinden, in welche Sektion das Widget fallen gelassen wurde
    // Format: section-{sectionIndex}
    let targetSectionIndex = -1;
    const containerId = event.container.id;

    if (containerId && containerId.startsWith('section-')) {
      targetSectionIndex = parseInt(containerId.replace('section-', ''), 10);
      console.log(`Widget wird in Sektion ${targetSectionIndex} platziert`);
    } else {
      // Verwende die aktuell ausgewählte Sektion als Fallback
      targetSectionIndex = this.selectedSectionIndex;
      console.log(`Fallback: Widget wird in ausgewählte Sektion ${targetSectionIndex} platziert`);
    }

    // Stelle sicher, dass eine Seite existiert
    if (!this.currentPage) {
      this.createNewPage();
    }

    // Wenn keine Sektion identifiziert werden konnte, erstellen wir eine neue
    if (targetSectionIndex === -1 || targetSectionIndex >= (this.currentPage?.sections?.length || 0)) {
      // Neue Sektion erstellen
      this.editorService.addSection();

      // Die neue Sektion sollte jetzt die letzte sein
      targetSectionIndex = this.currentPage?.sections?.length ? this.currentPage.sections.length - 1 : 0;
      this.showNotification('info', 'Neue Sektion erstellt für das Widget');
    }

    // Widget zur Zielsektion hinzufügen
    this.editorService.addWidget(targetSectionIndex, widgetData.type);

    // Erfolgsbenachrichtigung anzeigen
    const widgetName = this.getWidgetDisplayName(widgetData.type);
    this.showNotification('success', `${widgetName} erfolgreich zu Sektion ${targetSectionIndex + 1} hinzugefügt`);

    // Die Ansicht aktualisieren und als geändert markieren
    this.editorService.setDirty(true);

    // Widget auswählen, das gerade hinzugefügt wurde
    const newWidgetIndex = this.currentPage?.sections?.[targetSectionIndex]?.widgets?.length
      ? this.currentPage.sections[targetSectionIndex].widgets.length - 1
      : 0;

    this.editorService.selectWidget({
      sectionIndex: targetSectionIndex,
      widgetIndex: newWidgetIndex
    });

    // Wechsel zur Widget-Ansicht für sofortige Bearbeitung
    this.activeTab = 'widgets';
  }

  /**
   * Gibt einen benutzerfreundlichen Namen für einen Widget-Typ zurück
   */
  private getWidgetDisplayName(widgetType: string): string {
    const widgetNames: Record<string, string> = {
      'heading': 'Überschrift',
      'paragraph': 'Absatz',
      'text': 'Text',
      'button': 'Button',
      'image': 'Bild',
      'divider': 'Trennlinie',
      'spacer': 'Abstand',
      'icon': 'Icon',
      'video': 'Video',
      'carousel': 'Karussell',
      'form': 'Formular',
      'map': 'Karte',
      'gallery': 'Galerie',
      'social': 'Social Media',
      'custom': 'Benutzerdefiniertes Element'
    };

    return widgetNames[widgetType] || widgetType;
  }

  // Zurück zur Seitenliste navigieren mit der ID der zuletzt bearbeiteten Seite
  navigateBack(): void {
    if (this.isDirty) {
      if (confirm('Es gibt ungespeicherte Änderungen. Möchten Sie wirklich die Seite verlassen?')) {
        this.navigateToPagesList();
      }
    } else {
      this.navigateToPagesList();
    }
  }

  private navigateToPagesList(): void {
    if (this.currentPage) {
      this.router.navigate(['/admin/pages'], {
        queryParams: { lastEdited: this.currentPage.id }
      });
    } else {
      this.router.navigate(['/admin/pages']);
    }
  }

  onSave(): void {
    this.editorService.savePage().subscribe({
      next: (savedPage) => {
        console.log('Seite erfolgreich gespeichert:', savedPage);
        this.showNotification('success', 'Seite erfolgreich gespeichert!');
        // Nach dem Speichern zur Seitenliste zurückkehren und die ID der gespeicherten Seite übergeben
        this.router.navigate(['/admin/pages'], {
          queryParams: { lastEdited: savedPage.id }
        });
      },
      error: (error: Error) => {
        console.error('Fehler beim Speichern der Seite:', error);
        this.showNotification('error', 'Fehler beim Speichern der Seite.');
      }
    });
  }

  // Methode zum Erstellen einer neuen Seite
  private createNewPage(): void {
    if (!this.currentPage) {
      this.currentPage = {
        id: 'new-page-' + Date.now(),
        title: 'Neue Seite',
        slug: '/neue-seite',
        sections: [],
        isPublished: false, // Standardmäßig nicht veröffentlicht
        createdDate: new Date().toISOString(),
        lastModifiedDate: new Date().toISOString() // Updated to use ISO string for lastModifiedDate
      };
      this.editorService.setPage(this.currentPage);
      this.showNotification('info', 'Neue Seite erstellt');
    }
  }

  // Helfer-Methoden für Benachrichtigungen
  private showNotification(type: 'success' | 'error' | 'info', message: string): void {
    console.log(`[${type.toUpperCase()}]: ${message}`);

    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification notification-${type}`;

    // Create icon container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'notification-icon';

    // Create icon element
    const iconElement = document.createElement('i');
    let iconClass: string;
    if (type === 'success') {
      iconClass = 'check-circle';
    } else if (type === 'error') {
      iconClass = 'exclamation-circle';
    } else { // Assuming 'info' is the default or only other type
      iconClass = 'info-circle';
    }
    // Use classList for adding multiple classes safely
    iconElement.classList.add('fa', `fa-${iconClass}`);
    iconContainer.appendChild(iconElement);

    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.className = 'notification-message';
    // Use textContent to safely insert the message, preventing XSS
    messageContainer.textContent = message;

    // Append icon and message containers to the main notification div
    notificationDiv.appendChild(iconContainer);
    notificationDiv.appendChild(messageContainer);

    document.body.appendChild(notificationDiv);

    // Set timeout for hiding and removing the notification
    setTimeout(() => {
      notificationDiv.classList.add('notification-hide');
      // Wait for the fade-out animation (if any) to complete before removing
      setTimeout(() => {
        // Check if the element is still a child of the body before removing
        if (notificationDiv.parentNode === document.body) {
          document.body.removeChild(notificationDiv);
        }
      }, 300); // This duration should match your CSS transition/animation duration
    }, 3000); // Duration the notification is visible
  }

  getNotificationIcon(): string {
    if (!this.notification) return '';

    switch (this.notification.type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': return 'fa-info-circle';
      default: return 'fa-bell';
    }
  }
}
