/** Utilidades de fecha en español. Las fechas se guardan siempre como ISO 'yyyy-mm-dd'. */

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export interface PartesFecha {
  dia: number;
  mes: number; // 1-12
  anio: number;
}

/** Convierte 'yyyy-mm-dd' en sus partes numéricas (null si no es válida). */
export function isoAPartes(iso?: string): PartesFecha | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return { anio: +m[1], mes: +m[2], dia: +m[3] };
}

/** Arma un ISO 'yyyy-mm-dd' a partir de día/mes/año. */
export function partesAIso(dia: number, mes: number, anio: number): string {
  const dd = String(dia).padStart(2, '0');
  const mm = String(mes).padStart(2, '0');
  return `${anio}-${mm}-${dd}`;
}

/** Cantidad de días de un mes (1-12) considerando años bisiestos. */
export function diasDelMes(mes: number, anio: number): number {
  return new Date(anio, mes, 0).getDate();
}

/** Formatea una fecha ISO como "21 de julio de 2025". Devuelve '' si no es válida. */
export function formatearFechaLarga(iso?: string): string {
  const p = isoAPartes(iso);
  if (!p) return '';
  return `${p.dia} de ${MESES[p.mes - 1]} de ${p.anio}`;
}

/** Formatea una fecha ISO corta como "21 de julio" (sin año). */
export function formatearFechaCorta(iso?: string): string {
  const p = isoAPartes(iso);
  if (!p) return '';
  return `${p.dia} de ${MESES[p.mes - 1]}`;
}
