import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  DataService,
  DEFAULT_CONTENIDO,
  Evento,
  Foto,
  Cancion,
  Tutorial,
  Comision,
  Popup,
} from './data.service';

/** Popup de ejemplo (rango amplio para que se vea al sembrar). */
const POPUP_EJEMPLO: Popup[] = [
  {
    titulo: 'Convocatoria 2025 cerrada',
    mensaje: 'Por ahora no estamos recibiendo nuevos integrantes. ¡Déjanos tu correo y te avisaremos cuando abramos la próxima convocatoria!',
    imagen: '',
    enlace: '/contacto',
    textoEnlace: 'Dejar mi correo',
    desde: '2026-01-01',
    hasta: '2026-12-31',
    activo: true,
  },
];

/**
 * Loads the example ("seed") content from the static assets/data JSON files into the
 * Realtime Database, replacing whatever is there. Used once by the admin to populate a
 * fresh database so every page (which now reads from RTDB) has content to show.
 */
@Injectable({ providedIn: 'root' })
export class SeedService {
  constructor(private http: HttpClient, private data: DataService) {}

  async seedAll(): Promise<void> {
    const [eventos, fotos, playlist, tutoriales, comisiones] = await Promise.all([
      firstValueFrom(this.http.get<Evento[]>('assets/data/events.json')),
      firstValueFrom(this.http.get<Foto[]>('assets/data/photos.json')),
      firstValueFrom(this.http.get<Cancion[]>('assets/data/playlist.json')),
      firstValueFrom(this.http.get<Tutorial[]>('assets/data/tutorials.json')),
      firstValueFrom(this.http.get<Comision[]>('assets/data/comisiones.json')),
    ]);

    await Promise.all([
      this.data.seedCollection('eventos', eventos),
      this.data.seedCollection('fotos', fotos),
      this.data.seedCollection('playlist', playlist),
      this.data.seedCollection('tutoriales', tutoriales),
      this.data.seedCollection('comisiones', comisiones),
      this.data.seedCollection('popups', POPUP_EJEMPLO),
      this.data.setItem('contenido', DEFAULT_CONTENIDO),
    ]);
  }
}
