import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Cancion } from '../../core/services/data.service';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playlist.html',
  styleUrl: './playlist.scss',
})
export class PlaylistComponent implements OnInit {
  canciones = signal<Cancion[]>([]);
  activa = signal<Cancion | null>(null);
  safeUrl = signal<SafeResourceUrl | null>(null);

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.http.get<Cancion[]>('assets/data/playlist.json').subscribe((data) => {
      this.canciones.set(data);
      if (data.length > 0) this.reproducir(data[0]);
    });
  }

  reproducir(cancion: Cancion): void {
    this.activa.set(cancion);
    if (cancion.youtubeId) {
      const url = `https://www.youtube.com/embed/${cancion.youtubeId}?autoplay=1`;
      this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    } else {
      this.safeUrl.set(null);
    }
  }
}
