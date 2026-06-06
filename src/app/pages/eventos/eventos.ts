import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Evento, ocurrenciasEvento, fechaPrincipal, esVisible } from '../../core/services/data.service';
import { FechaLargaPipe } from '../../core/util/fecha.pipe';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, FechaLargaPipe],
  templateUrl: './eventos.html',
  styleUrl: './eventos.scss',
})
export class EventosComponent implements OnInit {
  eventos = signal<Evento[]>([]);
  ocurrenciasDe = ocurrenciasEvento;

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.listenToList<Evento>('eventos', (all) => {
      this.eventos.set(
        all.filter((e) => e.tipo === 'evento' && esVisible(e))
          .sort((a, b) => (fechaPrincipal(a) > fechaPrincipal(b) ? 1 : -1)),
      );
    });
  }
}
