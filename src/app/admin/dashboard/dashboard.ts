import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';
import {
  DataService,
  Evento,
  Tutorial,
  Cancion,
  Foto,
  Popup,
  Mensaje,
  Suscriptor,
  DocSeccion,
  Contenido,
  DEFAULT_CONTENIDO,
  conContenidoDefaults,
  youtubeThumb,
  ocurrenciasEvento,
} from '../../core/services/data.service';
import { ESTATUTOS_DEFAULT } from '../../pages/estatutos/estatutos';
import { REGLAMENTOS_DEFAULT } from '../../pages/reglamentos/reglamentos';
import { SnackbarService } from '../../core/services/snackbar.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { FechaInputComponent } from '../../shared/fecha-input/fecha-input';
import { FechaLargaPipe } from '../../core/util/fecha.pipe';

type Section = 'eventos' | 'tutoriales' | 'playlist' | 'fotos' | 'popups' | 'mensajes' | 'documentos' | 'contenido';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FechaInputComponent, FechaLargaPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  seccionActiva = signal<Section>('eventos');
  eventos = signal<Evento[]>([]);
  tutoriales = signal<Tutorial[]>([]);
  playlist = signal<Cancion[]>([]);
  fotos = signal<Foto[]>([]);
  popups = signal<Popup[]>([]);
  mensajes = signal<Mensaje[]>([]);
  suscriptores = signal<Suscriptor[]>([]);
  estatutos = signal<DocSeccion[]>([]);
  reglamentos = signal<DocSeccion[]>([]);

  nuevoEstatuto: Partial<DocSeccion> = { titulo: '', contenido: '' };
  nuevoReglamento: Partial<DocSeccion> = { titulo: '', contenido: '', icono: 'fa-file-alt' };
  editandoEstatuto = signal<DocSeccion | null>(null);
  editandoReglamento = signal<DocSeccion | null>(null);

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

  // Vista previa de una publicación (cómo la vería un visitante)
  vistaPrevia = signal<{ tipo: 'foto' | 'tutorial' | 'cancion' | 'evento' | 'popup'; item: Foto | Tutorial | Cancion | Evento | Popup } | null>(null);
  previewVideoUrl = signal<SafeResourceUrl | null>(null);
  previewPausado = signal(false);
  readonly PREVIEW_MS = 20000;
  private previewTimer: ReturnType<typeof setTimeout> | null = null;

  guardando = signal(false);
  subiendoFoto = signal(false);
  subiendoVideo = signal(false);
  subiendoPdf = signal(false);

  readonly MAX_IMAGEN_MB = 5;
  readonly MAX_VIDEO_MB = 50;

  // Tiempos del recorte del video del hero, editables como mm:ss o segundos.
  videoInicioTxt = '0';
  videoFinTxt = '0';

  // Editable site content (hero/about/contact). Starts from defaults until RTDB loads.
  contenido = signal<Contenido>(structuredClone(DEFAULT_CONTENIDO));

  constructor(
    protected auth: AuthService,
    private data: DataService,
    private snackbar: SnackbarService,
    private confirm: ConfirmService,
    private sanitizer: DomSanitizer,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.data.listenToList<Evento>('eventos', (v) => this.eventos.set(v));
    this.data.listenToList<Tutorial>('tutoriales', (v) => this.tutoriales.set(v));
    this.data.listenToList<Cancion>('playlist', (v) => this.playlist.set(v));
    this.data.listenToList<Foto>('fotos', (v) => this.fotos.set(v));
    this.data.listenToList<Popup>('popups', (v) => this.popups.set(v));
    this.data.listenToList<Mensaje>('mensajes', (v) =>
      this.mensajes.set(v.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))));
    this.data.listenToList<Suscriptor>('suscriptores', (v) =>
      this.suscriptores.set(v.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))));
    this.data.listenToList<DocSeccion>('estatutos', (v) => this.estatutos.set(v));
    this.data.listenToList<DocSeccion>('reglamentos', (v) => this.reglamentos.set(v));
    this.data.listenToRef<Contenido>('contenido', (val) => {
      this.contenido.set(conContenidoDefaults(val));
      const v = this.contenido().hero.video;
      this.videoInicioTxt = this.segATexto(v.inicio ?? 0);
      this.videoFinTxt = this.segATexto(v.fin ?? 0);
    });
  }

  setSeccion(s: Section): void { this.seccionActiva.set(s); }

  /** Image to display for a gallery item in the dashboard (YouTube thumbnail or photo url). */
  fotoThumb(foto: Foto): string {
    return foto.youtubeId ? youtubeThumb(foto.youtubeId) : foto.url;
  }

  /** Abre la vista previa de una publicación (cómo la vería un visitante al hacer click).
      Se cierra sola a los 4 segundos. */
  abrirPreview(tipo: 'foto' | 'tutorial' | 'cancion' | 'evento' | 'popup', item: Foto | Tutorial | Cancion | Evento | Popup): void {
    this.vistaPrevia.set({ tipo, item });
    const yt = (item as { youtubeId?: string }).youtubeId;
    this.previewVideoUrl.set(
      yt ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${yt}?autoplay=1`) : null,
    );
    document.body.style.overflow = 'hidden';
    this.previewPausado.set(false);
    if (this.previewTimer) clearTimeout(this.previewTimer);
    this.previewTimer = setTimeout(() => this.cerrarPreview(), this.PREVIEW_MS);
  }

  /** Pausa la cuenta regresiva (clic en cualquier lugar, como una historia de IG). */
  pausarPreview(): void {
    if (this.previewPausado()) return;
    if (this.previewTimer) { clearTimeout(this.previewTimer); this.previewTimer = null; }
    this.previewPausado.set(true);
  }

  cerrarPreview(): void {
    if (this.previewTimer) { clearTimeout(this.previewTimer); this.previewTimer = null; }
    this.previewPausado.set(false);
    this.vistaPrevia.set(null);
    this.previewVideoUrl.set(null);
    document.body.style.overflow = '';
  }

  ngOnDestroy(): void {
    if (this.previewTimer) clearTimeout(this.previewTimer);
  }

  /** Helpers de casteo para el template del preview. */
  asFoto(i: unknown): Foto { return i as Foto; }
  asTutorial(i: unknown): Tutorial { return i as Tutorial; }
  asCancion(i: unknown): Cancion { return i as Cancion; }
  asEvento(i: unknown): Evento { return i as Evento; }
  asPopup(i: unknown): Popup { return i as Popup; }

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

  /** Convierte segundos a "m:ss" (0 → "0"). */
  segATexto(n: number): string {
    if (!n || n <= 0) return '0';
    const m = Math.floor(n / 60);
    const s = n % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : String(s);
  }

  /** Convierte "m:ss" o "ss" a segundos (vacío/ inválido → 0). */
  textoASeg(txt: string): number {
    const t = (txt || '').trim();
    if (!t) return 0;
    if (t.includes(':')) {
      const [m, s] = t.split(':');
      const seg = (parseInt(m, 10) || 0) * 60 + (parseInt(s, 10) || 0);
      return seg > 0 ? seg : 0;
    }
    const n = parseInt(t, 10);
    return isNaN(n) || n < 0 ? 0 : n;
  }

  /** Aplica los tiempos escritos (desde/hasta) al modelo del video. */
  aplicarTiempos(): void {
    const v = this.contenido().hero.video;
    v.inicio = this.textoASeg(this.videoInicioTxt);
    v.fin = this.textoASeg(this.videoFinTxt);
    this.videoInicioTxt = this.segATexto(v.inicio);
    this.videoFinTxt = this.segATexto(v.fin);
  }

  /** Si pegan un link de YouTube en el campo del video, extrae el ID de 11 caracteres. */
  normalizarYoutubeId(): void {
    const v = this.contenido().hero.video;
    const val = (v.youtubeId || '').trim();
    const m = val.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/) || val.match(/^([\w-]{11})$/);
    if (m) v.youtubeId = m[1];
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
    try {
      await this.data.addItem('eventos', data);
      this.nuevoEvento = this.emptyEvento();
      this.mostrarMensaje('Evento agregado correctamente');
    } catch (e) { this.avisarError(e); }
  }

  async eliminarEvento(id: string): Promise<void> {
    if (await this.confirmarEliminacion('¿Eliminar este evento? Esta acción no se puede deshacer.')) {
      try {
        await this.data.deleteItem(`eventos/${id}`);
        this.mostrarMensaje('Evento eliminado');
      } catch (e) { this.avisarError(e); }
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
    try {
      await this.data.updateItem(`eventos/${id}`, data);
      this.editandoEvento.set(null);
      this.mostrarMensaje('Evento actualizado');
    } catch (e) { this.avisarError(e); }
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
      try {
        await this.data.deleteItem(`tutoriales/${id}`);
        this.mostrarMensaje('Tutorial eliminado');
      } catch (e) { this.avisarError(e); }
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
      try {
        await this.data.deleteItem(`playlist/${id}`);
        this.mostrarMensaje('Canción eliminada');
      } catch (e) { this.avisarError(e); }
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
      try {
        await this.data.deleteItem(`fotos/${id}`);
        this.mostrarMensaje('Foto eliminada');
      } catch (e) { this.avisarError(e); }
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
      try {
        await this.data.deleteItem(`popups/${id}`);
        this.mostrarMensaje('Popup eliminado');
      } catch (e) { this.avisarError(e); }
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

  async eliminarMensaje(id: string): Promise<void> {
    if (await this.confirmarEliminacion('¿Eliminar este mensaje?')) {
      try {
        await this.data.deleteItem(`mensajes/${id}`);
        this.mostrarMensaje('Mensaje eliminado');
      } catch (e) { this.avisarError(e); }
    }
  }

  async eliminarSuscriptor(id: string): Promise<void> {
    if (await this.confirmarEliminacion('¿Eliminar este suscriptor?')) {
      try {
        await this.data.deleteItem(`suscriptores/${id}`);
        this.mostrarMensaje('Suscriptor eliminado');
      } catch (e) { this.avisarError(e); }
    }
  }

  /** Une todos los correos de suscriptores separados por coma (para copiar y pegar en el correo). */
  correosSuscriptores(): string {
    return this.suscriptores().map((s) => s.email).join(', ');
  }

  /** Correos únicos de quienes enviaron mensajes de contacto. */
  correosMensajes(): string {
    return [...new Set(this.mensajes().map((m) => m.email).filter(Boolean))].join(', ');
  }

  /** mailto para responder a un mensaje puntual. */
  responderUrl(m: Mensaje): string {
    return `mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.tipo || 'tu mensaje'))}`;
  }

  async copiarTexto(texto: string): Promise<void> {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      this.snackbar.show('Correos copiados al portapapeles');
    } catch {
      this.snackbar.show('No se pudo copiar. Selecciónalos manualmente.', 'error');
    }
  }

  // ---- Documentos (estatutos / reglamentos) ----
  private async agregarDoc(path: 'estatutos' | 'reglamentos', item: Partial<DocSeccion>): Promise<boolean> {
    if (!item.titulo || !item.contenido) { this.mostrarMensaje('Completa el título y el contenido', 'error'); return false; }
    this.guardando.set(true);
    try { await this.data.addItem(path, item); this.mostrarMensaje('Sección agregada'); return true; }
    catch (e) { this.avisarError(e); return false; }
  }
  private async guardarDoc(path: 'estatutos' | 'reglamentos', item: DocSeccion): Promise<void> {
    if (!item.id) return;
    this.guardando.set(true);
    const { id, ...data } = item;
    try { await this.data.updateItem(`${path}/${id}`, data); this.mostrarMensaje('Sección actualizada'); }
    catch (e) { this.avisarError(e); }
  }
  private async eliminarDoc(path: 'estatutos' | 'reglamentos', id: string): Promise<void> {
    if (await this.confirmarEliminacion('¿Eliminar esta sección?')) {
      try { await this.data.deleteItem(`${path}/${id}`); this.mostrarMensaje('Sección eliminada'); }
      catch (e) { this.avisarError(e); }
    }
  }
  private async cargarBaseDoc(path: 'estatutos' | 'reglamentos', def: DocSeccion[]): Promise<void> {
    const ok = await this.confirm.ask({ titulo: 'Cargar texto base', mensaje: 'Reemplazará las secciones actuales con el texto base. ¿Continuar?', confirmar: 'Cargar', peligro: true });
    if (!ok) return;
    this.guardando.set(true);
    try { await this.data.seedCollection(path, def); this.mostrarMensaje('Texto base cargado'); }
    catch (e) { this.avisarError(e); }
  }

  async agregarEstatuto(): Promise<void> {
    if (await this.agregarDoc('estatutos', this.nuevoEstatuto)) this.nuevoEstatuto = { titulo: '', contenido: '' };
  }
  async agregarReglamento(): Promise<void> {
    if (await this.agregarDoc('reglamentos', this.nuevoReglamento)) this.nuevoReglamento = { titulo: '', contenido: '', icono: 'fa-file-alt' };
  }
  async guardarEstatuto(): Promise<void> {
    const e = this.editandoEstatuto(); if (!e) return;
    await this.guardarDoc('estatutos', e); this.editandoEstatuto.set(null);
  }
  async guardarReglamento(): Promise<void> {
    const r = this.editandoReglamento(); if (!r) return;
    await this.guardarDoc('reglamentos', r); this.editandoReglamento.set(null);
  }
  eliminarEstatuto(id: string): void { this.eliminarDoc('estatutos', id); }
  eliminarReglamento(id: string): void { this.eliminarDoc('reglamentos', id); }
  cargarBaseEstatutos(): void { this.cargarBaseDoc('estatutos', ESTATUTOS_DEFAULT); }
  cargarBaseReglamentos(): void { this.cargarBaseDoc('reglamentos', REGLAMENTOS_DEFAULT); }

  /** Sube un PDF a Cloudinary y lo guarda en el campo indicado del contenido. */
  async subirPdf(event: Event, campo: 'estatutosPdf' | 'reglamentosPdf'): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.subiendoPdf.set(true);
    try {
      const url = await this.data.uploadMedia(file, 15);
      this.contenido()[campo] = url;
      await this.data.setItem('contenido', this.contenido());
      this.mostrarMensaje('PDF subido y guardado');
    } catch (e) {
      this.mostrarMensaje(e instanceof Error ? e.message : 'Error al subir el PDF', 'error');
    } finally {
      this.subiendoPdf.set(false);
      input.value = '';
    }
  }

  async quitarPdf(campo: 'estatutosPdf' | 'reglamentosPdf'): Promise<void> {
    this.contenido()[campo] = '';
    try {
      await this.data.setItem('contenido', this.contenido());
      this.mostrarMensaje('PDF quitado');
    } catch (e) { this.avisarError(e); }
  }

  async togglePopupActivo(p: Popup): Promise<void> {
    if (!p.id) return;
    try {
      await this.data.updateItem(`popups/${p.id}`, { activo: !p.activo });
    } catch (e) { this.avisarError(e); }
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

  /** Muestra un mensaje claro ante un error de escritura (sesión vencida / permiso denegado). */
  private avisarError(e: unknown): void {
    const m = (e as { message?: string })?.message ?? String(e);
    if (m.includes('PERMISSION_DENIED') || m.includes('Permission denied')) {
      this.mostrarMensaje('Tu sesión expiró. Cierra sesión y vuelve a iniciar para guardar.', 'error');
    } else {
      this.mostrarMensaje('Ocurrió un error al guardar. Intenta nuevamente.', 'error');
    }
  }

  /** Alterna la visibilidad de una publicación (mostrar/ocultar) sin eliminarla. */
  async toggleVisible(path: string, item: { id?: string; visible?: boolean }): Promise<void> {
    if (!item.id) return;
    const mostrar = item.visible === false; // si estaba oculto, ahora se muestra
    try {
      await this.data.updateItem(`${path}/${item.id}`, { visible: mostrar });
      this.snackbar.show(mostrar ? 'Publicación visible en el sitio' : 'Publicación oculta del sitio');
    } catch (e) {
      this.avisarError(e);
    }
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
