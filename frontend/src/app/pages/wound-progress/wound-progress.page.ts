import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type DayItem = {
  date: string;     // ISO or any unique key
  label: string;    // e.g., "Oct 29"
  badge: string;    // e.g., "Today - Nov 02, 2023"
  src: string | null;
  alt: string;
};

@Component({
  selector: 'app-wound-progress',
  standalone: true,
  templateUrl: './wound-progress.page.html',
  styleUrls: ['./wound-progress.page.scss'],
  imports: [IonContent, CommonModule, RouterLink],
})
export class WoundProgressPage {
  days: DayItem[] = [
    {
      date: '2023-10-29',
      label: 'Oct 29',
      badge: 'Oct 29, 2023',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBj0lif0vdd2EvtSbYTJxKXcsopNjEboGN4kAlt0aejOE3isL_KjMhuhFJpDuIkq3ECmUHMiGocigYqkSeZHNXQtevjzpw8xc2myrNI-JZM5iiaRUD5eyrh20s6U58jQ_d43DYiiVQc-t6bl67G_zpkEsNTMBl5XImPGSuITOk3R7GgPqf9kWwixLAqPl2cD7gHLHrFXXP-snExA_JUjefSaNIKU-J7-ovagP8Vr3ArgHQRtCayZGjg7256wU3qf-OO7Z62kmD-QDzj',
      alt: 'Wound on October 29, 2023',
    },
    {
      date: '2023-10-30',
      label: 'Oct 30',
      badge: 'Oct 30, 2023',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBj0lif0vdd2EvtSbYTJxKXcsopNjEboGN4kAlt0aejOE3isL_KjMhuhFJpDuIkq3ECmUHMiGocigYqkSeZHNXQtevjzpw8xc2myrNI-JZM5iiaRUD5eyrh20s6U58jQ_d43DYiiVQc-t6bl67G_zpkEsNTMBl5XImPGSuITOk3R7GgPqf9kWwixLAqPl2cD7gHLHrFXXP-snExA_JUjefSaNIKU-J7-ovagP8Vr3ArgHQRtCayZGjg7256wU3qf-OO7Z62kmD-QDzj',
      alt: 'Wound on October 30, 2023',
    },
    {
      date: '2023-10-31',
      label: 'Oct 31',
      badge: 'Oct 31, 2023',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgMnariQnGeqSohsZeGiJ7r0iJg7QOeT0Ll_rEj2nBTjtQ7lh5IdRZnL6o90_l2QDbOownU6yPW2ckAQjg_K4MAcwOKhvHX_5F8R3GQl8oI40acjt45HH8TFvHjUkKFb_zf8VIwPSCCJaiAwJW3GRFbDSiCwL3J9NVXr7tGpj28NDWg2pe5DnMJ79_JuDkSIfUrFoxL2UhgQSibMAuRVA7gIc0_M3PBiUnqHIVewae0HZHxQ42qi1Hi249X2DgZ1NRvJC_j1wq-GRu',
      alt: 'Wound on October 31, 2023',
    },
    {
      date: '2023-11-01',
      label: 'Nov 01',
      badge: 'Nov 01, 2023',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBj0lif0vdd2EvtSbYTJxKXcsopNjEboGN4kAlt0aejOE3isL_KjMhuhFJpDuIkq3ECmUHMiGocigYqkSeZHNXQtevjzpw8xc2myrNI-JZM5iiaRUD5eyrh20s6U58jQ_d43DYiiVQc-t6bl67G_zpkEsNTMBl5XImPGSuITOk3R7GgPqf9kWwixLAqPl2cD7gHLHrFXXP-snExA_JUjefSaNIKU-J7-ovagP8Vr3ArgHQRtCayZGjg7256wU3qf-OO7Z62kmD-QDzj',
      alt: 'Wound on November 1, 2023',
    },
    {
      date: '2023-11-02',
      label: 'Nov 02 (Today)',
      badge: 'Today - Nov 02, 2023',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgMnariQnGeqSohsZeGiJ7r0iJg7QOeT0Ll_rEj2nBTjtQ7lh5IdRZnL6o90_l2QDbOownU6yPW2ckAQjg_K4MAcwOKhvHX_5F8R3GQl8oI40acjt45HH8TFvHjUkKFb_zf8VIwPSCCJaiAwJW3GRFbDSiCwL3J9NVXr7tGpj28NDWg2pe5DnMJ79_JuDkSIfUrFoxL2UhgQSibMAuRVA7gIc0_M3PBiUnqHIVewae0HZHxQ42qi1Hi249X2DgZ1NRvJC_j1wq-GRu',
      alt: 'Wound on November 2, 2023',
    },
  ];

  selected = this.days[this.days.length - 1];

  select(d: DayItem) { if (d.src) this.selected = d; }
  trackByDate = (_: number, d: DayItem) => d.date;
}
