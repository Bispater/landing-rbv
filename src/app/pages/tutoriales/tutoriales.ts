import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Tutorial } from '../../core/services/data.service';

@Component({
  selector: 'app-tutoriales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutoriales.html',
  styleUrl: './tutoriales.scss',
})
export class TutorialesComponent implements OnInit {
  tutoriales = signal<Tutorial[]>([]);
  filtroNivel = signal('todos');
  niveles = ['todos', 'principiante', 'intermedio', 'avanzado'];
  activo = signal<Tutorial | null>(null);
  safeUrl = signal<SafeResourceUrl | null>(null);

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.http.get<Tutorial[]>('assets/data/tutorials.json').subscribe((data) => {
      this.tutoriales.set(data);
    });
  }

  get tutorialesFiltrados(): Tutorial[] {
    if (this.filtroNivel() === 'todos') return this.tutoriales();
    return this.tutoriales().filter((t) => t.nivel === this.filtroNivel());
  }

  verTutorial(tutorial: Tutorial): void {
    this.activo.set(tutorial);
    const url = `https://www.youtube.com/embed/${tutorial.youtubeId}?autoplay=1`;
    this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  cerrar(): void {
    this.activo.set(null);
    this.safeUrl.set(null);
  }

  getNivelColor(nivel: string): string {
    const map: Record<string, string> = {
      principiante: '#22C55E',
      intermedio: '#F59E0B',
      avanzado: '#EF4444',
    };
    return map[nivel] || '#666';
  }
}
