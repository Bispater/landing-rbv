import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Evento, DataService, ocurrenciasEvento, fechaPrincipal } from '../../core/services/data.service';
import { FechaLargaPipe } from '../../core/util/fecha.pipe';

@Component({
  selector: 'app-presentaciones',
  standalone: true,
  imports: [CommonModule, FechaLargaPipe],
  templateUrl: './presentaciones.html',
  styleUrl: './presentaciones.scss',
})
export class PresentacionesComponent implements OnInit {
  presentaciones = signal<Evento[]>([]);
  ocurrenciasDe = ocurrenciasEvento;
  fechaPrincipal = fechaPrincipal;

  constructor(private data: DataService) {}

  private meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  ngOnInit(): void {
    this.data.listenToList<Evento>('eventos', (data) => {
      this.presentaciones.set(
        data.filter((e) => e.tipo === 'presentacion')
          .sort((a, b) => (fechaPrincipal(a) > fechaPrincipal(b) ? 1 : -1)),
      );
    });
  }

  getMes(fecha: string): string {
    const m = parseInt(fecha.slice(5, 7), 10) - 1;
    return this.meses[m] ?? '';
  }
}
