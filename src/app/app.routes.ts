import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent) },
  { path: 'calendario', loadComponent: () => import('./pages/calendario/calendario').then(m => m.CalendarioComponent) },
  { path: 'galeria', loadComponent: () => import('./pages/galeria/galeria').then(m => m.GaleriaComponent) },
  { path: 'eventos', loadComponent: () => import('./pages/eventos/eventos').then(m => m.EventosComponent) },
  { path: 'presentaciones', loadComponent: () => import('./pages/presentaciones/presentaciones').then(m => m.PresentacionesComponent) },
  { path: 'comisiones', loadComponent: () => import('./pages/comisiones/comisiones').then(m => m.ComisionesComponent) },
  { path: 'estatutos', loadComponent: () => import('./pages/estatutos/estatutos').then(m => m.EstatutosComponent) },
  { path: 'reglamentos', loadComponent: () => import('./pages/reglamentos/reglamentos').then(m => m.ReglamentosComponent) },
  { path: 'playlist', loadComponent: () => import('./pages/playlist/playlist').then(m => m.PlaylistComponent) },
  { path: 'tutoriales', loadComponent: () => import('./pages/tutoriales/tutoriales').then(m => m.TutorialesComponent) },
  { path: 'contacto', loadComponent: () => import('./pages/contacto/contacto').then(m => m.ContactoComponent) },
  { path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: 'admin/login', loadComponent: () => import('./admin/login/login').then(m => m.LoginComponent) },
  { path: 'admin/dashboard', loadComponent: () => import('./admin/dashboard/dashboard').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
