import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';
import { CameraService } from '../../services/camera.service';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, IonIcon, RouterLink],
})
export class CameraPage implements OnInit, AfterViewInit, OnDestroy {
  mode: 'camera' | 'upload' = 'camera';
  captured = false;
  saving = false;
  uploadPreview: string | null = null;
  note = '';
  maxNoteLen = 280;

  onNoteInput(ev: Event) {
    const value = (ev.target as HTMLTextAreaElement).value ?? '';
    this.note = value.slice(0, this.maxNoteLen);
  }

  @ViewChild('webcam') webcamRef?: ElementRef<HTMLVideoElement>;
  private cleanupReflow?: () => void;

  constructor(
    private router: Router,
    private cameraService: CameraService
  ) {
    addIcons({ checkmarkCircle });
  }

  get isWeb(): boolean {
    return this.cameraService.isWeb;
  }

  get alreadyCapturedToday(): boolean {
    return this.cameraService.hasPhotoToday();
  }

  async ngOnInit() {
    // Initialize native preview if not web (doesn't need ViewChild)
    if (this.mode === 'camera' && !this.isWeb) {
      requestAnimationFrame(() => this.cameraService.startNativePreview());
      this.cleanupReflow = this.cameraService.setupReflowHandler(() => {
        if (this.mode === 'camera') {
          this.cameraService.startNativePreview();
        }
      });
    }
  }

  async ngAfterViewInit() {
    // Start webcam after view is initialized (needs ViewChild)
    if (this.mode === 'camera' && this.isWeb) {
      const video = this.webcamRef?.nativeElement;
      if (video) {
        await this.cameraService.startWebcam(video);
      }
    }
  }

  async ngOnDestroy() {
    if (this.isWeb) {
      this.cameraService.stopWebcam();
    } else {
      this.cleanupReflow?.();
      await this.cameraService.stopNativePreview();
    }
  }

  async setMode(mode: 'camera' | 'upload') {
    this.mode = mode;
    this.captured = false;
    
    if (mode === 'camera') {
      if (this.isWeb) {
        const video = this.webcamRef?.nativeElement;
        if (video) {
          await this.cameraService.startWebcam(video);
        }
      } else {
        await this.cameraService.startNativePreview(true);
        this.cleanupReflow?.();
        this.cleanupReflow = this.cameraService.setupReflowHandler(() => {
          if (this.mode === 'camera') {
            this.cameraService.startNativePreview();
          }
        });
      }
    } else {
      if (this.isWeb) {
        this.cameraService.stopWebcam();
      } else {
        this.cleanupReflow?.();
        await this.cameraService.stopNativePreview();
      }
    }
  }

  async shoot() {
    if (this.saving) return;

    try {
      this.saving = true;
      let dataUrl: string;

      if (this.mode === 'upload') {
        if (!this.uploadPreview) {
          console.warn('No file uploaded');
          return;
        }
        dataUrl = this.uploadPreview;
      } else if (this.isWeb && this.mode === 'camera') {
        const video = this.webcamRef?.nativeElement;
        if (!video) {
          console.warn('Video element not found');
          return;
        }
        dataUrl = await this.cameraService.captureFromWebcam(video);
      } else {
        dataUrl = await this.cameraService.captureFromNative();
      }

      const entry = await this.cameraService.savePhoto(dataUrl);
      console.log('Saved to:', entry);
      this.captured = true;
    } catch (e) {
      console.warn('Capture failed:', e);
    } finally {
      this.saving = false;
    }
  }

  onFile(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      this.uploadPreview = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  close() {
    this.router.navigateByUrl('/');
  }
}
