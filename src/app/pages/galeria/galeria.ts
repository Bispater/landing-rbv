import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Foto, DataService, youtubeThumb } from '../../core/services/data.service';

@Component({
  selector: 'app-galeria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galeria.html',
  styleUrl: './galeria.scss',
})
export class GaleriaComponent implements OnInit {
  fotos = signal<Foto[]>([]);
  categorias = signal<string[]>([]);
  filtroActivo = signal('todas');
  fotoAmpliada = signal<Foto | null>(null);
  videoUrl = signal<SafeResourceUrl | null>(null);

  constructor(private data: DataService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.data.listenToList<Foto>('fotos', (data) => {
      this.fotos.set(data);
      const cats = ['todas', ...new Set(data.map((f) => f.categoria))];
      this.categorias.set(cats);
    });
  }

  get fotosFiltradas(): Foto[] {
    if (this.filtroActivo() === 'todas') return this.fotos();
    return this.fotos().filter((f) => f.categoria === this.filtroActivo());
  }

  /** Image to show for a gallery item: the YouTube thumbnail when it's a video, else the photo url. */
  imagenDe(foto: Foto): string {
    return foto.youtubeId ? youtubeThumb(foto.youtubeId) : foto.url;
  }

  setFiltro(cat: string): void {
    this.filtroActivo.set(cat);
  }

  abrirFoto(foto: Foto): void {
    this.fotoAmpliada.set(foto);
    if (foto.youtubeId) {
      const url = `https://www.youtube.com/embed/${foto.youtubeId}?autoplay=1`;
      this.videoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    } else {
      this.videoUrl.set(null);
    }
    document.body.style.overflow = 'hidden';
  }

  cerrarFoto(): void {
    this.fotoAmpliada.set(null);
    this.videoUrl.set(null);
    document.body.style.overflow = '';
  }
}
