import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DataService, DocSeccion, Contenido } from '../../core/services/data.service';

@Component({
  selector: 'app-reglamentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reglamentos.html',
  styleUrl: './reglamentos.scss',
})
export class ReglamentosComponent implements OnInit {
  reglamentos = signal<DocSeccion[]>([]);
  pdfUrl = signal('');
  pdfSafe = signal<SafeResourceUrl | null>(null);

  constructor(private data: DataService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.data.listenToList<DocSeccion>('reglamentos', (val) => {
      this.reglamentos.set(val);
    });
    this.data.listenToRef<Contenido>('contenido', (c) => {
      const url = c?.reglamentosPdf || '';
      this.pdfUrl.set(url);
      this.pdfSafe.set(url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null);
    });
  }

  items(contenido: string): string[] {
    return (contenido || '').split('\n').map((s) => s.trim()).filter(Boolean);
  }
}
