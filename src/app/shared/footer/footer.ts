import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {
  year = new Date().getFullYear();

  links = [
    { label: 'Inicio', route: '/' },
    { label: 'Calendario', route: '/calendario' },
    { label: 'Galería', route: '/galeria' },
    { label: 'Presentaciones', route: '/presentaciones' },
    { label: 'Comisiones', route: '/comisiones' },
    { label: 'Playlist', route: '/playlist' },
    { label: 'Tutoriales', route: '/tutoriales' },
  ];
}
