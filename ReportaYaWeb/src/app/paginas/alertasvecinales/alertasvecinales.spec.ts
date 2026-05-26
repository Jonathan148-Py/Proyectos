import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Alertasvecinales } from './alertasvecinales';

describe('Alertasvecinales', () => {
  let component: Alertasvecinales;
  let fixture: ComponentFixture<Alertasvecinales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Alertasvecinales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Alertasvecinales);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
