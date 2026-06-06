import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ref, set, push, remove, update, onValue, DatabaseReference } from 'firebase/database';
import { db } from '../../firebase.config';

/** Una ocurrencia del evento: una fecha con su propia hora. */
export interface FechaEvento {
  fecha: string; // ISO yyyy-mm-dd
  hora?: string; // HH:mm
}

export interface Evento {
  id?: string;
  titulo: string;
  descripcion: string;
  /** Fecha principal (= la más próxima de `fechas`). Se mantiene por compatibilidad y orden. */
  fecha: string;
  /** Una o varias ocurrencias (1 a 4), cada una con su propia hora. Ej: un sábado a las 16:00 y el siguiente a las 18:00. */
  fechas?: FechaEvento[];
  /** Hora del evento (legado: cuando solo hay una fecha simple). */
  hora?: string;
  lugar?: string;
  imagen?: string;
  tipo: 'evento' | 'presentacion' | 'ensayo';
  /** Si es false, la publicación queda oculta del sitio público (sin eliminarla). */
  visible?: boolean;
}

/** Aviso emergente programado que se muestra en el sitio público entre `desde` y `hasta`. */
export interface Popup {
  id?: string;
  titulo: string;
  mensaje: string;
  imagen?: string;
  enlace?: string;
  textoEnlace?: string;
  desde: string; // ISO yyyy-mm-dd
  hasta: string; // ISO yyyy-mm-dd
  activo: boolean;
}

/** Sección de un documento (estatutos o reglamentos). En reglamentos, `contenido` es una regla por línea. */
export interface DocSeccion {
  id?: string;
  titulo: string;
  contenido: string;
  icono?: string;
}

/** Mensaje enviado desde el formulario de contacto. */
export interface Mensaje {
  id?: string;
  nombre: string;
  email: string;
  tipo: string;
  mensaje: string;
  fecha: string; // ISO datetime
}

/** Suscriptor que quiere recibir avisos (convocatoria / eventos). */
export interface Suscriptor {
  id?: string;
  email: string;
  interes: string;
  fecha: string; // ISO datetime
}

/**
 * Devuelve las ocurrencias (fecha + hora) de un evento, ordenadas por fecha.
 * Tolera datos antiguos donde `fechas` era un arreglo de strings o donde solo existía `fecha`.
 */
export function ocurrenciasEvento(e: Evento): FechaEvento[] {
  const raw = e.fechas as Array<FechaEvento | string> | undefined;
  if (raw && raw.length) {
    return raw
      .map((f) => (typeof f === 'string' ? { fecha: f, hora: e.hora } : f))
      .filter((o) => o && o.fecha)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
  if (e.fecha) return [{ fecha: e.fecha, hora: e.hora }];
  return [];
}

/** Fecha más próxima de un evento, usada para ordenar. */
export function fechaPrincipal(e: Evento): string {
  return ocurrenciasEvento(e)[0]?.fecha ?? '';
}

export interface Miembro {
  id?: string;
  nombre: string;
  rol: string;
  cargo?: string;
  foto?: string;
  comision: string;
}

export interface Comision {
  id?: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  miembros: Miembro[];
}

export interface Cancion {
  id?: string;
  titulo: string;
  artista: string;
  genero: string;
  youtubeId?: string;
  duracion?: string;
  descripcion?: string;
  visible?: boolean;
}

export interface Tutorial {
  id?: string;
  titulo: string;
  descripcion: string;
  youtubeId: string;
  nivel: 'principiante' | 'intermedio' | 'avanzado';
  duracion?: string;
  instructor?: string;
  visible?: boolean;
}

export interface Foto {
  id?: string;
  url: string;
  titulo: string;
  descripcion?: string;
  fecha?: string;
  categoria: string;
  /** When set, this gallery item is a YouTube video: the thumbnail is used as the image and it plays in the lightbox. */
  youtubeId?: string;
  visible?: boolean;
}

/** Una publicación está visible si su campo `visible` no es false (por defecto visible). */
export function esVisible(item: { visible?: boolean }): boolean {
  return item.visible !== false;
}

export interface Stat {
  num: string;
  label: string;
}

/** Configuración del video de fondo del hero. */
export interface HeroVideo {
  /** 'youtube' = se usa `youtubeId`; 'archivo' = se usa `url` (video subido a Cloudinary). */
  tipo: 'youtube' | 'archivo';
  youtubeId: string;
  url: string;
  /** Segundo de inicio del tramo en bucle (solo YouTube). */
  inicio?: number;
  /** Segundo de fin del tramo en bucle (0 = hasta el final). Solo YouTube. */
  fin?: number;
}

/** Editable site-wide content (hero, about, contact), stored at the RTDB `contenido` node. */
export interface Contenido {
  hero: {
    badge: string;
    titulo: string;
    ciudad: string;
    descripcion: string;
    frases: string[];
    stats: Stat[];
    video: HeroVideo;
  };
  about: {
    label: string;
    titulo: string;
    parrafos: string[];
  };
  /** Estado de la convocatoria (proceso de admisión de nuevos integrantes). */
  convocatoria: {
    titulo: string;
    estado: string;
    abierta: boolean;
    mensaje: string;
  };
  contacto: {
    direccion: string;
    email: string;
    instagram: string;
    youtube: string;
    facebook: string;
  };
}

export const DEFAULT_CONTENIDO: Contenido = {
  hero: {
    badge: 'Agrupación Andina',
    titulo: 'Reales Brillantes',
    ciudad: 'Valparaíso',
    descripcion:
      'Fraternidad de Caporales que lleva la fuerza y el brillo de la danza andina al corazón de la Quinta Región. Únete a nuestra comunidad de carnaval y tradición.',
    frases: ['Caporales', 'Tradición Andina', 'Carnaval con la Fuerza del Sol', 'Pasión y Brillo'],
    stats: [
      { num: '15+', label: 'Años de historia' },
      { num: '50+', label: 'Integrantes' },
      { num: '100+', label: 'Presentaciones' },
    ],
    video: { tipo: 'youtube', youtubeId: 'fbjNfowfN-A', url: '', inicio: 0, fin: 0 },
  },
  about: {
    label: 'Quiénes somos',
    titulo: 'Una fraternidad unida por la danza de los Caporales',
    parrafos: [
      'Somos una fraternidad de Caporales nacida en Valparaíso, filial de los Caporales Reales Brillantes Andinos de Arica. Llevamos a los cerros del puerto la fuerza, el ritmo y la alegría de esta danza del altiplano.',
      'Nuestro nombre, Reales Brillantes, refleja el brillo de los trajes, los cascabeles y la nobleza con que bailamos en cada carnaval y pasacalle.',
    ],
  },
  convocatoria: {
    titulo: 'Convocatoria 2025',
    estado: 'Cerrada',
    abierta: false,
    mensaje:
      'La convocatoria 2025 está cerrada. ¡Pronto abriremos la próxima! Déjanos tu correo en Contacto y te avisaremos cuando puedas sumarte a la fraternidad.',
  },
  contacto: {
    direccion: 'Av. Argentina 747, Valparaíso',
    email: 'realesbrillantes.valparaiso@gmail.com',
    instagram: 'https://www.instagram.com/rbvalpo/',
    youtube: 'https://www.youtube.com/@realesbrillantesvalparaiso6637',
    facebook: 'https://www.facebook.com/reales.brillantes.valparaiso/',
  },
};

/** Returns the YouTube thumbnail URL for a video id (free, Google-CDN hosted). */
export function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Combina el contenido guardado con los valores por defecto (merge profundo en hero/about/contacto),
 * garantizando que campos nuevos como `hero.video` siempre existan aunque el dato guardado sea antiguo.
 */
export function conContenidoDefaults(val: Partial<Contenido> | null | undefined): Contenido {
  const d = structuredClone(DEFAULT_CONTENIDO);
  if (!val) return d;
  return {
    hero: {
      ...d.hero,
      ...(val.hero ?? {}),
      stats: val.hero?.stats ?? d.hero.stats,
      frases: val.hero?.frases ?? d.hero.frases,
      video: { ...d.hero.video, ...(val.hero?.video ?? {}) },
    },
    about: {
      ...d.about,
      ...(val.about ?? {}),
      parrafos: val.about?.parrafos ?? d.about.parrafos,
    },
    convocatoria: { ...d.convocatoria, ...(val.convocatoria ?? {}) },
    contacto: { ...d.contacto, ...(val.contacto ?? {}) },
  };
}

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private http: HttpClient) {}

  getJsonData<T>(path: string): Observable<T> {
    return this.http.get<T>(`assets/data/${path}`);
  }

  listenToRef<T>(path: string, callback: (data: T) => void): void {
    const dbRef: DatabaseReference = ref(db, path);
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
  }

  /** Listens to a collection node and returns it as an array, injecting each child key as `id`. */
  listenToList<T extends { id?: string }>(path: string, callback: (items: T[]) => void): void {
    this.listenToRef<Record<string, T>>(path, (val) => {
      callback(val ? Object.entries(val).map(([id, v]) => ({ ...v, id })) : []);
    });
  }

  /**
   * Sube un archivo (imagen o video) a Cloudinary con un preset sin firma y devuelve su URL segura.
   * Usa el endpoint `auto` para aceptar imagen o video. Valida el tamaño máximo en MB.
   * Requiere CLOUDINARY_CLOUD_NAME y CLOUDINARY_UPLOAD_PRESET configurados.
   */
  async uploadMedia(file: File, maxMb: number): Promise<string> {
    if (file.size > maxMb * 1024 * 1024) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(`El archivo pesa ${mb} MB y supera el máximo de ${maxMb} MB.`);
    }
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } = await import('../../cloudinary.config');
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary no está configurado. Completa src/app/cloudinary.config.ts');
    }
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error('Error al subir el archivo a Cloudinary');
    const data = await res.json();
    return data.secure_url as string;
  }

  async addItem(path: string, data: object): Promise<void> {
    const dbRef = ref(db, path);
    await push(dbRef, data);
  }

  async setItem(path: string, data: object): Promise<void> {
    const dbRef = ref(db, path);
    await set(dbRef, data);
  }

  async updateItem(path: string, data: object): Promise<void> {
    const dbRef = ref(db, path);
    await update(dbRef, data);
  }

  async deleteItem(path: string): Promise<void> {
    const dbRef = ref(db, path);
    await remove(dbRef);
  }

  /** Replaces a whole collection node with the given items, assigning each a fresh push id. */
  async seedCollection<T>(path: string, items: T[]): Promise<void> {
    const dbRef = ref(db, path);
    const obj: Record<string, T> = {};
    for (const item of items) {
      const key = push(dbRef).key as string;
      obj[key] = item;
    }
    await set(dbRef, obj);
  }
}
