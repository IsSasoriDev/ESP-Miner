import { Component, OnInit } from '@angular/core';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    // Apply default theme on app startup
    this.themeService.getThemeSettings().subscribe({
      next: (settings) => {
        const theme = settings?.theme || 'bitaxe';
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
      },
      error: () => {
        // Default to bitaxe theme
        document.body.classList.add('theme-bitaxe');
      }
    });
  }
}
