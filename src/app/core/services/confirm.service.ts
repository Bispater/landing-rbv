import { Injectable, signal } from '@angular/core';

export interface ConfirmOpciones {
  titulo?: string;
  mensaje: string;
  confirmar?: string;
  cancelar?: string;
  peligro?: boolean;
}

/** Diálogo de confirmación propio (reemplaza window.confirm). `ask()` devuelve una promesa booleana. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly opciones = signal<ConfirmOpciones | null>(null);
  private resolver: ((v: boolean) => void) | null = null;

  ask(opciones: ConfirmOpciones): Promise<boolean> {
    this.opciones.set(opciones);
    return new Promise<boolean>((resolve) => (this.resolver = resolve));
  }

  responder(ok: boolean): void {
    this.opciones.set(null);
    this.resolver?.(ok);
    this.resolver = null;
  }
}
