import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsicHealthComponent } from './asic-health.component';

describe('AsicHealthComponent', () => {
  let component: AsicHealthComponent;
  let fixture: ComponentFixture<AsicHealthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AsicHealthComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsicHealthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
