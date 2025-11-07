// top of file
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';

/** Native plugin */
import {
  CameraPreview,
  CameraPreviewOptions,
  CameraPreviewPictureOptions,
} from '@capacitor-community/camera-preview';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule],
})
export class CameraPage implements OnInit, OnDestroy {
  mode: 'camera' | 'upload' = 'camera';
  isWeb = Capacitor.getPlatform() === 'web';

  @ViewChild('webcam') webcamRef?: ElementRef<HTMLVideoElement>;
  private webStream?: MediaStream;

  private onReflow = () => { if (!this.isWeb && this.mode==='camera') this.startNativePreview(); };

  constructor(private router: Router) {}

  /* ------------ Lifecycle ------------ */
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

  private async saveToFilesystem(dataUrl: string): Promise<string> {
    const base64 = dataUrl.split(',')[1]; // strip "data:image/jpeg;base64,"
    const fileName = `photos/photo_${Date.now()}.jpg`;
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Data, // app-private storage
      recursive: true,
    });
    // Optionally keep a simple index of saved photos
    try {
      const listRaw = localStorage.getItem('saved_photos') ?? '[]';
      const list = JSON.parse(listRaw) as string[];
      list.unshift(uri);
      localStorage.setItem('saved_photos', JSON.stringify(list.slice(0, 200)));
    } catch {}
    return uri; // e.g. capacitor://… on native, or internal id on web
  }
  

  /* ------------ Mode switching ------------ */
  async setMode(mode: 'camera' | 'upload') {
    this.mode = mode;
    if (mode === 'camera') {
      if (this.isWeb) await this.startWebcam();
      else await this.startNativePreview(true);
    } else {
      if (this.isWeb) this.stopWebcam();
      else await this.stopNativePreview();
    }
  }

  /* ------------ Web fallback ------------ */
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

  /* ------------ Native preview (Android/iOS) ------------ */
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

  /* ------------ Capture ------------ */
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
  
      // TODO: navigate to a confirm/gallery page; pass the uri if you like
      this.close();
    } catch (e) {
      console.warn('Capture failed:', e);
    }
  }
  

  /* ------------ Upload ------------ */
  uploadPreview: string | null = null;
  onFile(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.uploadPreview = String(reader.result || ''); };
    reader.readAsDataURL(file);
  }

  /* ------------ Nav ------------ */
  close() { this.router.navigateByUrl('/'); }
}
