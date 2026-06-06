import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService, Popup } from '../../core/services/data.service';
import { partesAIso } from '../../core/util/fecha';

const STORAGE_KEY = 'rbv_popups_cerrados';

/**
 * Muestra UN aviso emergente (popup) programado en el sitio público.
 * Se evalúa una sola vez por carga de página: si el usuario lo cierra, no vuelve
 * a aparecer durante la sesión (se recuerda el descarte en sessionStorage).
 */
@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './popup.html',
  styleUrl: './popup.scss',
})
export class PopupComponent implements OnInit {
  actual = signal<Popup | null>(null);
  private yaEvaluado = false;

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.listenToList<Popup>('popups', (lista) => {
      // Solo decidimos qué mostrar la primera vez que llegan los datos.
      if (this.yaEvaluado) return;
      this.yaEvaluado = true;

      const hoy = this.hoyIso();
      const cerrados = this.cerrados();
      const candidatos = lista
        .filter((p) => p.activo && p.desde <= hoy && hoy <= p.hasta && !cerrados.has(p.id ?? ''))
        // Prioridad: gana el de rango de fechas más corto (más específico);
        // si empatan, el que empieza más tarde (más reciente).
        .sort((a, b) => this.duracion(a) - this.duracion(b) || (a.desde < b.desde ? 1 : -1));
      this.actual.set(candidatos[0] ?? null);
    });
  }

  esExterno(enlace?: string): boolean {
    return !!enlace && /^https?:\/\//.test(enlace);
  }

  cerrar(): void {
    const p = this.actual();
    if (p?.id) {
      const cerrados = this.cerrados();
      cerrados.add(p.id);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...cerrados]));
    }
    this.actual.set(null);
  }

  private cerrados(): Set<string> {
    try {
      return new Set(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]'));
    } catch {
      return new Set();
    }
  }

  private hoyIso(): string {
    const d = new Date();
    return partesAIso(d.getDate(), d.getMonth() + 1, d.getFullYear());
  }

  /** Duración del popup en milisegundos (rango desde→hasta). Menor = más específico = más prioridad. */
  private duracion(p: Popup): number {
    const a = Date.parse(p.desde);
    const b = Date.parse(p.hasta);
    return isNaN(a) || isNaN(b) ? Number.MAX_SAFE_INTEGER : b - a;
  }
}
