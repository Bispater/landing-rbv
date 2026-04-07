import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DataService, Evento, Tutorial, Cancion, Foto } from '../../core/services/data.service';

type Section = 'eventos' | 'tutoriales' | 'playlist' | 'fotos';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  seccionActiva = signal<Section>('eventos');
  eventos = signal<Evento[]>([]);
  tutoriales = signal<Tutorial[]>([]);
  playlist = signal<Cancion[]>([]);
  fotos = signal<Foto[]>([]);

  nuevoEvento: Partial<Evento> = this.emptyEvento();
  nuevoTutorial: Partial<Tutorial> = this.emptyTutorial();
  nuevaCancion: Partial<Cancion> = this.emptyCancion();
  nuevaFoto: Partial<Foto> = this.emptyFoto();

  editandoEvento = signal<Evento | null>(null);
  editandoTutorial = signal<Tutorial | null>(null);
  editandoCancion = signal<Cancion | null>(null);
  editandoFoto = signal<Foto | null>(null);

  mostrarFormEvento = signal(false);
  mostrarFormTutorial = signal(false);
  mostrarFormCancion = signal(false);
  mostrarFormFoto = signal(false);

  guardando = signal(false);
  mensaje = signal('');

  constructor(protected auth: AuthService, private data: DataService, private router: Router) {}

  ngOnInit(): void {
    this.data.listenToRef<Record<string, Evento>>('eventos', (val) => {
      this.eventos.set(val ? Object.entries(val).map(([id, v]) => ({ ...v, id })) : []);
    });
    this.data.listenToRef<Record<string, Tutorial>>('tutoriales', (val) => {
      this.tutoriales.set(val ? Object.entries(val).map(([id, v]) => ({ ...v, id })) : []);
    });
    this.data.listenToRef<Record<string, Cancion>>('playlist', (val) => {
      this.playlist.set(val ? Object.entries(val).map(([id, v]) => ({ ...v, id })) : []);
    });
    this.data.listenToRef<Record<string, Foto>>('fotos', (val) => {
      this.fotos.set(val ? Object.entries(val).map(([id, v]) => ({ ...v, id })) : []);
    });
  }

  setSeccion(s: Section): void { this.seccionActiva.set(s); }

  async agregarEvento(): Promise<void> {
    if (!this.nuevoEvento.titulo || !this.nuevoEvento.fecha) return;
    this.guardando.set(true);
    await this.data.addItem('eventos', this.nuevoEvento);
    this.nuevoEvento = this.emptyEvento();
    this.mostrarMensaje('Evento agregado correctamente');
  }

  async eliminarEvento(id: string): Promise<void> {
    if (confirm('¿Eliminar este evento?')) {
      await this.data.deleteItem(`eventos/${id}`);
      this.mostrarMensaje('Evento eliminado');
    }
  }

  editarEvento(ev: Evento): void {
    this.editandoEvento.set({ ...ev });
  }

  async guardarEdicionEvento(): Promise<void> {
    const ev = this.editandoEvento();
    if (!ev?.id) return;
    this.guardando.set(true);
    const { id, ...data } = ev;
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
    if (confirm('¿Eliminar este tutorial?')) {
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
    if (confirm('¿Eliminar esta canción?')) {
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
    if (!this.nuevaFoto.url || !this.nuevaFoto.titulo) return;
    this.guardando.set(true);
    await this.data.addItem('fotos', this.nuevaFoto);
    this.nuevaFoto = this.emptyFoto();
    this.mostrarMensaje('Foto agregada correctamente');
  }

  async eliminarFoto(id: string): Promise<void> {
    if (confirm('¿Eliminar esta foto?')) {
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

  async cerrarSesion(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/admin/login']);
  }

  private mostrarMensaje(msg: string): void {
    this.guardando.set(false);
    this.mensaje.set(msg);
    setTimeout(() => this.mensaje.set(''), 3000);
  }

  private emptyEvento(): Partial<Evento> {
    return { titulo: '', descripcion: '', fecha: '', hora: '', lugar: '', tipo: 'evento' };
  }
  private emptyTutorial(): Partial<Tutorial> {
    return { titulo: '', descripcion: '', youtubeId: '', nivel: 'principiante', instructor: '' };
  }
  private emptyCancion(): Partial<Cancion> {
    return { titulo: '', artista: '', genero: '', youtubeId: '', duracion: '' };
  }
  private emptyFoto(): Partial<Foto> {
    return { url: '', titulo: '', descripcion: '', fecha: '', categoria: 'general' };
  }
}
