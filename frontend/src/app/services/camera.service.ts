import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import {
  CameraPreview,
  CameraPreviewOptions,
} from '@capacitor-community/camera-preview';

export interface PhotoEntry {
  uri: string;
  path: string;
  ts: number;
}

@Injectable({
  providedIn: 'root',
})
export class CameraService {
  private webStream?: MediaStream;
  private previewBoxId = 'previewBox';

  get isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
  }

  async startWebcam(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.stopWebcam();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      this.webStream = stream;
      videoElement.srcObject = stream;
      await videoElement.play();
    } catch (e) {
      console.warn('Webcam start failed:', e);
      throw e;
    }
  }

  stopWebcam(): void {
    this.webStream?.getTracks().forEach((t) => t.stop());
    this.webStream = undefined;
  }

  async startNativePreview(restart = false): Promise<void> {
    try {
      if (restart) await this.stopNativePreview();

      const box = document.getElementById(this.previewBoxId);
      if (!box) {
        console.warn('Preview box not found');
        return;
      }

      const rect = box.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const opts: CameraPreviewOptions = {
        position: 'rear',
        x: Math.round(rect.left * dpr),
        y: Math.round(rect.top * dpr),
        width: Math.round(rect.width * dpr),
        height: Math.round(rect.height * dpr),
        toBack: false,
        disableAudio: true,
        enableHighResolution: true,
        storeToFile: false,
      };
      await CameraPreview.start(opts);
    } catch (e) {
      console.warn('Native preview start failed:', e);
      throw e;
    }
  }

  async stopNativePreview(): Promise<void> {
    try {
      await CameraPreview.stop();
    } catch (e) {
      console.warn('Native preview stop failed:', e);
    }
  }

  async captureFromWebcam(videoElement: HTMLVideoElement): Promise<string> {
    if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
      throw new Error('Video not ready');
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.95);
  }

  async captureFromNative(): Promise<string> {
    try {
      const pic = await CameraPreview.capture({ quality: 95 });
      return 'data:image/jpeg;base64,' + pic.value;
    } catch (e) {
      console.warn('Native capture failed:', e);
      throw e;
    }
  }

  async savePhoto(dataUrl: string): Promise<PhotoEntry> {
    const base64 = dataUrl.split(',')[1];
    const ts = Date.now();
    const fileName = `photos/photo_${ts}.jpg`;

    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Data,
      recursive: true,
    });

    const entry: PhotoEntry = { uri, path: fileName, ts };
    const raw = localStorage.getItem('saved_photos') ?? '[]';
    const list = JSON.parse(raw) as PhotoEntry[];
    list.unshift(entry);
    
    // Keep only the 5 most recent images
    const MAX_IMAGES = 5;
    const trimmedList = list.slice(0, MAX_IMAGES);
    
    // Delete old images from filesystem if they exceed the limit
    if (list.length > MAX_IMAGES) {
      const imagesToDelete = list.slice(MAX_IMAGES);
      for (const oldEntry of imagesToDelete) {
        try {
          await Filesystem.deleteFile({
            path: oldEntry.path,
            directory: Directory.Data,
          });
        } catch (e) {
          console.warn(`Failed to delete old image ${oldEntry.path}:`, e);
        }
      }
    }
    
    localStorage.setItem('saved_photos', JSON.stringify(trimmedList));
    return entry;
  }

  saveNote(photoPath: string, note: string): void {
    if (!photoPath || !note) return;
    const key = `note_${photoPath}`;
    localStorage.setItem(key, note);
  }

  saveWoundType(photoPath: string, woundType: string): void {
    if (!photoPath || !woundType) return;
    const key = `wound_type_${photoPath}`;
    localStorage.setItem(key, woundType);
  }

  getWoundType(photoPath: string): string | null {
    if (!photoPath) return null;
    const key = `wound_type_${photoPath}`;
    return localStorage.getItem(key);
  }

  getNote(photoPath: string): string | null {
    if (!photoPath) return null;
    const key = `note_${photoPath}`;
    return localStorage.getItem(key);
  }

  hasPhotoToday(): boolean {
    const raw = localStorage.getItem('saved_photos');
    if (!raw) return false;

    try {
      const list = JSON.parse(raw) as PhotoEntry[];
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      return list.some((entry) => {
        const date = new Date(entry.ts);
        return date >= startOfToday && date <= endOfToday;
      });
    } catch {
      return false;
    }
  }

  getSavedPhotos(): PhotoEntry[] {
    const raw = localStorage.getItem('saved_photos');
    if (!raw) return [];

    try {
      return JSON.parse(raw) as PhotoEntry[];
    } catch {
      return [];
    }
  }

  setupReflowHandler(callback: () => void): () => void {
    window.addEventListener('resize', callback);
    window.addEventListener('orientationchange', callback);

    return () => {
      window.removeEventListener('resize', callback);
      window.removeEventListener('orientationchange', callback);
    };
  }
}
