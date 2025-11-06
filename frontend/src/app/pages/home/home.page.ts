import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CameraService } from '../../services/camera.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonContent, RouterLink],
})
export class HomePage {
  constructor(private camera: CameraService) {}

  async onUpload() {
    const { photo, cancelled } = await this.camera.capture()

    if (cancelled) {
      console.log('User cancelled camera');
      return;
    }

    console.log('Captured webPath:', photo?.webPath);
    // TODO: navigate to confirm/save screen, or pass `photo` to a storage service
  }
}
