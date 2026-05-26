import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Crearusuario } from './crearusuario';

describe('Crearusuario', () => {
  let component: Crearusuario;
  let fixture: ComponentFixture<Crearusuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Crearusuario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Crearusuario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
