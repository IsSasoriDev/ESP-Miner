import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface ThemeSettings {
  colorScheme: string;
  theme?: string;
  accentColors?: {
    [key: string]: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly mockSettings: ThemeSettings = {
    colorScheme: 'dark',
    theme: 'vela',
    accentColors: {
      '--primary-color': '#6366f1',
      '--primary-color-text': '#ffffff',
      '--highlight-bg': '#6366f1',
      '--highlight-text-color': '#ffffff',
      '--focus-ring': '0 0 0 0.2rem rgba(99,102,241,0.2)',
      // PrimeNG Slider
      '--slider-bg': '#334155',
      '--slider-range-bg': '#6366f1',
      '--slider-handle-bg': '#6366f1',
      // Progress Bar
      '--progressbar-bg': '#334155',
      '--progressbar-value-bg': '#6366f1',
      // PrimeNG Checkbox
      '--checkbox-border': '#6366f1',
      '--checkbox-bg': '#6366f1',
      '--checkbox-hover-bg': '#818cf8',
      // PrimeNG Button
      '--button-bg': '#6366f1',
      '--button-hover-bg': '#4f46e5',
      '--button-focus-shadow': '0 0 0 2px #ffffff, 0 0 0 4px #6366f1',
      // Toggle button
      '--togglebutton-bg': '#6366f1',
      '--togglebutton-border': '1px solid #6366f1',
      '--togglebutton-hover-bg': '#4f46e5',
      '--togglebutton-hover-border': '1px solid #4f46e5',
      '--togglebutton-text-color': '#ffffff'
    }
  };

  private themeSettingsSubject = new BehaviorSubject<ThemeSettings>(this.mockSettings);
  private themeSettings$ = this.themeSettingsSubject.asObservable();

  constructor(private http: HttpClient) {
    if (environment.production) {
      this.http.get<ThemeSettings>('/api/theme').pipe(
        catchError(() => of(this.mockSettings)),
        tap(settings => this.themeSettingsSubject.next(settings))
      ).subscribe();
    }
  }

  getThemeSettings(): Observable<ThemeSettings> {
    return this.themeSettings$;
  }

  saveThemeSettings(settings: ThemeSettings): Observable<void> {
    if (environment.production) {
      return this.http.post<void>('/api/theme', settings).pipe(
        tap(() => this.themeSettingsSubject.next(settings))
      );
    } else {
      this.themeSettingsSubject.next(settings);
      return of(void 0);
    }
  }
}
