import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'capture',
    loadComponent: () => import('./pages/camera/camera.page').then(m => m.CameraPage),
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./pages/patient-profile/patient-profile.page').then(m => m.PatientProfilePage) 
  },
  // app.routes.ts
  { path: 'progress',
    loadComponent: () => import('./pages/wound-progress/wound-progress.page').then(m => m.WoundProgressPage) 
  }

];
