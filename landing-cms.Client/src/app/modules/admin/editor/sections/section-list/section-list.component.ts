import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EditorService } from '../../services/editor.service';
import { SectionEditorComponent } from "../section-editor/section-editor.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-list',
  templateUrl: './section-list.component.html',
  styleUrls: ['./section-list.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    SectionEditorComponent,
    ReactiveFormsModule,
    DragDropModule
  ],
})
export class SectionListComponent implements OnInit, OnDestroy {
  sectionCollapsed: { [key: number]: boolean } = {};
  selectedSectionIndex: number | null = null;
  sectionMenuOpen = false;

  // Sektionstypen, die vom Service später geladen werden könnten
  readonly sectionTypes = [
    { value: 'hero', label: 'Hero-Bereich', icon: 'fa-header' },
    { value: 'features', label: 'Features-Bereich', icon: 'fa-th-large' },
    { value: 'contact', label: 'Kontaktbereich', icon: 'fa-envelope' },
    { value: 'showcase', label: 'Showcase-Bereich', icon: 'fa-image' },
    { value: 'content', label: 'Content-Bereich', icon: 'fa-align-left' },
    { value: 'cta', label: 'Call-to-Action', icon: 'fa-bullhorn' },
    { value: 'testimonials', label: 'Kundenstimmen', icon: 'fa-quote-right' },
    { value: 'pricing', label: 'Preise', icon: 'fa-tag' }
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly editorService: EditorService) { }

  ngOnInit(): void {
    this.editorService.selectedSection$
      .pipe(takeUntil(this.destroy$))
      .subscribe(index => {
        this.selectedSectionIndex = index;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get sections(): FormArray {
    const sectionsArray = this.editorService.getSectionsArray();
    return sectionsArray ?? new FormArray<any>([]);
  }

  onSectionDrop(event: CdkDragDrop<any[]>): void {
    // Aktualisiere die Reihenfolge im FormArray
    const sectionsArray = this.editorService.getSectionsArray();
    if (!sectionsArray) return;

    moveItemInArray(sectionsArray.controls, event.previousIndex, event.currentIndex);
    this.updateSectionOrder();

    // UI Status neu organisieren
    const tempCollapsed = { ...this.sectionCollapsed };
    this.sectionCollapsed = {};

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

      this.sectionCollapsed[newIndex] = tempCollapsed[oldIndex];
    });
  }

  private updateSectionOrder(): void {
    const sectionsArray = this.editorService.getSectionsArray();
    if (!sectionsArray) return;

    sectionsArray.controls.forEach((section, index) => {
      section.get('order')?.setValue(index + 1);
    });
  }

  toggleSectionCollapsed(index: number): void {
    this.sectionCollapsed[index] = !this.sectionCollapsed[index];
  }

  selectSection(index: number): void {
    this.editorService.selectSection(index);
  }

  toggleSectionMenu(): void {
    this.sectionMenuOpen = !this.sectionMenuOpen;
  }

  addSection(type: string = 'content'): void {
    const sectionsArray = this.editorService.getSectionsArray();
    if (!sectionsArray) return;

    const section = this.editorService.createSectionFormGroup({
      type: type,
      title: this.getSectionTypeLabel(type),
      order: sectionsArray.length + 1,
      settings: {
        fullWidth: false,
        background: '#ffffff',
        textColor: '#333333',
        padding: 'medium'
      },
      widgets: []
    });

    sectionsArray.push(section);

    // Aktualisiere UI-Status
    const newIndex = sectionsArray.length - 1;
    this.sectionCollapsed[newIndex] = false;

    // Wähle die neue Sektion aus
    this.editorService.selectSection(newIndex);
  }

  deleteSection(index: number): void {
    if (confirm('Sind Sie sicher, dass Sie diesen Abschnitt löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      const sectionsArray = this.editorService.getSectionsArray();
      if (!sectionsArray) return;

      sectionsArray.removeAt(index);

      // UI-Status aktualisieren
      for (let i = index; i < sectionsArray.length; i++) {
        this.sectionCollapsed[i] = this.sectionCollapsed[i + 1];
      }

      delete this.sectionCollapsed[sectionsArray.length];

      // Aktualisiere die ausgewählte Sektion
      if (this.selectedSectionIndex === index) {
        this.editorService.selectSection(-1); // Use -1 to indicate no selection
      } else if (this.selectedSectionIndex && this.selectedSectionIndex > index) {
        this.editorService.selectSection(this.selectedSectionIndex - 1);
      }

      // Neu nummerieren
      this.updateSectionOrder();
    }
  }

  getSectionTypeLabel(type: string): string {
    const sectionType = this.sectionTypes.find(t => t.value === type);
    return sectionType ? sectionType.label : 'Unbekannte Sektion';
  }

  getSectionIcon(type: string): string {
    const sectionType = this.sectionTypes.find(t => t.value === type);
    return sectionType ? sectionType.icon : 'fa-question-circle';
  }
}
