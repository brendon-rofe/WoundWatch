import { Component, OnInit } from '@angular/core';
import { IonContent, IonToggle } from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonContent, IonToggle, RouterLink],
})
export class HomePage implements OnInit {
  isDark = false;

  constructor() {}

  ngOnInit(): void {
    const stored = localStorage.getItem('ww-theme');
    if (stored === 'dark') {
      this.setDark(true, true);
      return;
    }
    if (stored === 'light') {
      this.setDark(false, true);
      return;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setDark(prefersDark, false);
  }

  onThemeToggle(checked: boolean): void {
    this.setDark(checked, true);
  }

  private setDark(isDark: boolean, persist: boolean): void {
    this.isDark = isDark;
    document.documentElement.classList.toggle('ion-palette-dark', isDark);
    if (persist) {
      localStorage.setItem('ww-theme', isDark ? 'dark' : 'light');
    }
  }

  
}
