import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Contenido, DEFAULT_CONTENIDO, DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent implements OnInit {
  year = new Date().getFullYear();
  contacto = DEFAULT_CONTENIDO.contacto;

  links = [
    { label: 'Inicio', route: '/' },
    { label: 'Calendario', route: '/calendario' },
    { label: 'Galería', route: '/galeria' },
    { label: 'Presentaciones', route: '/presentaciones' },
    { label: 'Comisiones', route: '/comisiones' },
    { label: 'Playlist', route: '/playlist' },
    { label: 'Tutoriales', route: '/tutoriales' },
  ];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.listenToRef<Contenido>('contenido', (val) => {
      if (val?.contacto) this.contacto = { ...DEFAULT_CONTENIDO.contacto, ...val.contacto };
    });
  }
}
