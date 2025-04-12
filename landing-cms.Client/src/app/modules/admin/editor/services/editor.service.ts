import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { Page } from '../../../landing-page/models/page.model';
import { PageService } from '../../../landing-page/services/page.service';
import { keyframes } from '@angular/animations';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  // Formularmodell für den gesamten Editor
  private readonly editorForm: FormGroup;

  // Aktueller Status des Editors
  private currentPage: Page | null = null;
  private isDirty: boolean = false;
  private selectedSectionIndex: number = -1;
  private selectedWidgetData: { sectionIndex: number, widgetIndex: number } | null = null;

  // BehaviorSubjects für Zustandsänderungen
  private readonly pageSubject = new BehaviorSubject<Page | null>(null);
  private readonly isDirtySubject = new BehaviorSubject<boolean>(false);
  private readonly selectedSectionSubject = new BehaviorSubject<number>(-1);
  private readonly selectedWidgetSubject = new BehaviorSubject<{ sectionIndex: number, widgetIndex: number } | null>(null);
  private readonly widgetSelectionOpenForSectionSubject = new BehaviorSubject<number>(-1);
  private readonly notificationSubject = new BehaviorSubject<{ type: string, message: string } | null>(null);

  // Observable für die Vorschau
  // TODO replace with types
  private readonly previewModeSubject = new BehaviorSubject<'desktop' | 'tablet' | 'mobile'>('desktop');
  private readonly previewScaleSubject = new BehaviorSubject<number>(1);

  // Widget-Definitionen
  private readonly widgetGroups = [
    { id: 'basic', label: 'Basis', icon: 'fa-font' },
    { id: 'media', label: 'Medien', icon: 'fa-image' },
    { id: 'layout', label: 'Layout', icon: 'fa-th-large' },
    { id: 'advanced', label: 'Erweitert', icon: 'fa-code' }
  ];

  private readonly widgetTypes = [
    { value: 'heading', label: 'Überschrift', group: 'basic', icon: 'fa-header', description: 'Text als Überschrift formatieren' },
    { value: 'paragraph', label: 'Textabsatz', group: 'basic', icon: 'fa-paragraph', description: 'Absatztext mit Formatierung' },
    { value: 'text', label: 'Text', group: 'basic', icon: 'fa-font', description: 'Einfacher Text ohne Formatierung' },
    { value: 'button', label: 'Button', group: 'basic', icon: 'fa-square', description: 'Anklickbarer Button mit Link' },
    { value: 'image', label: 'Bild', group: 'media', icon: 'fa-image', description: 'Einzelnes Bild mit optionaler Beschriftung' },
    { value: 'gallery', label: 'Bildergalerie', group: 'media', icon: 'fa-image', description: 'Mehrere Bilder als Galerie anzeigen' },
    { value: 'video', label: 'Video', group: 'media', icon: 'fa-film', description: 'YouTube, Vimeo oder eigenes Video einbetten' },
    { value: 'divider', label: 'Trennlinie', group: 'layout', icon: 'fa-minus', description: 'Horizontale Linie zur Inhaltstrennung' },
    { value: 'spacer', label: 'Abstand', group: 'layout', icon: 'fa-arrows-v', description: 'Vertikaler Abstand zwischen Elementen' },
    { value: 'columns', label: 'Spalten', group: 'layout', icon: 'fa-columns', description: 'Mehrspaltiges Layout' },
    { value: 'card', label: 'Karte', group: 'layout', icon: 'fa-id-badge', description: 'Inhaltskarte mit Titel und Text' },
    { value: 'icon', label: 'Icon', group: 'media', icon: 'fa-info-circle', description: 'Icon mit optionalem Text' },
    { value: 'list', label: 'Liste', group: 'basic', icon: 'fa-list', description: 'Nummerierte oder unnummerierte Liste' },
    { value: 'quote', label: 'Zitat', group: 'basic', icon: 'fa-quote-right', description: 'Hervorgehobenes Zitat mit Quelle' },
    { value: 'html', label: 'HTML', group: 'advanced', icon: 'fa-code', description: 'Benutzerdefinierter HTML-Code' },
    { value: 'form', label: 'Formular', group: 'advanced', icon: 'fa-wpforms', description: 'Kontaktformular mit E-Mail-Versand' }
  ];

  // Sektion-Vorlagen
  private readonly sectionTemplates = [
    {
      id: 'header',
      name: 'Header',
      description: 'Eine Kopfzeile mit Logo und Navigation',
      settings: {
        fullWidth: false,
        background: '#ffffff',
        textColor: '#333333',
        padding: 'medium'
      },
      widgets: [
        {
          type: 'heading',
          content: { text: 'Willkommen auf unserer Webseite' },
          settings: { size: 'h1', align: 'left' }
        },
        {
          type: 'paragraph',
          content: { text: 'Diese Webseite wurde mit dem Landing-CMS erstellt.' },
          settings: { align: 'left' }
        },
        {
          type: 'button',
          content: { text: 'Mehr erfahren', link: '#' },
          settings: { style: 'primary', size: 'medium', target: '_self' }
        }
      ]
    },
    {
      id: 'text-image',
      name: 'Text mit Bild',
      description: 'Eine Sektion mit Text auf der linken und einem Bild auf der rechten Seite',
      settings: {
        fullWidth: false,
        background: '#f5f5f5',
        textColor: '#333333',
        padding: 'medium'
      },
      widgets: [
        {
          type: 'heading',
          content: { text: 'Über uns' },
          settings: { size: 'h2', align: 'left' }
        },
        {
          type: 'paragraph',
          content: { text: 'Hier steht ein ausführlicher Text über Ihr Unternehmen oder Angebot.' },
          settings: { align: 'left' }
        },
        {
          type: 'image',
          content: { url: 'https://placehold.co/600x400', alt: 'Beispielbild' },
          settings: {
            size: 'medium',
            shadow: 'small',
            borderRadius: '5px'
          }
        }
      ]
    },
    {
      id: 'cta',
      name: 'Call-to-Action',
      description: 'Eine auffällige Sektion mit Call-to-Action Button',
      settings: {
        fullWidth: true,
        background: '#007bff',
        textColor: '#ffffff',
        padding: 'large'
      },
      widgets: [
        {
          type: 'heading',
          content: { text: 'Bereit zum Starten?' },
          settings: { size: 'h2', align: 'center' }
        },
        {
          type: 'paragraph',
          content: { text: 'Nutzen Sie jetzt unser Angebot und profitieren Sie von allen Vorteilen.' },
          settings: { align: 'center' }
        },
        {
          type: 'button',
          content: { text: 'Jetzt anfragen', link: '#' },
          settings: { style: 'outline-primary', size: 'large', target: '_self' }
        }
      ]
    },
    {
      id: 'features',
      name: 'Features',
      description: 'Eine Sektion mit Funktionsmerkmalen in 3 Spalten',
      settings: {
        fullWidth: false,
        background: '#ffffff',
        textColor: '#333333',
        padding: 'large'
      },
      widgets: [
        {
          type: 'heading',
          content: { text: 'Unsere Features' },
          settings: { size: 'h2', align: 'center' }
        },
        {
          type: 'columns',
          content: {
            columns: [
              {
                widgets: [
                  {
                    type: 'icon',
                    content: { icon: 'fa-star' },
                    settings: { size: 'large', align: 'center', color: '#007bff' }
                  },
                  {
                    type: 'heading',
                    content: { text: 'Feature 1' },
                    settings: { size: 'h4', align: 'center' }
                  },
                  {
                    type: 'paragraph',
                    content: { text: 'Beschreibung des ersten Features.' },
                    settings: { align: 'center' }
                  }
                ]
              },
              {
                widgets: [
                  {
                    type: 'icon',
                    content: { icon: 'fa-heart' },
                    settings: { size: 'large', align: 'center', color: '#007bff' }
                  },
                  {
                    type: 'heading',
                    content: { text: 'Feature 2' },
                    settings: { size: 'h4', align: 'center' }
                  },
                  {
                    type: 'paragraph',
                    content: { text: 'Beschreibung des zweiten Features.' },
                    settings: { align: 'center' }
                  }
                ]
              },
              {
                widgets: [
                  {
                    type: 'icon',
                    content: { icon: 'fa-bolt' },
                    settings: { size: 'large', align: 'center', color: '#007bff' }
                  },
                  {
                    type: 'heading',
                    content: { text: 'Feature 3' },
                    settings: { size: 'h4', align: 'center' }
                  },
                  {
                    type: 'paragraph',
                    content: { text: 'Beschreibung des dritten Features.' },
                    settings: { align: 'center' }
                  }
                ]
              }
            ]
          },
          settings: { gutter: 'medium' }
        }
      ]
    },
    {
      id: 'empty',
      name: 'Leere Sektion',
      description: 'Eine leere Sektion ohne Widgets',
      settings: {
        fullWidth: false,
        background: '#ffffff',
        textColor: '#333333',
        padding: 'medium'
      },
      widgets: []
    }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly pageService: PageService
  ) {
    // Initialisiere das Editor-Formular
    this.editorForm = this.fb.group({
      pageId: ['', Validators.required],
      title: ['', Validators.required],
      slug: ['', Validators.required],
      metaDescription: [''],
      metaKeywords: [''],
      customCss: [''],
      customJs: [''],
      isPublished: [false],
      sections: this.fb.array([])
    });

    // Registriere Listener für Formular-Änderungen
    this.editorForm.valueChanges.subscribe(() => {
      this.isDirty = true;
      this.isDirtySubject.next(true);
      this.updatePageFromForm();
    });
  }

  /**
   * Lädt eine Seite über die ID und setzt sie im Editor
   */
  loadPageById(id: string): Observable<Page> {
    return this.pageService.getPageById(id).pipe(
      tap(page => {
        this.setPage(page);
      })
    );
  }

  /**
   * Lädt eine Seite über den Slug und setzt sie im Editor
   */
  loadPageBySlug(slug: string): Observable<Page> {
    return this.pageService.getPageBySlug(slug).pipe(
      tap(page => {
        this.setPage(page);
      })
    );
  }

  /**
   * Markiert die Seite als geändert
   */
  markPageDirty(): void {
    this.isDirty = true;
    this.isDirtySubject.next(true);
    this.updatePageFromForm();
  }

  /**
   * Setzt eine neue Seite im Editor
   */
  setPage(page: Page): void {
    this.currentPage = page;
    this.resetForm(page);
    this.isDirty = false;
    this.isDirtySubject.next(false);
    this.selectedSectionIndex = -1;
    this.selectedSectionSubject.next(-1);
    this.selectedWidgetData = null;
    this.selectedWidgetSubject.next(null);
    this.pageSubject.next(page);
  }

  /**
   * Setzt den Änderungsstatus der Seite auf "dirty" oder "clean"
   */  
  setDirty(isDirty: boolean): void {
    this.isDirty = isDirty;
    this.isDirtySubject.next(isDirty);
  }

  /**
   * Öffnet das Widget-Auswahlmenü für eine bestimmte Sektion
   */
  openWidgetSelectionFor(sectionIndex: number): void {
    this.widgetSelectionOpenForSectionSubject.next(sectionIndex);
  }

  /**
   * Schließt das Widget-Auswahlmenü
   */
  closeWidgetSelection(): void {
    this.widgetSelectionOpenForSectionSubject.next(-1);
  }

  /**
   * Zeigt eine Benachrichtigung an
   */
  showNotification(type: 'success' | 'error' | 'info' | 'warning', message: string, duration: number = 3000): void {
    this.notificationSubject.next({ type, message });

    // Automatisches Ausblenden nach der angegebenen Dauer
    setTimeout(() => {
      this.notificationSubject.next(null);
    }, duration);
  }

  /**
   * Observables für externe Komponenten
   */
  get page$(): Observable<Page | null> {
    return this.pageSubject.asObservable();
  }

  get isDirty$(): Observable<boolean> {
    return this.isDirtySubject.asObservable();
  }

  get selectedSection$(): Observable<number> {
    return this.selectedSectionSubject.asObservable();
  }

  get selectedWidget$(): Observable<{ sectionIndex: number, widgetIndex: number } | null> {
    return this.selectedWidgetSubject.asObservable();
  }

  get widgetSelectionOpenForSection$(): Observable<number> {
    return this.widgetSelectionOpenForSectionSubject.asObservable();
  }

  get notification$(): Observable<{ type: string, message: string } | null> {
    return this.notificationSubject.asObservable();
  }

  get previewMode$(): Observable<'desktop' | 'tablet' | 'mobile'> {
    return this.previewModeSubject.asObservable();
  }

  get previewScale$(): Observable<number> {
    return this.previewScaleSubject.asObservable();
  }

  /**
   * Gibt das Editor-Formular zurück
   */
  getForm(): FormGroup {
    return this.editorForm;
  }

  /**
   * Gibt das Formular für die Sektionen zurück
   */
  getSectionsArray(): FormArray {
    return this.editorForm.get('sections') as FormArray;
  }

  /**
   * Gibt die Widgets eines bestimmten Sektionsindex zurück
   */
  getWidgetsArray(sectionIndex: number): FormArray | null {
    const sectionsArray = this.getSectionsArray();
    if (sectionsArray.length <= sectionIndex) return null;

    const section = sectionsArray.at(sectionIndex) as FormGroup;
    return section.get('widgets') as FormArray;
  }

  /**
   * Gibt alle Widget-Gruppen zurück
   */
  getWidgetGroups(): any[] {
    return this.widgetGroups;
  }

  /**
   * Gibt alle Widget-Typen zurück
   */
  getWidgetTypes(): any[] {
    return this.widgetTypes;
  }

  /**
   * Gibt Widget-Typen einer bestimmten Gruppe zurück
   */
  getWidgetTypesByGroup(groupId: string): any[] {
    return this.widgetTypes.filter(type => type.group === groupId);
  }

  /**
   * Sucht einen Widget-Typ anhand seines Wertes
   */
  getWidgetTypeByValue(value: string): any {
    return this.widgetTypes.find(type => type.value === value) || null;
  }

  /**
   * Gibt den Label-Text für einen Widget-Typ zurück
   */
  getWidgetTypeLabel(value: string): string {
    const widgetType = this.getWidgetTypeByValue(value);
    return widgetType ? widgetType.label : value;
  }

  /**
   * Gibt alle Sektions-Vorlagen zurück
   */
  getSectionTemplates(): any[] {
    return this.sectionTemplates;
  }

  /**
   * Wählt eine Sektion aus
   */
  selectSection(index: number): void {
    this.selectedSectionIndex = index;
    this.selectedSectionSubject.next(index);

    // Wenn eine neue Sektion ausgewählt wird, zurücksetzen des ausgewählten Widgets
    this.selectedWidgetData = null;
    this.selectedWidgetSubject.next(null);
  }

  /**
   * Wählt ein Widget aus
   */
  selectWidget(indices: { sectionIndex: number, widgetIndex: number } | null): void {
    if (!indices) {
      this.selectedWidgetData = null;
      this.selectedWidgetSubject.next(null);
      return;
    }

    if (indices.sectionIndex !== this.selectedSectionIndex) {
      this.selectSection(indices.sectionIndex);
    }

    this.selectedWidgetData = indices;
    this.selectedWidgetSubject.next(indices);
  }

  /**
   * Setzt den Vorschaumodus
   */
  setPreviewMode(mode: 'desktop' | 'tablet' | 'mobile'): void {
    this.previewModeSubject.next(mode);
  }

  /**
   * Setzt die Vorschauskalierung
   */
  setZoom(scale: number): void {
    this.previewScaleSubject.next(scale);
  }

  /**
   * Fügt eine neue Sektion hinzu
   */
  addSection(template?: any): void {
    const sectionsArray = this.getSectionsArray();
    const newSection = this.createSectionFormGroup(template);
    sectionsArray.push(newSection);

    // Seite als geändert markieren
    this.markPageDirty();

    // Neue Sektion auswählen
    this.selectSection(sectionsArray.length - 1);

    // Erfolgsbenachrichtigung anzeigen
    this.showNotification('success', 'Neue Sektion wurde hinzugefügt');
  }

  /**
   * Löscht eine Sektion
   */
  deleteSection(index: number): void {
    const sectionsArray = this.getSectionsArray();
    if (index < 0 || index >= sectionsArray.length) return;

    sectionsArray.removeAt(index);

    // Seite als geändert markieren
    this.markPageDirty();

    // Wenn die aktuell ausgewählte Sektion gelöscht wurde, zurücksetzen
    if (this.selectedSectionIndex === index) {
      this.selectSection(-1);
    } else if (this.selectedSectionIndex > index) {
      // Sektion-Auswahl anpassen, wenn eine Sektion vor der ausgewählten gelöscht wurde
      this.selectSection(this.selectedSectionIndex - 1);
    }

    // Erfolgsbenachrichtigung anzeigen
    this.showNotification('success', 'Sektion wurde gelöscht');
  }

  /**
   * Verschiebt eine Sektion nach oben oder unten
   */
  moveSection(index: number, direction: 'up' | 'down'): void {
    const sectionsArray = this.getSectionsArray();
    if (index < 0 || index >= sectionsArray.length) return;

    let newIndex: number;
    if (direction === 'up' && index > 0) {
      newIndex = index - 1;
    } else if (direction === 'down' && index < sectionsArray.length - 1) {
      newIndex = index + 1;
    } else {
      return;
    }

    // Sektionen tauschen
    const currentSection = sectionsArray.at(index);
    const targetSection = sectionsArray.at(newIndex);

    sectionsArray.setControl(index, targetSection);
    sectionsArray.setControl(newIndex, currentSection);

    // Seite als geändert markieren
    this.markPageDirty();

    // Ausgewählte Sektion aktualisieren
    this.selectSection(newIndex);
  }

  /**
   * Fügt ein Widget zu einer Sektion hinzu
   */
  addWidget(sectionIndex: number, widgetType: string): void {
    const widgetsArray = this.getWidgetsArray(sectionIndex);
    if (!widgetsArray) return;

    const newWidget = this.createWidgetFormGroup(widgetType);
    widgetsArray.push(newWidget);

    // Seite als geändert markieren
    this.markPageDirty();

    // Neues Widget auswählen
    this.selectWidget({
      sectionIndex: sectionIndex,
      widgetIndex: widgetsArray.length - 1
    });

    // Erfolgsbenachrichtigung anzeigen
    const widgetTypeLabel = this.getWidgetTypeLabel(widgetType);
    this.showNotification('success', `Widget "${widgetTypeLabel}" wurde hinzugefügt`);
  }

  /**
   * Löscht ein Widget aus einer Sektion
   */
  deleteWidget(sectionIndex: number, widgetIndex: number): void {
    const widgetsArray = this.getWidgetsArray(sectionIndex);
    if (!widgetsArray || widgetIndex < 0 || widgetIndex >= widgetsArray.length) return;

    // Widget-Typ für die Benachrichtigung speichern
    const widgetType = (widgetsArray.at(widgetIndex) as FormGroup).get('type')?.value;
    const widgetTypeLabel = this.getWidgetTypeLabel(widgetType);

    widgetsArray.removeAt(widgetIndex);

    // Seite als geändert markieren
    this.markPageDirty();

    // Wenn das aktuell ausgewählte Widget gelöscht wurde, zurücksetzen
    if (this.selectedWidgetData &&
      this.selectedWidgetData.sectionIndex === sectionIndex &&
      this.selectedWidgetData.widgetIndex === widgetIndex) {
      this.selectWidget(null);
    } else if (this.selectedWidgetData &&
      this.selectedWidgetData.sectionIndex === sectionIndex &&
      this.selectedWidgetData.widgetIndex > widgetIndex) {
      // Widget-Auswahl anpassen, wenn ein Widget vor dem ausgewählten gelöscht wurde
      this.selectWidget({
        sectionIndex: sectionIndex,
        widgetIndex: this.selectedWidgetData.widgetIndex - 1
      });
    }

    // Erfolgsbenachrichtigung anzeigen
    this.showNotification('success', `Widget "${widgetTypeLabel}" wurde gelöscht`);
  }

  /**
   * Verschiebt ein Widget innerhalb einer Sektion
   */
  moveWidget(sectionIndex: number, oldIndex: number, newIndex: number): void {
    const widgetsArray = this.getWidgetsArray(sectionIndex);
    if (!widgetsArray || oldIndex < 0 || oldIndex >= widgetsArray.length ||
      newIndex < 0 || newIndex >= widgetsArray.length) return;

    const widget = widgetsArray.at(oldIndex);
    widgetsArray.removeAt(oldIndex);
    widgetsArray.insert(newIndex, widget);

    // Seite als geändert markieren
    this.markPageDirty();

    // Ausgewähltes Widget aktualisieren
    if (this.selectedWidgetData &&
      this.selectedWidgetData.sectionIndex === sectionIndex &&
      this.selectedWidgetData.widgetIndex === oldIndex) {
      this.selectWidget({
        sectionIndex: sectionIndex,
        widgetIndex: newIndex
      });
    }
  }

  /**
   * Erstellt ein FormGroup für eine Sektion
   */
  public createSectionFormGroup(template?: any): FormGroup {
    // Wenn eine Vorlage angegeben wurde, diese verwenden, sonst eine leere Sektion
    const section = template || {
      id: this.generateSectionId(),
      title: 'Neue Sektion',
      type: 'content',
      settings: {
        fullWidth: false,
        background: '#ffffff',
        textColor: '#333333',
        padding: 'medium'
      },
      widgets: []
    };

    // Ensure settings object exists with default values
    if (!section.settings) {
      section.settings = {
        fullWidth: false,
        background: '#ffffff',
        textColor: '#333333',
        padding: 'medium'
      };
    }

    const widgetsArray = this.fb.array([] as AbstractControl[]);

    // Widgets hinzufügen, wenn vorhanden
    if (section.widgets && section.widgets.length > 0) {
      section.widgets.forEach((widget: any) => {
        widgetsArray.push(this.createWidgetFormGroup(widget.type, widget));
      });
    }

    return this.fb.group({
      id: [section.id || this.generateSectionId(), Validators.required],
      title: [section.title || 'Neue Sektion', Validators.required],
      type: [section.type || 'content', Validators.required],
      settings: this.fb.group({
        name: [section.settings.name || 'Neue Sektion'],
        fullWidth: [section.settings.fullWidth !== undefined ? section.settings.fullWidth : false],
        background: [section.settings.background || '#ffffff'],
        textColor: [section.settings.textColor || '#333333'],
        padding: [section.settings.padding || 'medium']
      }),
      widgets: widgetsArray
    });
  }

  /**
   * Erstellt ein FormGroup für ein Widget
   */
  public createWidgetFormGroup(type: string, widgetData?: any): FormGroup {
    // Standard-Widget oder vorgegebenes Widget verwenden
    const widget = widgetData || {
      type: type,
      content: {},
      settings: {}
    };

    // Tiefe Kopie der Einstellungen erstellen (oder leeres Objekt, falls settings nicht existiert)
    const settings = { ...widget.settings };

    // Widget-spezifische Standardeinstellungen
    const defaultSettings: any = {
      cssClass: '',
      margin: 'normal',
      name: '',
      align: 'left'
    };

    // Spezifische Standardwerte je nach Widget-Typ
    switch (type) {
      case 'heading':
        defaultSettings.size = 'h2';
        break;
      case 'image':
        defaultSettings.size = 'medium';
        defaultSettings.shadow = 'none';
        defaultSettings.borderRadius = '0';
        break;
      case 'button':
        defaultSettings.style = 'primary';
        defaultSettings.size = 'medium';
        defaultSettings.align = 'center';
        break;
      case 'spacer':
        defaultSettings.size = 'medium';
        break;
    }

    // Standardwerte mit vorhandenen Einstellungen überschreiben
    const mergedSettings = { ...defaultSettings, ...settings };

    return this.fb.group({
      id: [widget.id || this.generateWidgetId(), Validators.required],
      type: [type, Validators.required],
      content: this.fb.group({
        ...this.getDefaultContentByType(type, widget.content || {})
      }),
      settings: this.fb.group(mergedSettings)
    });
  }

  /**
   * Gibt Standardwerte für den Content-Bereich eines Widgets zurück
   */
  private getDefaultContentByType(type: string, existingContent: any = {}): any {
    const defaults: any = {};

    switch (type) {
      case 'heading':
        defaults.text = existingContent.text || 'Neue Überschrift';
        break;
      case 'paragraph':
        defaults.text = existingContent.text || 'Hier steht Ihr Text. Klicken Sie zum Bearbeiten.';
        break;
      case 'text':
        defaults.text = existingContent.text || 'Textinhalt';
        break;
      case 'button':
        defaults.text = existingContent.text || 'Button-Text';
        defaults.link = existingContent.link || '#';
        break;
      case 'image':
        defaults.url = existingContent.url || '';
        defaults.alt = existingContent.alt || '';
        defaults.caption = existingContent.caption || '';
        break;
      case 'video':
        defaults.url = existingContent.url || '';
        defaults.autoplay = existingContent.autoplay || false;
        break;
      case 'list':
        defaults.items = existingContent.items || ['Erster Eintrag', 'Zweiter Eintrag', 'Dritter Eintrag'];
        defaults.type = existingContent.type || 'unordered';
        break;
      case 'quote':
        defaults.text = existingContent.text || 'Dies ist ein Zitat.';
        defaults.author = existingContent.author || 'Autor des Zitats';
        break;
    }

    return defaults;
  }

  /**
   * Generiert eine eindeutige ID für eine Sektion
   */
  private generateSectionId(): string {
    return 'section_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
  }

  /**
   * Generiert eine eindeutige ID für ein Widget
   */
  private generateWidgetId(): string {
    return 'widget_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
  }

  /**
   * Setzt das Formular auf den Seitenzustand zurück
   */
  private resetForm(page: Page): void {
    // Formularwerte zurücksetzen
    this.editorForm.patchValue({
      pageId: page.id ?? '',
      title: page.title ?? '',
      slug: page.slug ?? '',
      metaDescription: page.seo?.metaDescription ?? '',
      metaKeywords: page.seo?.keywords ?? '',
      isPublished: page.isPublished || false
    });

    // Sektionen zurücksetzen
    const sectionsArray = this.getSectionsArray();
    sectionsArray.clear();

    if (page.sections && page.sections.length > 0) {
      page.sections.forEach(section => {
        const sectionForm = this.createSectionFormGroup(section);
        sectionsArray.push(sectionForm);
      });
    }
  }

  /**
   * Aktualisiert das Page-Objekt aus dem Formular
   */
  private updatePageFromForm(): void {
    if (!this.currentPage) return;

    const formValue = this.editorForm.value;

    // Haupteigenschaften aktualisieren
    this.currentPage.title = formValue.title;
    this.currentPage.slug = formValue.slug;

    // SEO-Informationen aktualisieren
    if (!this.currentPage.seo) {
      this.currentPage.seo = {};
    }
    this.currentPage.seo.metaDescription = formValue.metaDescription;
    this.currentPage.seo.keywords = formValue.metaKeywords;

    // Benutzerdefinierter Code

    this.currentPage.isPublished = formValue.isPublished;

    // Sektionen aktualisieren
    this.currentPage.sections = formValue.sections;

    // Aktualisierte Seite emittieren
    this.pageSubject.next(this.currentPage);
  }

  /**
   * Speichert die aktuelle Seite
   */
  savePage(): Observable<Page> {
    if (!this.currentPage) {
      throw new Error('Keine aktive Seite zum Speichern');
    }

    // Formularwerte in die Seite übernehmen
    const formValue = this.editorForm.value;
    const updatedPage: Page = {
      ...this.currentPage,
      title: formValue.title,
      slug: formValue.slug,
      seo: {
        metaDescription: formValue.metaDescription,
        keywords: formValue.metaKeywords
      },
      isPublished: formValue.isPublished,
      lastModifiedDate: new Date().toISOString(),
      sections: this.transformSectionsFormToModel(formValue.sections)
    };

    // Seite über den PageService speichern
    let saveOperation: Observable<Page>;
    if (updatedPage.id) {
      saveOperation = this.pageService.updatePage(updatedPage.id, updatedPage);
    } else {
      saveOperation = this.pageService.createPage(updatedPage);
    }

    return saveOperation.pipe(
      tap(savedPage => {
        this.currentPage = savedPage;
        this.isDirty = false;
        this.isDirtySubject.next(false);
        this.pageSubject.next(savedPage);

        // Erfolgsbenachrichtigung anzeigen
        this.showNotification('success', 'Seite wurde erfolgreich gespeichert');
      })
    );
  }

  /**
   * Veröffentlicht die aktuelle Seite
   */
  publishPage(): Observable<Page> {
    if (!this.currentPage) {
      throw new Error('Keine aktive Seite zum Veröffentlichen');
    }

    // Formularwerte in die Seite übernehmen wie beim Speichern
    const formValue = this.editorForm.value;
    const updatedPage: Page = {
      ...this.currentPage,
      title: formValue.title,
      slug: formValue.slug,
      seo: {
        metaDescription: formValue.metaDescription,
        keywords: formValue.metaKeywords
      },
      isPublished: true, // Immer auf true setzen beim Veröffentlichen
      lastModifiedDate: new Date().toISOString(),
      createdDate: new Date().toISOString(), // Veröffentlichungsdatum setzen
      sections: this.transformSectionsFormToModel(formValue.sections)
    };

    // Seite über den PageService speichern und veröffentlichen
    let publishOperation: Observable<Page>;
    if (updatedPage.id) {
      publishOperation = this.pageService.updatePage(updatedPage.id, updatedPage);
    } else {
      publishOperation = this.pageService.createPage(updatedPage);
    }

    return publishOperation.pipe(
      tap(savedPage => {
        this.currentPage = savedPage;
        this.isDirty = false;
        this.isDirtySubject.next(false);
        this.pageSubject.next(savedPage);

        // Erfolgsbenachrichtigung anzeigen
        this.showNotification('success', 'Seite wurde erfolgreich veröffentlicht');
      })
    );
  }

  /**
   * Erstellt eine Vorschau der aktuellen Seite in einem neuen Tab
   */
  previewPage(): void {
    if (!this.currentPage) {
      this.showNotification('error', 'Keine Seite zum Anzeigen vorhanden');
      return;
    }

    // In der echten Anwendung würde hier ein temporärer Link generiert
    // Für diese Demo öffnen wir einfach die Seite in einem neuen Tab
    const previewUrl = `/preview/${this.currentPage.slug}`;
    window.open(previewUrl, '_blank');
  }

  /**
   * Transformiert die Formulardaten der Sektionen in das Modell-Format
   */
  private transformSectionsFormToModel(sectionsForms: any[]): any[] {
    if (!sectionsForms) return [];

    return sectionsForms.map((section, index) => ({
      ...section,
      order: index + 1,
      widgets: this.transformWidgetsFormToModel(section.widgets)
    }));
  }

  /**
   * Transformiert die Formulardaten der Widgets in das Modell-Format
   */
  private transformWidgetsFormToModel(widgetsForms: any[]): any[] {
    if (!widgetsForms) return [];

    return widgetsForms.map((widget, index) => ({
      ...widget,
      order: index + 1
    }));
  }

  /**
   * Überprüft, ob ein Drag-and-Drop-Vorgang erlaubt ist
   */
  dropListEnterPredicate(item: CdkDrag<any>, list: CdkDropList<any>): boolean {
    // Get the data being dragged
    const dragData = item.data;
    const dropListId = list.id;

    // Check if we're dropping a widget into a section's widget list
    if (dragData.type === 'widget' && dropListId.includes('widget-list')) {
      // Check for widget compatibility with the section
      const sectionId = dropListId.replace('widget-list-', '');
      const section = this.currentPage?.sections?.find(s => s.id === sectionId);

      if (!section) {
        this.showNotification('error', 'Cannot identify target section');
        return false;
      }

      // Check if the widget is compatible with this section type
      if (section.settings?.allowedWidgetTypes && section.settings.allowedWidgetTypes.length > 0) {
        if (!section.settings.allowedWidgetTypes.includes(dragData.widgetType)) {
          this.showNotification('warning', `Widget type "${dragData.widgetType}" is not compatible with this section`, 1500);
          return false;
        }
      }

      // All checks passed
      this.showNotification('info', `Widget can be placed in this section`, 1500);
      return true;
    }

    // Check if we're dropping a section into the page
    if (dragData.type === 'section') {
      // No limit check for sections as maxSections doesn't exist in the Page interface
      this.showNotification('info', `Section can be placed on this page`,  1500);
      return true;
    }

    return true;
  }
}
