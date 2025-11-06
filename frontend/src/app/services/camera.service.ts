import { Injectable } from '@angular/core';
import {
  Camera,
  CameraDirection,
  CameraResultType,
  CameraSource,
  GalleryImageOptions,
  ImageOptions,
  PermissionStatus,
  Photo,
} from '@capacitor/camera';

export type CaptureResult = {
  photo: Photo | null;
  cancelled: boolean;
};

@Injectable({ providedIn: 'root' })
export class CameraService {
  /** Ensure camera permissions are granted (Android/Huawei friendly). */
  async ensurePermissions(): Promise<PermissionStatus> {
    const status = await Camera.checkPermissions();
    if (status.camera !== 'granted') {
      return Camera.requestPermissions();
    }
    return status;
  }

  /** Take a photo with sane defaults. */
  async capture(): Promise<CaptureResult> {
    try {
      await this.ensurePermissions();

      const photo = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.DataUrl, // best for native save/preview; switch to Base64 if you must inline
        quality: 100,
        direction: CameraDirection.Rear,
        saveToGallery: false,
      });

      return { photo, cancelled: false };
    } catch (e: any) {
      // Capacitor throws when user cancels; normalize to a single shape
      if (this.isUserCancel(e)) return { photo: null, cancelled: true };
      console.warn('[CameraService] capture error:', e);
      throw e;
    }
  }

  /** (Optional) Pick from gallery instead of camera. */
  async pickFromGallery(options?: Partial<GalleryImageOptions>): Promise<CaptureResult> {
    try {
      await this.ensurePermissions();

      const photo = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.Uri,
        quality: 100,
        ...options,
      });

      return { photo, cancelled: false };
    } catch (e: any) {
      if (this.isUserCancel(e)) return { photo: null, cancelled: true };
      console.warn('[CameraService] pickFromGallery error:', e);
      throw e;
    }
  }

  /** Helper: determine if error is a user-initiated cancel */
  private isUserCancel(err: any): boolean {
    const msg = String(err?.message ?? err ?? '').toLowerCase();
    return msg.includes('cancel') || msg.includes('user cancelled') || msg.includes('no image selected');
  }
}
