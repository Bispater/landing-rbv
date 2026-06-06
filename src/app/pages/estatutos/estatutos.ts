import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DataService, DocSeccion, Contenido } from '../../core/services/data.service';

@Component({
  selector: 'app-estatutos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estatutos.html',
  styleUrl: './estatutos.scss',
})
export class EstatutosComponent implements OnInit {
  secciones = signal<DocSeccion[]>([]);
  pdfUrl = signal('');
  pdfSafe = signal<SafeResourceUrl | null>(null);

  constructor(private data: DataService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.data.listenToList<DocSeccion>('estatutos', (val) => {
      this.secciones.set(val);
    });
    this.data.listenToRef<Contenido>('contenido', (c) => {
      const url = c?.estatutosPdf || '';
      this.pdfUrl.set(url);
      this.pdfSafe.set(url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null);
    });
  }
}
