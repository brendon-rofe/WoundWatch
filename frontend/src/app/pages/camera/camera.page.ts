import { Filesystem, Directory } from '@capacitor/filesystem';
import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';

import {
  CameraPreview,
  CameraPreviewOptions,
} from '@capacitor-community/camera-preview';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, IonIcon, RouterLink],
})
export class CameraPage implements OnInit, OnDestroy {
  mode: 'camera' | 'upload' = 'camera';
  isWeb = Capacitor.getPlatform() === 'web';
  captured = false;
  saving = false;

  @ViewChild('webcam') webcamRef?: ElementRef<HTMLVideoElement>;
  private webStream?: MediaStream;

  private onReflow = () => { if (!this.isWeb && this.mode==='camera') this.startNativePreview(); };

  constructor(private router: Router) {
    addIcons({ checkmarkCircle });
  }

  async ngOnInit() {
    if (this.mode === 'camera') {
      if (this.isWeb) await this.startWebcam();
      else {
        requestAnimationFrame(() => this.startNativePreview());
        window.addEventListener('resize', this.onReflow);
        window.addEventListener('orientationchange', this.onReflow);
      }
    }
  }

  async ngOnDestroy() {
    if (this.isWeb) this.stopWebcam();
    else {
      window.removeEventListener('resize', this.onReflow);
      window.removeEventListener('orientationchange', this.onReflow);
      await this.stopNativePreview();
    }
  }

  private hasPhotoToday(): boolean {
    const raw = localStorage.getItem('saved_photos');
    if (!raw) return false;
  
    try {
      const list = JSON.parse(raw) as Array<{ ts: number }>;
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
  
      return list.some(entry => {
        const date = new Date(entry.ts);
        return date >= startOfToday && date <= endOfToday;
      });
    } catch {
      return false;
    }
  }

  get alreadyCapturedToday(): boolean {
    return this.hasPhotoToday();
  }
  

  private async saveToFilesystem(dataUrl: string): Promise<{ uri: string; path: string; ts: number }> {
    const base64 = dataUrl.split(',')[1];
    const ts = Date.now();
    const fileName = `photos/photo_${ts}.jpg`;

    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Data,
      recursive: true,
    });

    const entry = { uri, path: fileName, ts };
    const raw = localStorage.getItem('saved_photos') ?? '[]';
    const list = JSON.parse(raw) as Array<{ uri: string; path: string; ts: number }>;
    list.unshift(entry);
    localStorage.setItem('saved_photos', JSON.stringify(list.slice(0, 200)));
    return entry;
  }

  

  async setMode(mode: 'camera' | 'upload') {
    this.mode = mode;
    this.captured = false;
    if (mode === 'camera') {
      if (this.isWeb) await this.startWebcam();
      else await this.startNativePreview(true);
    } else {
      if (this.isWeb) this.stopWebcam();
      else await this.stopNativePreview();
    }
  }

  private async startWebcam() {
    try {
      this.stopWebcam();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      this.webStream = stream;
      const vid = this.webcamRef?.nativeElement;
      if (vid) {
        vid.srcObject = stream;
        await vid.play();
      }
    } catch (e) { console.warn('Webcam start failed:', e); }
  }

  private stopWebcam() {
    this.webStream?.getTracks().forEach(t => t.stop());
    this.webStream = undefined;
  }

  private async startNativePreview(restart = false) {
    try {
      if (restart) await this.stopNativePreview();

      const box = document.getElementById('previewBox');
      if (!box) return;

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
    } catch (e) { console.warn('Native preview start failed:', e); }
  }

  private async stopNativePreview() {
    try { await CameraPreview.stop(); } catch {}
  }

  async shoot() {
    try {
      let dataUrl: string;
  
      if (this.mode === 'upload') {
        if (!this.uploadPreview) return console.warn('No file uploaded');
        dataUrl = this.uploadPreview;
      } else if (this.isWeb && this.mode === 'camera') {
        const video = this.webcamRef?.nativeElement;
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return console.warn('Video not ready');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d'); if (!ctx) return console.warn('No ctx');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      } else {
        // Native camera-preview capture
        const pic = await CameraPreview.capture({ quality: 95 });
        dataUrl = 'data:image/jpeg;base64,' + pic.value;
      }
  
      const uri = await this.saveToFilesystem(dataUrl);
      console.log('Saved to:', uri);
      this.captured = true;
    } catch (e) {
      console.warn('Capture failed:', e);
    }
  }
  

  uploadPreview: string | null = null;
  onFile(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.uploadPreview = String(reader.result || ''); };
    reader.readAsDataURL(file);
  }

  close() { this.router.navigateByUrl('/'); }
}
