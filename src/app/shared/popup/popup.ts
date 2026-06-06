import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService, Popup } from '../../core/services/data.service';
import { partesAIso } from '../../core/util/fecha';

const STORAGE_KEY = 'rbv_popups_cerrados';

/**
 * Muestra avisos emergentes (popups) programados en el sitio público.
 * Un popup se muestra si está activo y la fecha de hoy está entre `desde` y `hasta`.
 * Los descartes se recuerdan por sesión para no molestar al usuario.
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
  private pendientes: Popup[] = [];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    const hoy = this.hoyIso();
    const cerrados = this.cerrados();
    this.data.listenToList<Popup>('popups', (lista) => {
      this.pendientes = lista.filter(
        (p) => p.activo && p.desde <= hoy && hoy <= p.hasta && !cerrados.has(p.id ?? ''),
      );
      if (!this.actual()) this.mostrarSiguiente();
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
    this.mostrarSiguiente();
  }

  private mostrarSiguiente(): void {
    const cerrados = this.cerrados();
    const siguiente = this.pendientes.find((p) => !cerrados.has(p.id ?? ''));
    this.actual.set(siguiente ?? null);
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
}
