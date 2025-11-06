import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonContent],
})
export class HomePage {
  constructor() {}

  async onUpload() {
    try {
      const photo = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri,
        quality: 100,
      });
      console.log('Captured:', photo?.webPath);
      // TODO: navigate to a confirm/save screen
    } catch (e) {
      console.warn('Camera cancelled or failed', e);
    }
  }
}
