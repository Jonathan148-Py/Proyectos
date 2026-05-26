import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Camarassolicitadas } from './camarassolicitadas';

describe('Camarassolicitadas', () => {
  let component: Camarassolicitadas;
  let fixture: ComponentFixture<Camarassolicitadas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Camarassolicitadas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Camarassolicitadas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
