import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Alertadetalle } from './alertadetalle';

describe('Alertadetalle', () => {
  let component: Alertadetalle;
  let fixture: ComponentFixture<Alertadetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Alertadetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Alertadetalle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
