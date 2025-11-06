import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  templateUrl: './patient-profile.page.html',
  styleUrls: ['./patient-profile.page.scss'],
  imports: [IonContent, CommonModule, RouterLink],
})
export class PatientProfilePage {
  
}
