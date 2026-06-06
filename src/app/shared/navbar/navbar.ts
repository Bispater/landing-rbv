import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  route?: string;
  children?: { label: string; route: string }[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  menuOpen = signal(false);
  scrolled = signal(false);
  activeDropdown = signal<string | null>(null);

  navItems: NavItem[] = [
    { label: 'Inicio', route: '/' },
    { label: 'Calendario', route: '/calendario' },
    { label: 'Eventos', route: '/eventos' },
    {
      label: 'Nosotros',
      children: [
        { label: 'Galería de Fotos', route: '/galeria' },
        { label: 'Próximas Presentaciones', route: '/presentaciones' },
        { label: 'Comisiones', route: '/comisiones' },
        { label: 'Estatutos', route: '/estatutos' },
        { label: 'Reglamentos', route: '/reglamentos' },
      ],
    },
    { label: 'Playlist', route: '/playlist' },
    { label: 'Tutoriales', route: '/tutoriales' },
    { label: 'Contacto', route: '/contacto' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 20);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
    this.activeDropdown.set(null);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.activeDropdown.set(null);
  }

  toggleDropdown(label: string): void {
    this.activeDropdown.update((v) => (v === label ? null : label));
  }
}
