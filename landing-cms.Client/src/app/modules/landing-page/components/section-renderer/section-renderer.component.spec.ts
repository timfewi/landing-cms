import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionRendererComponent } from './section-renderer.component';

describe('SectionRendererComponent', () => {
  let component: SectionRendererComponent;
  let fixture: ComponentFixture<SectionRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SectionRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectionRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
