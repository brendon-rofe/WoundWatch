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

      if (this.isWeb && this.mode === 'camera' && this.webcamRef?.nativeElement) {
        const video = this.webcamRef.nativeElement;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      } else {
        const pic = await CameraPreview.capture({ quality: 95 } as CameraPreviewPictureOptions);
        dataUrl = 'data:image/jpeg;base64,' + pic.value;
      }

      console.log('Captured image data URL length:', dataUrl.length);
      // TODO: navigate to confirm/save page with { state: { dataUrl } }
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
