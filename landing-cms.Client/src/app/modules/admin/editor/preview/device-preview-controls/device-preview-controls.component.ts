import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

type PreviewMode = 'desktop' | 'tablet' | 'mobile';

@Component({
  selector: 'app-device-preview-controls',
  templateUrl: './device-preview-controls.component.html',
  standalone: true,
  imports: [
    CommonModule,
  ],
})
export class DevicePreviewControlsComponent {
  @Input() mode: PreviewMode = 'desktop';
  @Input() scale: number = 1;

  @Output() modeChange = new EventEmitter<PreviewMode>();
  @Output() scaleChange = new EventEmitter<number>();

  // Gerättypen für die Vorschau
  readonly devices = [
    { id: 'desktop', label: 'Desktop', icon: 'fa-desktop' },
    { id: 'tablet', label: 'Tablet', icon: 'fa-tablet' },
    { id: 'mobile', label: 'Mobile', icon: 'fa-mobile' }
  ];

  // Zoom-Optionen in Prozent, um mit dem Editor-Component zu arbeiten
  readonly zoomLevels = [
    { value: 50, label: '50%' },
    { value: 75, label: '75%' },
    { value: 100, label: '100%' },
    { value: 125, label: '125%' },
    { value: 150, label: '150%' }
  ];

  /**
   * Ändert den Vorschaumodus (Gerätetyp)
   */
  changeMode(newMode: PreviewMode): void {
    if (this.mode !== newMode) {
      this.mode = newMode;
      this.modeChange.emit(newMode);
    }
  }

  /**
   * Ändert die Zoomstufe
   */
  changeScale(newScale: number): void {
    if (this.scale !== newScale) {
      this.scale = newScale;
      this.scaleChange.emit(newScale);
    }
  }
}
