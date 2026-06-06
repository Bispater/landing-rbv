import { Component, forwardRef, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MESES, isoAPartes, partesAIso, diasDelMes } from '../../core/util/fecha';

/**
 * Selector de fecha en español con tres campos: Día / Mes / Año.
 * Trabaja como [(ngModel)] y emite/recibe un ISO 'yyyy-mm-dd'.
 * No depende del idioma del navegador (a diferencia de <input type="date">).
 */
@Component({
  selector: 'app-fecha-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fecha-input">
      <select [(ngModel)]="dia" (ngModelChange)="emitir()" aria-label="Día">
        <option [ngValue]="null" disabled>Día</option>
        @for (d of dias(); track d) { <option [ngValue]="d">{{ d }}</option> }
      </select>
      <select [(ngModel)]="mes" (ngModelChange)="onMesAnio()" aria-label="Mes">
        <option [ngValue]="null" disabled>Mes</option>
        @for (m of meses; track m.valor) { <option [ngValue]="m.valor">{{ m.nombre }}</option> }
      </select>
      <select [(ngModel)]="anio" (ngModelChange)="onMesAnio()" aria-label="Año">
        <option [ngValue]="null" disabled>Año</option>
        @for (a of anios; track a) { <option [ngValue]="a">{{ a }}</option> }
      </select>
    </div>
  `,
  styles: [`
    .fecha-input { display: flex; gap: 0.5rem; }
    .fecha-input select {
      flex: 1;
      padding: 0.6rem 0.5rem;
      border: 1px solid var(--color-border, #ccc);
      border-radius: var(--radius-sm, 6px);
      font-family: inherit;
      font-size: 0.9rem;
      background: #fff;
      cursor: pointer;
    }
    .fecha-input select:first-child { flex: 0 0 70px; }
  `],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FechaInputComponent), multi: true },
  ],
})
export class FechaInputComponent implements ControlValueAccessor {
  /** Año mínimo y máximo seleccionables. */
  @Input() anioMin = 2015;
  @Input() anioMax = new Date().getFullYear() + 5;

  dia: number | null = null;
  mes: number | null = null;
  anio: number | null = null;
  dias = signal<number[]>(this.rango(1, 31));

  readonly meses = MESES.map((nombre, i) => ({ valor: i + 1, nombre: nombre[0].toUpperCase() + nombre.slice(1) }));
  get anios(): number[] { return this.rango(this.anioMin, this.anioMax).reverse(); }

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(iso: string): void {
    const p = isoAPartes(iso);
    this.dia = p?.dia ?? null;
    this.mes = p?.mes ?? null;
    this.anio = p?.anio ?? null;
    this.recalcularDias();
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  onMesAnio(): void {
    this.recalcularDias();
    this.emitir();
  }

  emitir(): void {
    this.onTouched();
    if (this.dia && this.mes && this.anio) {
      this.onChange(partesAIso(this.dia, this.mes, this.anio));
    } else {
      this.onChange('');
    }
  }

  private recalcularDias(): void {
    const max = this.mes && this.anio ? diasDelMes(this.mes, this.anio) : 31;
    this.dias.set(this.rango(1, max));
    if (this.dia && this.dia > max) { this.dia = max; }
  }

  private rango(desde: number, hasta: number): number[] {
    return Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);
  }
}
