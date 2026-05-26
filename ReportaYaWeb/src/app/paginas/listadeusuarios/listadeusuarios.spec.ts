import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Listadeusuarios } from './listadeusuarios';

describe('Listadeusuarios', () => {
  let component: Listadeusuarios;
  let fixture: ComponentFixture<Listadeusuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Listadeusuarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Listadeusuarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
