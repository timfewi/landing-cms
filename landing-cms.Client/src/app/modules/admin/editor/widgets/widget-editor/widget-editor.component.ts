import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EditorService } from '../../services/editor.service';

@Component({
    selector: 'app-widget-editor',
    templateUrl: './widget-editor.component.html',
    styleUrls: ['./widget-editor.component.css'],
    standalone: true,
    imports: [
      CommonModule,
      ReactiveFormsModule,
      NgIf
    ],
})
export class WidgetEditorComponent implements OnInit, OnDestroy {
    @Input() sectionIndex: number = -1;
    @Input() widgetIndex: number = -1;

    widgetForm?: FormGroup;
    widgetType: string = '';

    // Standardkonfigurationen für jedes Widget
    widgetDefaults: { [key: string]: any } = {
        'heading': {
            content: { text: 'Neue Überschrift' },
            settings: { size: 'medium', align: 'left' }
        },
        'paragraph': {
            content: { text: 'Neuer Textabsatz mit Beispielinhalt. Doppelklicken zum Bearbeiten.' },
            settings: { align: 'left' }
        },
        'text': {
            content: { text: 'Einfacher Text...' },
            settings: { align: 'left', color: '#333333' }
        },
        'image': {
            content: { url: 'https://placehold.co/800x450', alt: 'Bildbeschreibung' },
            settings: {
                size: 'medium',
                width: '100%',
                height: 'auto',
                borderRadius: '0',
                shadow: 'none'
            }
        },
        'button': {
            content: { text: 'Button Text', link: '#' },
            settings: {
                style: 'primary',
                size: 'medium',
                target: '_self',
                icon: ''
            }
        }
    };

    // Definierte Optionen für Widget-Einstellungen
    readonly textAlignOptions = [
        { value: 'left', label: 'Links', icon: 'fa-align-left' },
        { value: 'center', label: 'Zentriert', icon: 'fa-align-center' },
        { value: 'right', label: 'Rechts', icon: 'fa-align-right' },
        { value: 'justify', label: 'Blocksatz', icon: 'fa-align-justify' }
    ];

    readonly headingSizeOptions = [
        { value: 'h1', label: 'Sehr groß (H1)', size: '2.5rem' },
        { value: 'h2', label: 'Groß (H2)', size: '2rem' },
        { value: 'h3', label: 'Mittel (H3)', size: '1.75rem' },
        { value: 'h4', label: 'Klein (H4)', size: '1.5rem' },
        { value: 'h5', label: 'Sehr klein (H5)', size: '1.25rem' },
        { value: 'h6', label: 'Winzig (H6)', size: '1rem' }
    ];

    readonly buttonStyleOptions = [
        { value: 'primary', label: 'Primär' },
        { value: 'secondary', label: 'Sekundär' },
        { value: 'outline-primary', label: 'Primär Outline' },
        { value: 'outline-secondary', label: 'Sekundär Outline' },
        { value: 'link', label: 'Link-Stil' }
    ];

    readonly buttonSizeOptions = [
        { value: 'small', label: 'Klein' },
        { value: 'medium', label: 'Mittel' },
        { value: 'large', label: 'Groß' }
    ];

    readonly buttonTargetOptions = [
        { value: '_self', label: 'Gleiches Fenster' },
        { value: '_blank', label: 'Neues Fenster' }
    ];

    readonly imageSizeOptions = [
        { value: 'small', label: 'Klein', width: '300px' },
        { value: 'medium', label: 'Mittel', width: '500px' },
        { value: 'large', label: 'Groß', width: '800px' },
        { value: 'full', label: 'Volle Breite', width: '100%' }
    ];

    readonly shadowOptions = [
        { value: 'none', label: 'Keine' },
        { value: 'small', label: 'Klein' },
        { value: 'medium', label: 'Mittel' },
        { value: 'large', label: 'Groß' }
    ];

    private readonly destroy$ = new Subject<void>();

    constructor(private readonly editorService: EditorService) { }

    ngOnInit(): void {
        if (this.sectionIndex >= 0 && this.widgetIndex >= 0) {
            const widgetsArray = this.editorService.getWidgetsArray(this.sectionIndex);
            if (widgetsArray && widgetsArray.length > this.widgetIndex) {
                this.widgetForm = widgetsArray.at(this.widgetIndex) as FormGroup;
                this.widgetType = this.widgetForm.get('type')?.value;

                // Stellen Sie sicher, dass die Standardeinstellungen für den Widget-Typ angewendet werden
                this.ensureWidgetDefaults();
            }
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Stellt sicher, dass alle erforderlichen Felder im Widget-Formular vorhanden sind,
     * basierend auf den Standardwerten des Widget-Typs
     */
    private ensureWidgetDefaults(): void {
        if (!this.widgetForm || !this.widgetType) return;

        // Hole die Standardeinstellungen für diesen Widget-Typ
        const defaults = this.widgetDefaults[this.widgetType];
        if (!defaults) return;

        // Sicherstellen, dass content ein Objekt ist
        const content = this.widgetForm.get('content')?.value;
        if (content === null || content === undefined || typeof content !== 'object') {
            this.widgetForm.get('content')?.setValue(defaults.content || {});
        } else {
            // Fehlende Felder in content ergänzen
            if (defaults.content) {
                const updatedContent = { ...defaults.content, ...content };
                this.widgetForm.get('content')?.setValue(updatedContent);
            }
        }

        // Sicherstellen, dass settings ein FormGroup mit allen erforderlichen Feldern ist
        const settingsGroup = this.widgetForm.get('settings') as FormGroup;
        if (settingsGroup && defaults.settings) {
            const currentSettings = settingsGroup.value;
            const updatedSettings = { ...defaults.settings, ...currentSettings };
            settingsGroup.patchValue(updatedSettings);
        }
    }

    /**
     * Widget-Typ ändern
     */
    changeWidgetType(newType: string): void {
        if (!this.widgetForm) return;

        this.widgetForm.get('type')?.setValue(newType);
        this.widgetType = newType;

        // Neue Standard-Einstellungen anwenden
        if (this.widgetDefaults[newType]) {
            // Content zurücksetzen
            this.widgetForm.get('content')?.setValue(this.widgetDefaults[newType].content || {});

            // Settings aktualisieren, aber bestehende gemeinsame Einstellungen beibehalten
            const settingsGroup = this.widgetForm.get('settings') as FormGroup;
            if (settingsGroup && this.widgetDefaults[newType].settings) {
                settingsGroup.patchValue(this.widgetDefaults[newType].settings);
            }
        }
    }

    /**
     * Content-Wert aktualisieren (für einfache key-value Einstellungen)
     */
    updateContentValue(key: string, value: any): void {
        if (!this.widgetForm) return;

        const content = this.widgetForm.get('content')?.value || {};
        content[key] = value;
        this.widgetForm.get('content')?.setValue(content);
    }

    /**
     * Settings-Wert aktualisieren
     */
    updateSettingsValue(key: string, value: any): void {
        if (!this.widgetForm) return;

        const settingsGroup = this.widgetForm.get('settings') as FormGroup;
        if (settingsGroup) {
            settingsGroup.get(key)?.setValue(value);
        }
    }

    /**
     * Content-Wert aus dem Formular abrufen
     */
    getContentValue(key: string): any {
        if (!this.widgetForm) return null;

        const content = this.widgetForm.get('content')?.value || {};
        return content[key];
    }

    /**
     * Settings-Wert aus dem Formular abrufen
     */
    getSettingsValue(key: string): any {
        if (!this.widgetForm) return null;

        const settingsGroup = this.widgetForm.get('settings') as FormGroup;
        return settingsGroup ? settingsGroup.get(key)?.value : null;
    }
}
