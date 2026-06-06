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
}

export interface Tutorial {
  id?: string;
  titulo: string;
  descripcion: string;
  youtubeId: string;
  nivel: 'principiante' | 'intermedio' | 'avanzado';
  duracion?: string;
  instructor?: string;
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
}

export interface Stat {
  num: string;
  label: string;
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
  };
  about: {
    label: string;
    titulo: string;
    parrafos: string[];
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
  },
  about: {
    label: 'Quiénes somos',
    titulo: 'Una fraternidad unida por la danza de los Caporales',
    parrafos: [
      'Somos una fraternidad de Caporales nacida en Valparaíso, filial de los Caporales Reales Brillantes Andinos de Arica. Llevamos a los cerros del puerto la fuerza, el ritmo y la alegría de esta danza del altiplano.',
      'Nuestro nombre, Reales Brillantes, refleja el brillo de los trajes, los cascabeles y la nobleza con que bailamos en cada carnaval y pasacalle.',
    ],
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
   * Uploads an image file to Cloudinary using an unsigned preset and returns its secure URL.
   * Requires CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET to be configured.
   */
  async uploadImage(file: File): Promise<string> {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } = await import('../../cloudinary.config');
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary no está configurado. Completa src/app/cloudinary.config.ts');
    }
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error('Error al subir la imagen a Cloudinary');
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
