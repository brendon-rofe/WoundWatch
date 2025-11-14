import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, close } from 'ionicons/icons';

@Component({
  selector: 'app-image-reminder-popup',
  templateUrl: './image-reminder-popup.component.html',
  styleUrls: ['./image-reminder-popup.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
})
export class ImageReminderPopupComponent {
  @Output() dismiss = new EventEmitter<void>();

  constructor(private router: Router) {
    addIcons({ camera, close });
  }

  navigateToCamera(): void {
    this.dismiss.emit();
    this.router.navigateByUrl('/capture');
  }

  onDismiss(): void {
    this.dismiss.emit();
  }
}

