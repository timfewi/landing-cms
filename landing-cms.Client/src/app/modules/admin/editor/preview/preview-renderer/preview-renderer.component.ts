import { Component, Input, OnChanges, OnInit, Output, EventEmitter, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Page, Section, Widget } from '../../../../landing-page/models/page.model';
import { EditorService } from '../../services/editor.service';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList, CdkDragEnter, CdkDragMove } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { animate, state, style, transition, trigger, keyframes } from '@angular/animations';

const dropAnimation = trigger('dropAnimation', [
  transition(':enter', [
    style({ transform: 'scale(0.8)', opacity: 0 }),
    animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
      style({ transform: 'scale(1)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
      style({ transform: 'scale(0.8)', opacity: 0 }))
  ])
]);

const dragPulse = trigger('dragPulse', [
  state('pulsing', style({
    boxShadow: '0 0 0 rgba(13, 110, 253, 0.4)'
  })),
  state('idle', style({
    boxShadow: '0 0 0 0 rgba(13, 110, 253, 0)'
  })),
  transition('idle => pulsing', [
    animate('1.5s ease-in-out', keyframes([
      style({ boxShadow: '0 0 0 0 rgba(13, 110, 253, 0.4)', offset: 0 }),
      style({ boxShadow: '0 0 0 10px rgba(13, 110, 253, 0)', offset: 0.7 }),
      style({ boxShadow: '0 0 0 0 rgba(13, 110, 253, 0)', offset: 1 })
    ]))
  ])
]);

@Component({
  selector: 'app-preview-renderer',
  templateUrl: './preview-renderer.component.html',
  styleUrls: ['./preview-renderer.component.css'],
  standalone: true,
  imports: [CommonModule, DragDropModule, MatTooltipModule],
  animations: [
    dropAnimation,
    dragPulse,
    trigger('dropAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-20px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void => *', [
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ]),
      transition('* => void', [
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ])
    ]),
    trigger('dragPulse', [
      state('inactive', style({
        boxShadow: 'none'
      })),
      state('active', style({
        boxShadow: '0 0 20px rgba(13,110,253,0.6)'
      })),
      transition('inactive <=> active', [
        animate('600ms ease-in-out')
      ])
    ]),
    trigger('dragFeedback', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class PreviewRendererComponent implements OnChanges, OnInit {
  @Input() page: Page | null = null;
  @Input() deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  @Input() zoom: number = 100;

  @Output() sectionSelected = new EventEmitter<number>();
  @Output() widgetSelected = new EventEmitter<{ sectionIndex: number, widgetIndex: number }>();

  previewWrapperStyles: any = {};
  previewContainerStyles: any = {};

  // Indizes für die aktive Auswahl
  selectedSectionIndex: number = -1;
  selectedWidgetIndex: number = -1;

  // Für Seiten-Properties Tab
  pagePropertiesTab: string = 'basic';

  // Widget-Typen für Labels
  private readonly widgetTypes: { [key: string]: string } = {
    'heading': 'Überschrift',
    'paragraph': 'Textabsatz',
    'text': 'Text',
    'list': 'Liste',
    'quote': 'Zitat',
    'image': 'Bild',
    'gallery': 'Bildergalerie',
    'video': 'Video',
    'button': 'Button',
    'form': 'Formular',
    'divider': 'Trennlinie',
    'spacer': 'Abstand',
    'feature-item': 'Feature-Element',
    'card': 'Karte',
    'table': 'Tabelle',
    'faq': 'FAQ',
    'testimonial': 'Kundenstimme',
    'pricing-table': 'Preistabelle'
  };

  // New properties for enhanced drag-and-drop
  dragPlaceholderClass = 'drag-placeholder-enhanced';
  dropIndicatorVisible = false;
  dragPreviewClass = 'drag-preview-enhanced';
  draggedItem: any = null;
  dropTargetIndex: number = -1;
  dragActive: boolean = false;
  draggedItemType: 'section' | 'widget' | null = null;
  currentDropZone: any = null;
  dropIndicatorTop: number = 0;
  touchDevice: boolean = false;

  constructor(private readonly editorService: EditorService) { }

  ngOnInit(): void {
    // Ausgewähltes Element verfolgen
    this.editorService.selectedSection$.subscribe(index => {
      this.selectedSectionIndex = index;
    });

    this.editorService.selectedWidget$.subscribe(indices => {
      if (indices) {
        this.selectedSectionIndex = indices.sectionIndex;
        this.selectedWidgetIndex = indices.widgetIndex;
      } else {
        this.selectedWidgetIndex = -1;
      }
    });

    // Detect if device has touch capabilities
    this.touchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updatePreviewStyles();
  }

  /**
   * Aktualisiert die Stile basierend auf dem Gerätetyp und Zoom
   */
  private updatePreviewStyles(): void {
    // Basisstile für den Container
    this.previewWrapperStyles = {
      'overflow': 'auto',
      'height': '100%',
      'display': 'flex',
      'justify-content': 'center',
      'align-items': 'flex-start',
      'padding': '20px'
    };

    // Geräteabhängige Stile
    const scale = this.zoom / 100;

    switch (this.deviceType) {
      case 'desktop':
        this.previewContainerStyles = {
          'width': '1200px',
          'transform': `scale(${scale})`,
          'transform-origin': 'top center',
          'border': '1px solid #e0e0e0',
          'box-shadow': '0 0 10px rgba(0,0,0,0.1)',
          'min-height': '800px',
          'background-color': '#ffffff'
        };
        break;
      case 'tablet':
        this.previewContainerStyles = {
          'width': '768px',
          'transform': `scale(${scale})`,
          'transform-origin': 'top center',
          'border': '1px solid #e0e0e0',
          'border-radius': '8px',
          'box-shadow': '0 0 10px rgba(0,0,0,0.1)',
          'min-height': '1024px',
          'background-color': '#ffffff'
        };
        break;
      case 'mobile':
        this.previewContainerStyles = {
          'width': '375px',
          'transform': `scale(${scale})`,
          'transform-origin': 'top center',
          'border': '1px solid #e0e0e0',
          'border-radius': '16px',
          'box-shadow': '0 0 10px rgba(0,0,0,0.1)',
          'min-height': '667px',
          'background-color': '#ffffff'
        };
        break;
    }
  }

  /**
   * Predicate that determines whether an item can be dropped into a list
   * Used to provide visual feedback during drag operations
   */
  dropListEnterPredicate(item: CdkDrag<any>, list: CdkDropList<any>): boolean {
    // Get the data being dragged
    const dragData = item.data;
    const dropListId = list.id;

    // Check if we're dropping a widget into a section's widget list
    if (dragData.type === 'widget' && dropListId.includes('widget-list')) {
      // Check for widget compatibility with the section
      const sectionId = dropListId.replace('widget-list-', '');
      const section = this.page?.sections.find(s => s.id === sectionId);

      if (!section) {
        this.editorService.showNotification('error', 'Cannot identify target section');
        return false;
      }

      // Check if the section has a limit on the number of widgets
      // Check if the section has a limit on the number of widgets
      // Removed check for section.maxWidgets as it does not exist on the Section interface

      // Check if the widget is compatible with this section type
      if (section.settings?.allowedWidgetTypes && section.settings.allowedWidgetTypes.length > 0) {
        if (!section.settings.allowedWidgetTypes.includes(dragData.widgetType)) {
          this.editorService.showNotification('warning', `Widget type "${dragData.widgetType}" is not compatible with this section`);
          return false;
        }
      }

      // All checks passed
      this.editorService.showNotification('info', `Widget can be placed in this section`, 1000);
      return true;
    }

    // Check if we're dropping a section into the page
    if (dragData.type === 'section') {
      // Check if there's a limit on the number of sections
      // TODO: Implement section limit check if needed (e.g., add maxSections to Page interface or use a config value)
      // if (this.page?.sections && this.page?.sections.length >= SOME_LIMIT) {
      //   this.editorService.showNotification('warning', `This page can only contain ${SOME_LIMIT} sections`);
      //   return false;
      // }

      // All checks passed

      this.editorService.showNotification('info', `Section can be placed on this page`, 1000);
      return true;
    }

    return true;
  }

  /**
   * Event handler beim Fallenlassen eines Widgets in einer Sektion
   */
  onDropWidgetInSection(event: CdkDragDrop<Widget[]>, sectionIndex: number): void {
    if (!this.page?.sections) return;

    if (event.previousContainer === event.container) {
      // Widget innerhalb einer Sektion bewegen
      moveItemInArray(
        this.page.sections[sectionIndex].widgets,
        event.previousIndex,
        event.currentIndex
      );

      // Aktualisiere die Reihenfolge
      this.updateWidgetsOrder(sectionIndex);
    } else {
      // Widget aus einer anderen Sektion oder aus der Widget-Liste übertragen
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Aktualisiere die Reihenfolge
      this.updateWidgetsOrder(sectionIndex);
    }
    this.editorService.markPageDirty();

    // Add additional visual feedback
    this.editorService.showNotification('success', 'Widget erfolgreich verschoben', 1500);
    this.resetDragState();
  }

  /**
   * Aktualisiert die Reihenfolge der Widgets in einer Sektion
   */
  private updateWidgetsOrder(sectionIndex: number): void {
    if (!this.page?.sections?.[sectionIndex]) return;

    this.page.sections[sectionIndex].widgets.forEach((widget, index) => {
      widget.order = index;
    });
  }

  /**
   * Event handler beim Fallenlassen eines Widgets direkt auf die Seite (erzeugt eine neue Sektion)
   */
  onDropWidget(event: CdkDragDrop<Widget[]>): void {
    if (!this.page) {
      this.page = this.createDefaultPage();
    }

    if (!this.page.sections) {
      this.page.sections = [];
    }

    // Neue Sektion erstellen, wenn Widget direkt auf die Seite gezogen wird
    const newSection: Section = {
      id: this.generateUniqueId(),
      title: 'Neue Sektion',
      type: 'standard',
      order: this.page.sections.length,
      settings: {
        name: 'Neue Sektion',
        background: '#ffffff',
        textColor: '#333333',
        padding: '20px',
        fullWidth: false
      },
      widgets: []
    };

    this.page.sections.push(newSection);

    // Widget zur neuen Sektion hinzufügen, wenn es aus einem Container kommt
    if (event.previousContainer.data && event.previousContainer.data.length > 0) {
      const widget = event.previousContainer.data[event.previousIndex];
      newSection.widgets.push(widget);
      event.previousContainer.data.splice(event.previousIndex, 1);
    }

    this.editorService.markPageDirty();

    // Automatisch die neue Sektion auswählen
    this.selectSection(this.page.sections.length - 1);

    // Add additional visual feedback
    this.editorService.showNotification('success', 'Neue Sektion mit Widget erstellt', 1500);
    this.resetDragState();
  }

  /**
   * Event handler beim Fallenlassen einer Sektion zum Umordnen
   */
  onDropSectionReorder(event: CdkDragDrop<Section[]>): void {
    if (!this.page?.sections) return;

    if (event.previousContainer === event.container) {
      moveItemInArray(
        this.page.sections,
        event.previousIndex,
        event.currentIndex
      );

      // Aktualisiere die Order-Eigenschaft für jede Sektion
      this.page.sections.forEach((section, index) => {
        section.order = index;
      });

      this.editorService.markPageDirty();

      // Add additional visual feedback
      this.editorService.showNotification('success', 'Sektion erfolgreich umsortiert', 1500);
      this.resetDragState();
    }
  }

  /**
   * Event handler beim Fallenlassen einer Sektion aus der Seitenleiste
   */
  onDropSection(event: CdkDragDrop<Section[]>): void {
    if (!this.page) {
      this.page = this.createDefaultPage();
    }

    if (!this.page.sections) {
      this.page.sections = [];
    }

    if (event.previousContainer !== event.container) {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Aktualisiere die Order-Eigenschaft für jede Sektion
      this.page.sections.forEach((section, index) => {
        section.order = index;
      });

      this.editorService.markPageDirty();

      // Add additional visual feedback
      this.editorService.showNotification('success', 'Sektion erfolgreich hinzugefügt', 1500);
      this.resetDragState();
    }
  }

  /**
   * Erstelle eine neue Sektion
   */
  addNewSection(): void {
    if (!this.page) {
      this.page = this.createDefaultPage();
    }

    if (!this.page.sections) {
      this.page.sections = [];
    }

    const newSection: Section = {
      id: this.generateUniqueId(),
      title: 'Neue Sektion',
      type: 'standard',
      order: this.page.sections.length,
      settings: {
        name: 'Neue Sektion',
        background: '#ffffff',
        textColor: '#333333',
        padding: '20px',
        fullWidth: false
      },
      widgets: []
    };

    this.page.sections.push(newSection);
    this.editorService.markPageDirty();

    // Wähle die neue Sektion aus
    this.selectSection(this.page.sections.length - 1);
  }

  /**
   * Füge ein Widget zu einer bestimmten Sektion hinzu
   */
  addWidgetToSection(sectionIndex: number): void {
    if (!this.page?.sections?.[sectionIndex]) {
      return;
    }

    // Öffne das Widget-Auswahlmenü
    this.editorService.openWidgetSelectionFor(sectionIndex);
  }

  /**
   * Wähle eine Sektion aus
   */
  selectSection(index: number): void {
    this.selectedSectionIndex = index;
    this.selectedWidgetIndex = -1;
    this.editorService.selectSection(index);
    this.sectionSelected.emit(index);
  }

  /**
   * Wähle ein Widget aus
   */
  selectWidget(sectionIndex: number, widgetIndex: number): void {
    this.selectedSectionIndex = sectionIndex;
    this.selectedWidgetIndex = widgetIndex;
    this.editorService.selectWidget({
      sectionIndex: sectionIndex,
      widgetIndex: widgetIndex
    });
    this.widgetSelected.emit({
      sectionIndex: sectionIndex,
      widgetIndex: widgetIndex
    });
  }

  /**
   * Dupliziere eine Sektion
   */
  cloneSection(sectionIndex: number): void {
    if (!this.page?.sections || sectionIndex < 0 || sectionIndex >= this.page.sections.length) {
      return;
    }

    const originalSection = this.page.sections[sectionIndex];
    const clonedSection = JSON.parse(JSON.stringify(originalSection)) as Section;
    clonedSection.id = this.generateUniqueId();
    clonedSection.order = this.page.sections.length;
    if (clonedSection.settings?.name) {
      clonedSection.settings.name = `${originalSection.settings.name} (Kopie)`;
    }

    this.page.sections.splice(sectionIndex + 1, 0, clonedSection);

    // Aktualisiere die Order-Eigenschaft für nachfolgende Sektionen
    for (let i = sectionIndex + 2; i < this.page.sections.length; i++) {
      this.page.sections[i].order = i;
    }

    this.editorService.markPageDirty();

    // Wähle die neue duplizierte Sektion aus
    this.selectSection(sectionIndex + 1);
  }

  /**
   * Dupliziere ein Widget
   */
  cloneWidget(sectionIndex: number, widgetIndex: number): void {
    if (!this.page?.sections ||
      sectionIndex < 0 || sectionIndex >= this.page.sections.length ||
      widgetIndex < 0 || widgetIndex >= this.page.sections[sectionIndex].widgets.length) {
      return;
    }

    const originalWidget = this.page.sections[sectionIndex].widgets[widgetIndex];
    const clonedWidget = JSON.parse(JSON.stringify(originalWidget)) as Widget;
    clonedWidget.id = this.generateUniqueId();

    if (clonedWidget.settings?.name) {
      clonedWidget.settings.name = `${originalWidget.settings.name} (Kopie)`;
    }

    this.page.sections[sectionIndex].widgets.splice(widgetIndex + 1, 0, clonedWidget);

    // Aktualisiere die Reihenfolge aller Widgets in der Sektion
    this.updateWidgetsOrder(sectionIndex);

    this.editorService.markPageDirty();

    // Wähle das neue duplizierte Widget aus
    this.selectWidget(sectionIndex, widgetIndex + 1);
  }

  /**
   * Lösche eine Sektion
   */
  deleteSection(sectionIndex: number): void {
    if (!this.page || !this.page.sections || sectionIndex < 0 || sectionIndex >= this.page.sections.length) {
      return;
    }

    if (confirm('Sind Sie sicher, dass Sie diese Sektion löschen möchten? Alle enthaltenen Widgets werden ebenfalls gelöscht.')) {
      this.page.sections.splice(sectionIndex, 1);

      // Aktualisiere die Order-Eigenschaft für nachfolgende Sektionen
      for (let i = sectionIndex; i < this.page.sections.length; i++) {
        this.page.sections[i].order = i;
      }

      this.editorService.markPageDirty();
      this.editorService.selectSection(-1); // Deselektiere alles
    }
  }

  /**
   * Lösche ein Widget
   */
  deleteWidget(sectionIndex: number, widgetIndex: number): void {
    const sectionCount = this.page?.sections?.length;
    const widgetCount = this.page?.sections?.[sectionIndex]?.widgets?.length;

    // Use optional chaining and check against retrieved lengths
    if (sectionIndex < 0 || widgetIndex < 0 || sectionCount === undefined || sectionIndex >= sectionCount || widgetCount === undefined || widgetIndex >= widgetCount) {
      return;
    }

    if (confirm('Sind Sie sicher, dass Sie dieses Widget löschen möchten?')) {
      // Non-null assertion is safe here due to the checks above
      this.page!.sections[sectionIndex].widgets.splice(widgetIndex, 1);

      // Aktualisiere die Reihenfolge aller Widgets in der Sektion
      this.updateWidgetsOrder(sectionIndex);

      this.editorService.markPageDirty();
      this.editorService.selectWidget(null); // Deselektiere das Widget
    }
  }

  /**
   * Erzeugt eine leere Standardseite
   */
  private createDefaultPage(): Page {
    return {
      id: '',
      title: 'Neue Seite',
      slug: 'neue-seite',
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
      isPublished: false,
      sections: []
    };
  }

  /**
   * Generiert eine eindeutige ID für Sektionen und Widgets
   */
  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Hilfsmethoden für die Darstellung
  getSectionPadding(padding: string | undefined): string {
    return padding || '20px';
  }

  getSpacerHeight(size: string | undefined): string {
    switch (size) {
      case 'small': return '20px';
      case 'medium': return '40px';
      case 'large': return '60px';
      case 'xl': return '100px';
      default: return '40px';
    }
  }

  getShadowStyle(shadow: string | undefined): string {
    switch (shadow) {
      case 'none': return 'none';
      case 'small': return '0 2px 4px rgba(0,0,0,0.1)';
      case 'medium': return '0 4px 8px rgba(0,0,0,0.1)';
      case 'large': return '0 8px 16px rgba(0,0,0,0.2)';
      default: return 'none';
    }
  }

  /**
   * Gibt den Label-Text für einen Widget-Typ zurück
   */
  getWidgetTypeLabel(type: string): string {
    return this.widgetTypes[type] || 'Unbekanntes Widget';
  }

  // Enhanced drag event handlers

  onDragStarted(event: any, item: any, type: 'section' | 'widget') {
    this.draggedItem = item;
    this.draggedItemType = type;
    this.dragActive = true;

    // Add a small delay to prevent accidental drags
    setTimeout(() => {
      document.body.classList.add('dragging');
    }, 50);
  }

  onDragEnded(event: any) {
    this.resetDragState();
  }

  onDragMoved(event: CdkDragMove, listElement: HTMLElement) {
    // Update the drop indicator position
    const rect = listElement.getBoundingClientRect();
    const y = event.pointerPosition.y - rect.top;

    // Calculate which position to show the indicator at
    const items = Array.from(listElement.children);
    let dropIndex = 0;

    for (let i = 0; i < items.length; i++) {
      const itemRect = items[i].getBoundingClientRect();
      const itemMiddle = itemRect.top + itemRect.height / 2 - rect.top;

      if (y > itemMiddle) {
        dropIndex = i + 1;
      }
    }

    // Show drop indicator at the calculated position
    if (items.length > 0 && dropIndex < items.length) {
      const itemRect = items[dropIndex].getBoundingClientRect();
      this.dropIndicatorTop = itemRect.top - rect.top;
    } else if (items.length > 0) {
      // Drop at the end
      const lastItemRect = items[items.length - 1].getBoundingClientRect();
      this.dropIndicatorTop = lastItemRect.bottom - rect.top;
    } else {
      // Empty list
      this.dropIndicatorTop = 20;
    }

    this.dropIndicatorVisible = true;
    this.dropTargetIndex = dropIndex;
  }

  onDragEnterDropZone(event: CdkDragEnter, dropZone: any) {
    this.currentDropZone = dropZone;
    // Use animation for visual feedback
  }

  onDragLeaveDropZone() {
    this.currentDropZone = null;
    this.dropIndicatorVisible = false;
  }

  // Helper methods

  resetDragState() {
    this.draggedItem = null;
    this.draggedItemType = null;
    this.dragActive = false;
    this.currentDropZone = null;
    this.dropIndicatorVisible = false;
    document.body.classList.remove('dragging');
  }

  getDragPreviewClass(type: 'section' | 'widget') {
    return {
      'drag-preview-enhanced': true,
      'section-preview': type === 'section',
      'widget-preview': type === 'widget'
    };
  }

  getPlaceholderClass(type: 'section' | 'widget') {
    return {
      'drag-placeholder-enhanced': true,
      'section-placeholder': type === 'section',
      'widget-placeholder': type === 'widget'
    };
  }

  getDropZoneClass(dropZone: any) {
    return {
      'drop-zone': true,
      'active-drop-zone': this.currentDropZone === dropZone,
      'touch-optimized': this.touchDevice
    };
  }


  getSectionFromDropZone(dropZone: any): any {
    // Implementation to find the section associated with a drop zone
    // This depends on your specific data structure
    return null; // Replace with actual implementation
  }
}
