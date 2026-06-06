import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Contenido, DEFAULT_CONTENIDO, conContenidoDefaults } from '../../core/services/data.service';
import { SnackbarService } from '../../core/services/snackbar.service';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacto.html',
  styleUrl: './contacto.scss',
})
export class ContactoComponent implements OnInit {
  contenido: Contenido = structuredClone(DEFAULT_CONTENIDO);
  enviando = signal(false);
  suscribiendo = signal(false);

  readonly tipos = ['Consulta general', 'Invitación a un evento', 'Quiero sumarme', 'Otro'];
  form = { nombre: '', email: '', tipo: this.tipos[0], mensaje: '' };

  readonly intereses = ['Convocatoria (cuándo abren las postulaciones)', 'Eventos y presentaciones', 'Todo'];
  suscripcion = { email: '', interes: this.intereses[2] };

  constructor(private data: DataService, private snackbar: SnackbarService) {}

  ngOnInit(): void {
    this.data.listenToRef<Contenido>('contenido', (val) => {
      this.contenido = conContenidoDefaults(val);
    });
  }

  private emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async enviar(): Promise<void> {
    if (!this.form.nombre || !this.emailValido(this.form.email) || !this.form.mensaje) {
      this.snackbar.show('Completa tu nombre, un correo válido y el mensaje', 'error');
      return;
    }
    this.enviando.set(true);
    try {
      await this.data.addItem('mensajes', { ...this.form, fecha: new Date().toISOString() });
      this.snackbar.show('¡Mensaje enviado! Te responderemos pronto.');
      this.form = { nombre: '', email: '', tipo: this.tipos[0], mensaje: '' };
    } catch {
      this.snackbar.show('No pudimos enviar el mensaje. Intenta nuevamente.', 'error');
    } finally {
      this.enviando.set(false);
    }
  }

  async suscribir(): Promise<void> {
    if (!this.emailValido(this.suscripcion.email)) {
      this.snackbar.show('Ingresa un correo válido', 'error');
      return;
    }
    this.suscribiendo.set(true);
    try {
      await this.data.addItem('suscriptores', { ...this.suscripcion, fecha: new Date().toISOString() });
      this.snackbar.show('¡Listo! Te avisaremos por correo.');
      this.suscripcion = { email: '', interes: this.intereses[2] };
    } catch {
      this.snackbar.show('No pudimos registrar tu correo. Intenta nuevamente.', 'error');
    } finally {
      this.suscribiendo.set(false);
    }
  }
}
