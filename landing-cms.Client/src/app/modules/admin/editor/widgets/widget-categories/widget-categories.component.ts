import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widget-categories',
  templateUrl: './widget-categories.component.html',
  styleUrls: ['./widget-categories.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class WidgetCategoriesComponent implements OnInit {
  @Input() widgetGroups: any[] = [];
  @Input() widgetTypes: any[] = [];
  @Output() widgetSelected = new EventEmitter<string>();
  @Output() categorySelected = new EventEmitter<string>();

  activeGroup: string = '';

  ngOnInit() {
    // Standardmäßig die erste Gruppe aktivieren
    if (this.widgetGroups.length > 0) {
      this.activeGroup = this.widgetGroups[0].id;
    }
  }

  /**
   * Setzt die aktive Widget-Gruppe
   */
  setActiveGroup(groupId: string): void {
    this.activeGroup = groupId;
    this.categorySelected.emit(groupId);
  }

  /**
   * Gibt die Widget-Typen für eine bestimmte Gruppe zurück
   */
  getWidgetsByGroup(groupId: string): any[] {
    return this.widgetTypes.filter(widget => widget.group === groupId);
  }

  /**
   * Liefert den Namen der aktuell ausgewählten Kategorie
   */
  getActiveCategoryName(): string {
    const activeGroup = this.widgetGroups.find(group => group.id === this.activeGroup);
    return activeGroup ? activeGroup.label : 'Kategorie';
  }

  /**
   * Emittiert das Widget-Selected-Ereignis
   */
  selectWidget(widgetType: string): void {
    this.widgetSelected.emit(widgetType);
  }
}
