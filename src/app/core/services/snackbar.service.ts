import { Injectable, signal } from '@angular/core';

export interface SnackMensaje {
  texto: string;
  tipo: 'ok' | 'error';
}

/** Muestra mensajes breves (snackbar) tras una acción. Reemplaza los alert() nativos. */
@Injectable({ providedIn: 'root' })
export class SnackbarService {
  readonly mensaje = signal<SnackMensaje | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  show(texto: string, tipo: 'ok' | 'error' = 'ok'): void {
    this.mensaje.set({ texto, tipo });
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.mensaje.set(null), 3500);
  }

  cerrar(): void {
    if (this.timer) clearTimeout(this.timer);
    this.mensaje.set(null);
  }
}
