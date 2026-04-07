import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Foto } from '../../core/services/data.service';

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Foto[]>('assets/data/photos.json').subscribe((data) => {
      this.fotos.set(data);
      const cats = ['todas', ...new Set(data.map((f) => f.categoria))];
      this.categorias.set(cats);
    });
  }

  get fotosFiltradas(): Foto[] {
    if (this.filtroActivo() === 'todas') return this.fotos();
    return this.fotos().filter((f) => f.categoria === this.filtroActivo());
  }

  setFiltro(cat: string): void {
    this.filtroActivo.set(cat);
  }

  abrirFoto(foto: Foto): void {
    this.fotoAmpliada.set(foto);
    document.body.style.overflow = 'hidden';
  }

  cerrarFoto(): void {
    this.fotoAmpliada.set(null);
    document.body.style.overflow = '';
  }
}
