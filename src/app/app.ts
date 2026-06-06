import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar';
import { FooterComponent } from './shared/footer/footer';
import { PopupComponent } from './shared/popup/popup';
import { SnackbarComponent } from './shared/snackbar/snackbar';
import { ConfirmComponent } from './shared/confirm/confirm';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, PopupComponent, SnackbarComponent, ConfirmComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private router = inject(Router);

  isAdminRoute = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).url.startsWith('/admin')),
      startWith(this.router.url.startsWith('/admin'))
    ),
    { initialValue: this.router.url.startsWith('/admin') }
  );
}
