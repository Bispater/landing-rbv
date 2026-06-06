import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Evento, DataService, ocurrenciasEvento, fechaPrincipal, esVisible } from '../../core/services/data.service';
import { FechaLargaPipe } from '../../core/util/fecha.pipe';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FechaLargaPipe],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss',
})
export class CalendarioComponent implements OnInit {
  eventos = signal<Evento[]>([]);
  ocurrenciasDe = ocurrenciasEvento;
  fechaPrincipal = fechaPrincipal;
  filtro = signal<string>('todos');
  mesActual = signal(new Date());
  tiposEvento = ['todos', 'evento', 'presentacion', 'ensayo'];

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.listenToList<Evento>('eventos', (data) => {
      this.eventos.set(data.filter(esVisible));
    });
  }

  get eventosFiltrados(): Evento[] {
    if (this.filtro() === 'todos') return this.eventos();
    return this.eventos().filter((e) => e.tipo === this.filtro());
  }

  setFiltro(tipo: string): void {
    this.filtro.set(tipo);
  }

  getNombreMes(): string {
    return this.mesActual().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  }

  prevMes(): void {
    const d = new Date(this.mesActual());
    d.setMonth(d.getMonth() - 1);
    this.mesActual.set(d);
  }

  nextMes(): void {
    const d = new Date(this.mesActual());
    d.setMonth(d.getMonth() + 1);
    this.mesActual.set(d);
  }

  private meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  getMes(fecha: string): string {
    const m = parseInt(fecha.slice(5, 7), 10) - 1;
    return this.meses[m] ?? '';
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      evento: 'Evento', presentacion: 'Presentación', ensayo: 'Ensayo',
    };
    return labels[tipo] || tipo;
  }
}
