import { Component, OnInit } from '@angular/core';
import { IonContent, IonToggle } from '@ionic/angular/standalone';
import { ViewWillEnter } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { RouterLink } from '@angular/router';
import { CameraService } from '../../services/camera.service';
import { ImageReminderPopupComponent } from '../../components/image-reminder-popup/image-reminder-popup.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonContent, IonToggle, RouterLink, ImageReminderPopupComponent],
})
export class HomePage implements OnInit, ViewWillEnter {
  isDark = false;
  showReminder = false;

  constructor(private cameraService: CameraService) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('ww-theme');
    if (stored === 'dark') {
      this.setDark(true, true);
    } else if (stored === 'light') {
      this.setDark(false, true);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setDark(prefersDark, false);
    }

    // Check if reminder should be shown
    this.checkAndShowReminder();
  }

  ionViewWillEnter(): void {
    // Re-check reminder when returning to this page (e.g., after taking a photo)
    this.checkAndShowReminder();
  }

  private checkAndShowReminder(): void {
    // Check if user has already dismissed the reminder today
    const dismissedToday = this.wasReminderDismissedToday();
    
    // Check if photo was taken today
    const hasPhotoToday = this.cameraService.hasPhotoToday();
    
    console.log('Reminder check:', { hasPhotoToday, dismissedToday });
    
    // Hide reminder if photo was taken today
    if (hasPhotoToday) {
      this.showReminder = false;
      return;
    }
    
    // Show reminder if no photo today and not dismissed today
    if (!dismissedToday) {
      // Small delay to ensure smooth page load (only on initial load)
      if (!this.showReminder) {
        setTimeout(() => {
          this.showReminder = true;
          console.log('Showing reminder, showReminder:', this.showReminder);
        }, 500);
      }
    } else {
      this.showReminder = false;
    }
  }

  private wasReminderDismissedToday(): boolean {
    const dismissedDate = localStorage.getItem('ww-reminder-dismissed');
    if (!dismissedDate) return false;

    const dismissed = new Date(dismissedDate);
    const today = new Date();
    
    return (
      dismissed.getFullYear() === today.getFullYear() &&
      dismissed.getMonth() === today.getMonth() &&
      dismissed.getDate() === today.getDate()
    );
  }

  onReminderDismissed(): void {
    this.showReminder = false;
    // Mark reminder as dismissed for today
    localStorage.setItem('ww-reminder-dismissed', new Date().toISOString());
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
