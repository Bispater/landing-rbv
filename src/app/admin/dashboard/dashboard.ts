import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import {
  DataService,
  Evento,
  Tutorial,
  Cancion,
  Foto,
  Popup,
  Contenido,
  DEFAULT_CONTENIDO,
  conContenidoDefaults,
  youtubeThumb,
  ocurrenciasEvento,
} from '../../core/services/data.service';
import { SeedService } from '../../core/services/seed.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { FechaInputComponent } from '../../shared/fecha-input/fecha-input';
import { FechaLargaPipe } from '../../core/util/fecha.pipe';

type Section = 'eventos' | 'tutoriales' | 'playlist' | 'fotos' | 'popups' | 'contenido';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FechaInputComponent, FechaLargaPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  seccionActiva = signal<Section>('eventos');
  eventos = signal<Evento[]>([]);
  tutoriales = signal<Tutorial[]>([]);
  playlist = signal<Cancion[]>([]);
  fotos = signal<Foto[]>([]);
  popups = signal<Popup[]>([]);

  nuevoEvento: Partial<Evento> = this.emptyEvento();
  nuevoTutorial: Partial<Tutorial> = this.emptyTutorial();
  nuevaCancion: Partial<Cancion> = this.emptyCancion();
  nuevaFoto: Partial<Foto> = this.emptyFoto();
  nuevoPopup: Partial<Popup> = this.emptyPopup();

  editandoEvento = signal<Evento | null>(null);
  editandoTutorial = signal<Tutorial | null>(null);
  editandoCancion = signal<Cancion | null>(null);
  editandoFoto = signal<Foto | null>(null);
  editandoPopup = signal<Popup | null>(null);

  mostrarFormEvento = signal(false);
  mostrarFormTutorial = signal(false);
  mostrarFormCancion = signal(false);
  mostrarFormFoto = signal(false);
  mostrarFormPopup = signal(false);

  ocurrenciasDe = ocurrenciasEvento;

  guardando = signal(false);
  sembrando = signal(false);
  subiendoFoto = signal(false);
  subiendoVideo = signal(false);

  readonly MAX_IMAGEN_MB = 5;
  readonly MAX_VIDEO_MB = 50;

  // Editable site content (hero/about/contact). Starts from defaults until RTDB loads.
  contenido = signal<Contenido>(structuredClone(DEFAULT_CONTENIDO));

  constructor(
    protected auth: AuthService,
    private data: DataService,
    private seed: SeedService,
    private snackbar: SnackbarService,
    private confirm: ConfirmService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.data.listenToList<Evento>('eventos', (v) => this.eventos.set(v));
    this.data.listenToList<Tutorial>('tutoriales', (v) => this.tutoriales.set(v));
    this.data.listenToList<Cancion>('playlist', (v) => this.playlist.set(v));
    this.data.listenToList<Foto>('fotos', (v) => this.fotos.set(v));
    this.data.listenToList<Popup>('popups', (v) => this.popups.set(v));
    this.data.listenToRef<Contenido>('contenido', (val) => {
      this.contenido.set(conContenidoDefaults(val));
    });
  }

  setSeccion(s: Section): void { this.seccionActiva.set(s); }

  /** Image to display for a gallery item in the dashboard (YouTube thumbnail or photo url). */
  fotoThumb(foto: Foto): string {
    return foto.youtubeId ? youtubeThumb(foto.youtubeId) : foto.url;
  }

  async sembrarDatos(): Promise<void> {
    const ok = await this.confirm.ask({
      titulo: 'Cargar datos de ejemplo',
      mensaje: 'Esto reemplazará TODO el contenido actual con los datos de ejemplo. ¿Continuar?',
      confirmar: 'Sí, cargar',
      peligro: true,
    });
    if (!ok) return;
    this.sembrando.set(true);
    try {
      await this.seed.seedAll();
      this.mostrarMensaje('Datos de ejemplo cargados correctamente');
    } catch {
      this.mostrarMensaje('Error al cargar los datos de ejemplo', 'error');
    } finally {
      this.sembrando.set(false);
    }
  }

  /** Uploads a chosen image to Cloudinary and writes the resulting URL into the target foto object. */
  async subirImagen(event: Event, target: Partial<Foto>): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.subiendoFoto.set(true);
    try {
      target.url = await this.data.uploadMedia(file, this.MAX_IMAGEN_MB);
      this.mostrarMensaje('Imagen subida correctamente');
    } catch (e) {
      this.mostrarMensaje(e instanceof Error ? e.message : 'Error al subir la imagen', 'error');
    } finally {
      this.subiendoFoto.set(false);
      input.value = '';
    }
  }

  /** Sube un video de fondo del hero a Cloudinary y lo deja seleccionado como 'archivo'. */
  async subirVideoHero(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.subiendoVideo.set(true);
    try {
      const url = await this.data.uploadMedia(file, this.MAX_VIDEO_MB);
      this.contenido().hero.video.url = url;
      this.contenido().hero.video.tipo = 'archivo';
      this.mostrarMensaje('Video subido. Recuerda Guardar cambios.');
    } catch (e) {
      this.mostrarMensaje(e instanceof Error ? e.message : 'Error al subir el video', 'error');
    } finally {
      this.subiendoVideo.set(false);
      input.value = '';
    }
  }

  async guardarContenido(): Promise<void> {
    this.guardando.set(true);
    await this.data.setItem('contenido', this.contenido());
    this.mostrarMensaje('Contenido del sitio actualizado');
  }

  addFrase(): void { this.contenido().hero.frases.push(''); }
  removeFrase(i: number): void { this.contenido().hero.frases.splice(i, 1); }
  addStat(): void { this.contenido().hero.stats.push({ num: '', label: '' }); }
  removeStat(i: number): void { this.contenido().hero.stats.splice(i, 1); }
  addParrafo(): void { this.contenido().about.parrafos.push(''); }
  removeParrafo(i: number): void { this.contenido().about.parrafos.splice(i, 1); }

  // ---- Fechas múltiples (1 a 4), cada una con su hora ----
  agregarFecha(target: Partial<Evento>): void {
    if (!target.fechas) target.fechas = [];
    if (target.fechas.length < 4) target.fechas.push({ fecha: '', hora: '' });
  }
  quitarFecha(target: Partial<Evento>, i: number): void {
    target.fechas?.splice(i, 1);
    if (target.fechas && target.fechas.length === 0) target.fechas.push({ fecha: '', hora: '' });
  }
  /** Normaliza ocurrencias: quita las sin fecha, ordena y fija `fecha` = la más próxima. null si inválido. */
  private prepararEvento(ev: Partial<Evento>): Partial<Evento> | null {
    const fechas = (ev.fechas ?? [])
      .filter((o) => o && o.fecha)
      .map((o) => ({ fecha: o.fecha, hora: o.hora ?? '' }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (!ev.titulo || fechas.length === 0) return null;
    const { hora, ...resto } = ev;
    return { ...resto, fechas, fecha: fechas[0].fecha };
  }

  async agregarEvento(): Promise<void> {
    const data = this.prepararEvento(this.nuevoEvento);
    if (!data) { this.mostrarMensaje('Agrega un título y al menos una fecha', 'error'); return; }
    this.guardando.set(true);
    await this.data.addItem('eventos', data);
    this.nuevoEvento = this.emptyEvento();
    this.mostrarMensaje('Evento agregado correctamente');
  }

  async eliminarEvento(id: string): Promise<void> {
    if (await this.confirmarEliminacion('¿Eliminar este evento? Esta acción no se puede deshacer.')) {
      await this.data.deleteItem(`eventos/${id}`);
      this.mostrarMensaje('Evento eliminado');
    }
  }

  editarEvento(ev: Evento): void {
    // Normaliza a ocurrencias {fecha,hora} (tolera eventos antiguos con `fecha`/`fechas` string).
    const fechas = ocurrenciasEvento(ev);
    this.editandoEvento.set({ ...ev, fechas: fechas.length ? fechas : [{ fecha: '', hora: '' }] });
  }

  async guardarEdicionEvento(): Promise<void> {
    const ev = this.editandoEvento();
    if (!ev?.id) return;
    const prepared = this.prepararEvento(ev);
    if (!prepared) { this.mostrarMensaje('Agrega un título y al menos una fecha', 'error'); return; }
    this.guardando.set(true);
    const { id, ...data } = prepared as Evento;
    await this.data.updateItem(`eventos/${id}`, data);
    this.editandoEvento.set(null);
    this.mostrarMensaje('Evento actualizado');
  }

  async agregarTutorial(): Promise<void> {
    if (!this.nuevoTutorial.titulo || !this.nuevoTutorial.youtubeId) return;
    this.guardando.set(true);
    await this.data.addItem('tutoriales', this.nuevoTutorial);
    this.nuevoTutorial = this.emptyTutorial();
    this.mostrarMensaje('Tutorial agregado correctamente');
  }

  async eliminarTutorial(id: string): Promise<void> {
    if (await this.confirmarEliminacion('¿Eliminar este tutorial?')) {
      await this.data.deleteItem(`tutoriales/${id}`);
      this.mostrarMensaje('Tutorial eliminado');
    }
  }

  editarTutorial(tut: Tutorial): void {
    this.editandoTutorial.set({ ...tut });
  }

  async guardarEdicionTutorial(): Promise<void> {
    const tut = this.editandoTutorial();
    if (!tut?.id) return;
    this.guardando.set(true);
    const { id, ...data } = tut;
    await this.data.updateItem(`tutoriales/${id}`, data);
    this.editandoTutorial.set(null);
    this.mostrarMensaje('Tutorial actualizado');
  }

  async agregarCancion(): Promise<void> {
    if (!this.nuevaCancion.titulo || !this.nuevaCancion.artista) return;
    this.guardando.set(true);
    await this.data.addItem('playlist', this.nuevaCancion);
    this.nuevaCancion = this.emptyCancion();
    this.mostrarMensaje('Canción agregada correctamente');
  }

  async eliminarCancion(id: string): Promise<void> {
    if (await this.confirmarEliminacion('¿Eliminar esta canción?')) {
      await this.data.deleteItem(`playlist/${id}`);
      this.mostrarMensaje('Canción eliminada');
    }
  }

  editarCancion(c: Cancion): void {
    this.editandoCancion.set({ ...c });
  }

  async guardarEdicionCancion(): Promise<void> {
    const c = this.editandoCancion();
    if (!c?.id) return;
    this.guardando.set(true);
    const { id, ...data } = c;
    await this.data.updateItem(`playlist/${id}`, data);
    this.editandoCancion.set(null);
    this.mostrarMensaje('Canción actualizada');
  }

  async agregarFoto(): Promise<void> {
    if (!this.nuevaFoto.titulo || (!this.nuevaFoto.url && !this.nuevaFoto.youtubeId)) return;
    this.guardando.set(true);
    await this.data.addItem('fotos', this.nuevaFoto);
    this.nuevaFoto = this.emptyFoto();
    this.mostrarMensaje('Foto agregada correctamente');
  }

  async eliminarFoto(id: string): Promise<void> {
    if (await this.confirmarEliminacion('¿Eliminar esta foto?')) {
      await this.data.deleteItem(`fotos/${id}`);
      this.mostrarMensaje('Foto eliminada');
    }
  }

  editarFoto(foto: Foto): void {
    this.editandoFoto.set({ ...foto });
  }

  async guardarEdicionFoto(): Promise<void> {
    const foto = this.editandoFoto();
    if (!foto?.id) return;
    this.guardando.set(true);
    const { id, ...data } = foto;
    await this.data.updateItem(`fotos/${id}`, data);
    this.editandoFoto.set(null);
    this.mostrarMensaje('Foto actualizada');
  }

  // ---- Popups programados ----
  async agregarPopup(): Promise<void> {
    const p = this.nuevoPopup;
    if (!p.titulo || !p.mensaje || !p.desde || !p.hasta) {
      this.mostrarMensaje('Completa título, mensaje y el rango de fechas', 'error');
      return;
    }
    this.guardando.set(true);
    await this.data.addItem('popups', p);
    this.nuevoPopup = this.emptyPopup();
    this.mostrarFormPopup.set(false);
    this.mostrarMensaje('Popup creado correctamente');
  }

  async eliminarPopup(id: string): Promise<void> {
    if (await this.confirmarEliminacion('¿Eliminar este popup?')) {
      await this.data.deleteItem(`popups/${id}`);
      this.mostrarMensaje('Popup eliminado');
    }
  }

  editarPopup(p: Popup): void {
    this.editandoPopup.set({ ...p });
  }

  async guardarEdicionPopup(): Promise<void> {
    const p = this.editandoPopup();
    if (!p?.id) return;
    this.guardando.set(true);
    const { id, ...data } = p;
    await this.data.updateItem(`popups/${id}`, data);
    this.editandoPopup.set(null);
    this.mostrarMensaje('Popup actualizado');
  }

  async togglePopupActivo(p: Popup): Promise<void> {
    if (!p.id) return;
    await this.data.updateItem(`popups/${p.id}`, { activo: !p.activo });
  }

  async cerrarSesion(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/admin/login']);
  }

  private mostrarMensaje(msg: string, tipo: 'ok' | 'error' = 'ok'): void {
    this.guardando.set(false);
    this.snackbar.show(msg, tipo);
  }

  /** Pide confirmación de borrado con el modal propio. */
  private confirmarEliminacion(mensaje: string): Promise<boolean> {
    return this.confirm.ask({ titulo: 'Eliminar', mensaje, confirmar: 'Eliminar', peligro: true });
  }

  /** Alterna la visibilidad de una publicación (mostrar/ocultar) sin eliminarla. */
  async toggleVisible(path: string, item: { id?: string; visible?: boolean }): Promise<void> {
    if (!item.id) return;
    const mostrar = item.visible === false; // si estaba oculto, ahora se muestra
    await this.data.updateItem(`${path}/${item.id}`, { visible: mostrar });
    this.snackbar.show(mostrar ? 'Publicación visible en el sitio' : 'Publicación oculta del sitio');
  }

  private emptyEvento(): Partial<Evento> {
    return { titulo: '', descripcion: '', fecha: '', fechas: [{ fecha: '', hora: '' }], lugar: '', tipo: 'evento', visible: true };
  }
  private emptyPopup(): Partial<Popup> {
    return { titulo: '', mensaje: '', imagen: '', enlace: '', textoEnlace: '', desde: '', hasta: '', activo: true };
  }
  private emptyTutorial(): Partial<Tutorial> {
    return { titulo: '', descripcion: '', youtubeId: '', nivel: 'principiante', instructor: '', visible: true };
  }
  private emptyCancion(): Partial<Cancion> {
    return { titulo: '', artista: '', genero: '', youtubeId: '', duracion: '', visible: true };
  }
  private emptyFoto(): Partial<Foto> {
    return { url: '', youtubeId: '', titulo: '', descripcion: '', fecha: '', categoria: 'general', visible: true };
  }
}
