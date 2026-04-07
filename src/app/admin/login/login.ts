import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { auth } from '../../firebase.config';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  recordarme = true;
  showPassword = signal(false);
  loading = signal(false);
  error = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.authReady.then(loggedIn => {
      if (loggedIn) this.router.navigate(['/admin/dashboard']);
    });
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error.set('Por favor ingresa email y contraseña.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      await setPersistence(auth, this.recordarme ? browserLocalPersistence : browserSessionPersistence);
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/admin/dashboard']);
    } catch (e: unknown) {
      const msg = (e as { code?: string })?.code;
      if (msg === 'auth/user-not-found' || msg === 'auth/wrong-password' || msg === 'auth/invalid-credential') {
        this.error.set('Credenciales incorrectas. Verifica tu email y contraseña.');
      } else {
        this.error.set('Error al iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
