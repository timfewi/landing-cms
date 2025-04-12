import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EditorService } from '../../services/editor.service';
import { WidgetListComponent } from "../../widgets/widget-list/widget-list.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-editor',
  templateUrl: './section-editor.component.html',
  styleUrls: ['./section-editor.component.css'],
  standalone: true,
  imports: [
    WidgetListComponent,
    ReactiveFormsModule,
    CommonModule
  ],
})
export class SectionEditorComponent implements OnInit, OnDestroy {
  @Input() sectionIndex: number = -1;

  sectionForm?: FormGroup;

  // Sektionstypen
  readonly sectionTypes = [
    { value: 'hero', label: 'Hero-Bereich', icon: 'fa-jedi' },
    { value: 'features', label: 'Features-Bereich', icon: 'fa-th-large' },
    { value: 'contact', label: 'Kontaktbereich', icon: 'fa-envelope' },
    { value: 'showcase', label: 'Showcase-Bereich', icon: 'fa-image' },
    { value: 'content', label: 'Content-Bereich', icon: 'fa-align-left' },
    { value: 'cta', label: 'Call-to-Action', icon: 'fa-bullhorn' },
    { value: 'testimonials', label: 'Kundenstimmen', icon: 'fa-quote-right' },
    { value: 'pricing', label: 'Preise', icon: 'fa-tag' }
  ];

  // Hintergrundoptionen für Sektionen
  readonly backgroundOptions = [
    { value: 'none', label: 'Keine', icon: 'fa-ban' },
    { value: 'color', label: 'Farbe', icon: 'fa-color' },
    { value: 'gradient', label: 'Farbverlauf', icon: 'fa-rainbow' },
    { value: 'image', label: 'Bild', icon: 'fa-image' },
    { value: 'pattern', label: 'Muster', icon: 'fa-backward' }
  ];

  // Abstandsoptionen
  readonly paddingOptions = [
    { value: 'none', label: 'Kein Abstand', size: '0' },
    { value: 'small', label: 'Klein', size: '1rem' },
    { value: 'medium', label: 'Mittel', size: '2rem' },
    { value: 'large', label: 'Groß', size: '3rem' },
    { value: 'xl', label: 'Sehr groß', size: '5rem' }
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly editorService: EditorService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    // Create a default form if one doesn't exist
    if (this.sectionIndex >= 0) {
      const sectionsArray = this.editorService.getSectionsArray();
      if (sectionsArray && sectionsArray.length > this.sectionIndex) {
        this.sectionForm = sectionsArray.at(this.sectionIndex) as FormGroup;
      } else {
        // Fallback: Create a default form group if the section doesn't exist in the array
        this.createDefaultFormGroup();
      }
    } else {
      // Create a default form group if we don't have a valid section index
      this.createDefaultFormGroup();
    }
  }

  private createDefaultFormGroup(): void {
    this.sectionForm = this.fb.group({
      id: [''],
      title: ['Neue Sektion'],
      type: ['content'],
      settings: this.fb.group({
        fullWidth: [false],
        background: ['#ffffff'],
        textColor: ['#333333'],
        padding: ['medium']
      }),
      widgets: this.fb.array([])
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Kopiert die aktuelle Sektion und fügt sie danach ein
   */
  duplicateSection(): void {
    if (this.sectionIndex < 0 || !this.sectionForm) return;

    const sectionsArray = this.editorService.getSectionsArray();
    if (!sectionsArray) return;

    const originalValue = this.sectionForm.value;
    const newSection = this.editorService.createSectionFormGroup({
      title: `${originalValue.title} (Kopie)`,
      type: originalValue.type,
      settings: originalValue.settings
    });

    // Widgets kopieren, wenn vorhanden
    if (originalValue.widgets) {
      const newWidgetsArray = newSection.get('widgets');

      originalValue.widgets.forEach((widget: any) => {
        const newWidget = this.editorService.createWidgetFormGroup(widget.type, widget);
        (newWidgetsArray as any).push(newWidget);
      });
    }

    // Neue Sektion einfügen
    sectionsArray.insert(this.sectionIndex + 1, newSection);

    // Sektionen neu nummerieren
    sectionsArray.controls.forEach((section, index) => {
      section.get('order')?.setValue(index + 1);
    });
  }
}
