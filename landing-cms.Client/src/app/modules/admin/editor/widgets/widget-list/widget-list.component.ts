import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormArray, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';

import { EditorService } from '../../services/editor.service';
import { WidgetEditorComponent } from '../widget-editor/widget-editor.component';
import { WidgetCategoriesComponent } from '../widget-categories/widget-categories.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widget-list',
  templateUrl: './widget-list.component.html',
  styleUrls: ['./widget-list.component.css'],
  standalone: true,
  imports: [
    WidgetEditorComponent,
    WidgetCategoriesComponent,
    CommonModule,
    ReactiveFormsModule,
    DragDropModule
  ],
  animations: [
    trigger('menuAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class WidgetListComponent implements OnInit, OnDestroy {
  @Input() sectionIndex: number = -1;

  widgetCollapsed: { [key: number]: boolean } = {};
  widgetMenuOpen = false;
  selectedWidgetIndex: number | null = null;

  // Widget Kategorien und Typen (könnten aus einem Service kommen)
  widgetGroups = [
    { id: 'text', label: 'Text-Elemente', icon: 'fa-font' },
    { id: 'media', label: 'Medien', icon: 'fa-photo-video' },
    { id: 'interactive', label: 'Interaktive Elemente', icon: 'fa-hand-pointer' },
    { id: 'content', label: 'Inhaltselemente', icon: 'fa-cubes' },
    { id: 'layout', label: 'Layout-Elemente', icon: 'fa-object-group' }
  ];

  readonly widgetTypes = [
    // Text-Gruppe
    { value: 'heading', label: 'Überschrift', icon: 'fa-heading', group: 'text' },
    { value: 'paragraph', label: 'Textabsatz', icon: 'fa-paragraph', group: 'text' },
    { value: 'text', label: 'Text', icon: 'fa-font', group: 'text' },
    { value: 'list', label: 'Liste', icon: 'fa-list', group: 'text' },
    { value: 'quote', label: 'Zitat', icon: 'fa-quote-left', group: 'text' },

    // Medien-Gruppe
    { value: 'image', label: 'Bild', icon: 'fa-image', group: 'media' },
    { value: 'gallery', label: 'Bildergalerie', icon: 'fa-images', group: 'media' },
    { value: 'video', label: 'Video', icon: 'fa-video', group: 'media' },

    // Interaktive Elemente
    { value: 'button', label: 'Button', icon: 'fa-mouse-pointer', group: 'interactive' },
    { value: 'form', label: 'Formular', icon: 'fa-wpforms', group: 'interactive' },

    // Inhaltselemente
    { value: 'feature-item', label: 'Feature-Element', icon: 'fa-star', group: 'content' },
    { value: 'card', label: 'Karte', icon: 'fa-credit-card', group: 'content' },
    { value: 'table', label: 'Tabelle', icon: 'fa-table', group: 'content' },
    { value: 'faq', label: 'FAQ', icon: 'fa-question-circle', group: 'content' },
    { value: 'testimonial', label: 'Kundenstimme', icon: 'fa-comment-dots', group: 'content' },
    { value: 'pricing-table', label: 'Preistabelle', icon: 'fa-tags', group: 'content' },

    // Layout-Elemente
    { value: 'divider', label: 'Trennlinie', icon: 'fa-minus', group: 'layout' },
    { value: 'spacer', label: 'Abstand', icon: 'fa-arrows-alt-v', group: 'layout' }
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly editorService: EditorService) { }

  ngOnInit(): void {
    this.editorService.selectedWidget$
      .pipe(takeUntil(this.destroy$))
      .subscribe(indices => {
        if (indices && indices.sectionIndex === this.sectionIndex) {
          this.selectedWidgetIndex = indices.widgetIndex;
        } else {
          this.selectedWidgetIndex = null;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Gibt die Widgets der aktuellen Sektion zurück
   */
  get widgets(): FormArray {
    if (this.sectionIndex < 0) {
      return new FormArray<any>([]); // Leeres FormArray zurückgeben, wenn keine Sektion ausgewählt ist
    }

    const widgetsArray = this.editorService.getWidgetsArray(this.sectionIndex);
    return widgetsArray || new FormArray<any>([]);
  }

  /**
   * Behandelt das Verschieben von Widgets per Drag & Drop
   */
  onWidgetDrop(event: CdkDragDrop<any[]>): void {
    const widgetsArray = this.editorService.getWidgetsArray(this.sectionIndex);
    if (!widgetsArray) return;

    // Aktualisiere die Reihenfolge im FormArray
    moveItemInArray(widgetsArray.controls, event.previousIndex, event.currentIndex);
    this.updateWidgetOrder();

    // UI Status aktualisieren
    const tempCollapsed = { ...this.widgetCollapsed };
    this.widgetCollapsed = {};

    Object.keys(tempCollapsed).forEach(key => {
      const oldIndex = parseInt(key);
      let newIndex = oldIndex;

      if (oldIndex === event.previousIndex) {
        newIndex = event.currentIndex;
      } else if (oldIndex > event.previousIndex && oldIndex <= event.currentIndex) {
        newIndex = oldIndex - 1;
      } else if (oldIndex < event.previousIndex && oldIndex >= event.currentIndex) {
        newIndex = oldIndex + 1;
      }

      this.widgetCollapsed[newIndex] = tempCollapsed[oldIndex];
    });
  }

  /**
   * Aktualisiert die Reihenfolge aller Widgets
   */
  private updateWidgetOrder(): void {
    const widgetsArray = this.editorService.getWidgetsArray(this.sectionIndex);
    if (!widgetsArray) return;

    widgetsArray.controls.forEach((widget, index) => {
      widget.get('order')?.setValue(index + 1);
    });
  }

  /**
   * Klappt ein Widget auf/zu
   */
  toggleWidgetCollapsed(widgetIndex: number): void {
    this.widgetCollapsed[widgetIndex] = !this.widgetCollapsed[widgetIndex];
  }

  /**
   * Wählt ein Widget zur Bearbeitung aus
   */
  selectWidget(widgetIndex: number): void {
    this.editorService.selectWidget({ sectionIndex: this.sectionIndex, widgetIndex });
  }

  /**
   * Zeigt/versteckt das Widget-Menü
   */
  toggleWidgetMenu(): void {
    this.widgetMenuOpen = !this.widgetMenuOpen;
  }

  /**
   * Schließt das Widget-Menü, wenn auf den Hintergrund geklickt wird,
   * nicht aber, wenn auf das Menü selbst geklickt wird
   */
  closeWidgetMenuOnBackdropClick(event: MouseEvent): void {
    // Nur schließen, wenn direkt auf den Hintergrund geklickt wurde
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.widgetMenuOpen = false;
    }
  }

  /**
   * Fügt ein neues Widget hinzu
   */
  addWidget(type: string = 'text'): void {
    // Ensure a valid section is selected before trying to add a widget
    if (this.sectionIndex < 0) {
      console.warn('Cannot add widget: No section selected');
      return;
    }

    const widgetsArray = this.editorService.getWidgetsArray(this.sectionIndex);
    if (!widgetsArray) {
      this.handleMissingWidgetsArray(type);
      return;
    }

    // Normal flow with valid widgets array
    this.addWidgetToArray(widgetsArray, type);
  }

  /**
   * Handles the case when widgets array is missing and attempts to fix it
   */
  private handleMissingWidgetsArray(type: string): void {
    // Log more detailed information for debugging
    console.error(`Failed to get widgets array for section index ${this.sectionIndex}`);

    // Check if section exists but widgets form array is missing
    const sectionsArray = this.editorService.getSectionsArray();
    if (!this.attemptToFixWidgetsArray(sectionsArray)) {
      return;
    }

    // Try getting the widgets array again after potential fix
    const updatedWidgetsArray = this.editorService.getWidgetsArray(this.sectionIndex);
    if (!updatedWidgetsArray) {
      console.error('Still unable to get widgets array after attempted fix');
      return;
    }

    // Continue with the updated widgets array
    this.addWidgetToArray(updatedWidgetsArray, type);
  }

  /**
   * Attempts to fix the widgets array if it's missing
   * Returns true if fix was attempted, false otherwise
   */
  private attemptToFixWidgetsArray(sectionsArray: FormArray): boolean {
    if (!sectionsArray || this.sectionIndex >= sectionsArray.length) {
      return false;
    }

    const section = sectionsArray.at(this.sectionIndex);
    if (!section) {
      return false;
    }

    console.log('Section exists but widgets form array might be invalid:', section);

    // Try to initialize widgets array if it doesn't exist
    if (section instanceof FormGroup && !section.get('widgets')) {
      console.log('Attempting to create widgets form array for section');
      section.addControl('widgets', new FormArray([]));
      return true;
    }

    return true;
  }

  /**
   * Adds a widget to the specified form array
   * Helper method to avoid code duplication
   */
  private addWidgetToArray(widgetsArray: FormArray, type: string): void {
    // Pass only the type string as the first argument
    const widget = this.editorService.createWidgetFormGroup(type);

    widgetsArray.push(widget);

    // UI Status aktualisieren
    const newIndex = widgetsArray.length - 1;
    this.widgetCollapsed[newIndex] = false;

    // Widget auswählen
    this.editorService.selectWidget({ sectionIndex: this.sectionIndex, widgetIndex: newIndex });

    // Widget-Menü schließen
    this.widgetMenuOpen = false;
  }

  /**
   * Löscht ein Widget
   */
  deleteWidget(widgetIndex: number): void {
    if (confirm('Sind Sie sicher, dass Sie dieses Widget löschen möchten?')) {
      const widgetsArray = this.editorService.getWidgetsArray(this.sectionIndex);
      if (!widgetsArray) return;

      widgetsArray.removeAt(widgetIndex);

      // UI Status aktualisieren
      for (let i = widgetIndex; i < widgetsArray.length; i++) {
        this.widgetCollapsed[i] = this.widgetCollapsed[i + 1];
      }

      delete this.widgetCollapsed[widgetsArray.length];

      // Ausgewähltes Widget aktualisieren
      if (this.selectedWidgetIndex === widgetIndex) {
        this.editorService.selectWidget(null); // Keine Auswahl
      } else if (this.selectedWidgetIndex && this.selectedWidgetIndex > widgetIndex) {
        this.editorService.selectWidget({ sectionIndex: this.sectionIndex, widgetIndex: this.selectedWidgetIndex - 1 });
      }

      // Neu nummerieren
      this.updateWidgetOrder();
    }
  }

  /**
   * Gibt den Label-Text für einen Widget-Typ zurück
   */
  getWidgetTypeLabel(type: string): string {
    const widgetType = this.widgetTypes.find(t => t.value === type);
    return widgetType ? widgetType.label : 'Unbekanntes Widget';
  }

  /**
   * Gibt die Widget-Typen für eine bestimmte Gruppe zurück
   */
  getWidgetsByGroup(groupId: string): any[] {
    return this.widgetTypes.filter(widget => widget.group === groupId);
  }
}
