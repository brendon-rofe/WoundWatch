import { Component, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

type GalleryIndexItem = { uri: string; path: string; ts: number };
type DayItem = {
  date: string;
  label: string;
  badge: string;
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
export class WoundProgressPage implements OnInit {
  days: DayItem[] = [];
  selected!: DayItem;

  async ngOnInit() {
    await this.loadSavedPhotos();
  }

  private getSavedIndex(): GalleryIndexItem[] {
    const raw = localStorage.getItem('saved_photos');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);

      // Back-compat: earlier versions might have stored as plain string URIs
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        return (parsed as string[]).map(uri => {
          // try extract timestamp from name if it exists: photo_1699999999999.jpg
          const match = uri.match(/photo_(\d{10,})\.jpg/i);
          const ts = match ? Number(match[1]) : Date.now();
          // best-effort path guess (works on web + native if you used same filename pattern)
          const path = match ? `photos/photo_${match[1]}.jpg` : `photos/photo_${ts}.jpg`;
          return { uri, path, ts };
        });
      }

      // Normal case
      return parsed as GalleryIndexItem[];
    } catch {
      return [];
    }
  }

  private async resolveSrc(item: GalleryIndexItem): Promise<string | null> {
    const isWeb = Capacitor.getPlatform() === 'web';

    if (!isWeb) {
      // Native: WebView can usually render the capacitor:// or file:// URI directly
      return item.uri;
    }

    // Web: read from IndexedDB and convert to data URL
    try {
      const file = await Filesystem.readFile({ path: item.path, directory: Directory.Data });
      return `data:image/jpeg;base64,${file.data}`;
    } catch {
      // fallback: if read fails but uri is usable in this environment
      return item.uri || null;
    }
  }

  private fmtLabel(d: Date) {
    return d.toLocaleString(undefined, { month: 'short', day: '2-digit' }); // e.g., "Nov 07"
  }
  private fmtBadge(d: Date) {
    const today = new Date();
    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    const base = d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
    return isToday ? `Today - ${base}` : base;
  }

  async loadSavedPhotos() {
    const index = this.getSavedIndex()
      .sort((a, b) => b.ts - a.ts)        // newest first
      .slice(0, 5);                       // last 5

    const resolved = await Promise.all(
      index.map(async (it) => {
        const date = new Date(it.ts);
        const src = await this.resolveSrc(it);
        return <DayItem>{
          date: date.toISOString().slice(0, 10),
          label: this.fmtLabel(date),
          badge: this.fmtBadge(date),
          src,
          alt: `Wound on ${date.toDateString()}`,
        };
      })
    );

    // If fewer than 5, pad with empty placeholders (keeps your UI layout)
    while (resolved.length < 5) {
      const idx = 5 - resolved.length;
      resolved.push({
        date: `placeholder-${idx}`,
        label: '—',
        badge: 'No image',
        src: null,
        alt: 'No image',
      });
    }

    this.days = resolved;
    // default to the newest available item with an image; else first placeholder
    this.selected = this.days.find(d => !!d.src) ?? this.days[0];
  }

  select(d: DayItem) { if (d.src) this.selected = d; }
  trackByDate = (_: number, d: DayItem) => d.date;
}
