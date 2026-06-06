import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Cancion, DataService, esVisible } from '../../core/services/data.service';

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

  constructor(private data: DataService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.data.listenToList<Cancion>('playlist', (data) => {
      const visibles = data.filter(esVisible);
      this.canciones.set(visibles);
      if (visibles.length > 0 && !this.activa()) this.reproducir(visibles[0]);
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
