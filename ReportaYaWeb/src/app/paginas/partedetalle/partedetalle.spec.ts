import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Partedetalle } from './partedetalle';

describe('Partedetalle', () => {
  let component: Partedetalle;
  let fixture: ComponentFixture<Partedetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Partedetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Partedetalle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
