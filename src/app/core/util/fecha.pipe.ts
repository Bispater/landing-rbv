import { Pipe, PipeTransform } from '@angular/core';
import { formatearFechaLarga, formatearFechaCorta } from './fecha';

/** {{ '2025-07-21' | fechaLarga }} → "21 de julio de 2025" */
@Pipe({ name: 'fechaLarga', standalone: true })
export class FechaLargaPipe implements PipeTransform {
  transform(iso?: string): string {
    return formatearFechaLarga(iso);
  }
}

/** {{ '2025-07-21' | fechaCorta }} → "21 de julio" */
@Pipe({ name: 'fechaCorta', standalone: true })
export class FechaCortaPipe implements PipeTransform {
  transform(iso?: string): string {
    return formatearFechaCorta(iso);
  }
}
