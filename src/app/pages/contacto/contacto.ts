import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Contenido, DEFAULT_CONTENIDO, conContenidoDefaults } from '../../core/services/data.service';
import { SnackbarService } from '../../core/services/snackbar.service';

interface FormularioContacto {
  nombre: string;
  email: string;
  tipo: string;
  mensaje: string;
}

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

  readonly tipos = ['Consulta general', 'Invitación a un evento', 'Quiero sumarme', 'Otro'];
  form: FormularioContacto = { nombre: '', email: '', tipo: this.tipos[0], mensaje: '' };

  constructor(private data: DataService, private snackbar: SnackbarService) {}

  ngOnInit(): void {
    this.data.listenToRef<Contenido>('contenido', (val) => {
      this.contenido = conContenidoDefaults(val);
    });
  }

  async enviar(): Promise<void> {
    if (!this.form.nombre || !this.form.email || !this.form.mensaje) {
      this.snackbar.show('Completa tu nombre, correo y mensaje', 'error');
      return;
    }
    this.enviando.set(true);
    try {
      const { WEB3FORMS_ACCESS_KEY } = await import('../../contacto.config');
      const asunto = `[Web RBV] ${this.form.tipo} — ${this.form.nombre}`;

      if (WEB3FORMS_ACCESS_KEY) {
        // Envío real vía Web3Forms (sin backend).
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            subject: asunto,
            from_name: this.form.nombre,
            email: this.form.email,
            tipo: this.form.tipo,
            message: this.form.mensaje,
          }),
        });
        if (!res.ok) throw new Error('fallo envío');
        this.snackbar.show('¡Mensaje enviado! Te responderemos pronto.');
        this.form = { nombre: '', email: '', tipo: this.tipos[0], mensaje: '' };
      } else {
        // Alternativa sin configuración: abrir el cliente de correo del visitante.
        const cuerpo = `Nombre: ${this.form.nombre}\nCorreo: ${this.form.email}\nTipo: ${this.form.tipo}\n\n${this.form.mensaje}`;
        const url = `mailto:${this.contenido.contacto.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
        window.location.href = url;
        this.snackbar.show('Abrimos tu correo para enviar el mensaje');
      }
    } catch {
      this.snackbar.show('No pudimos enviar el mensaje. Intenta nuevamente.', 'error');
    } finally {
      this.enviando.set(false);
    }
  }
}
