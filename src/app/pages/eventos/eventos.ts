import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Evento } from '../../core/services/data.service';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eventos.html',
  styleUrl: './eventos.scss',
})
export class EventosComponent implements OnInit {
  eventos = signal<Evento[]>([]);

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.listenToRef<Record<string, Evento>>('eventos', (val) => {
      const all = val ? Object.entries(val).map(([id, v]) => ({ ...v, id })) : [];
      this.eventos.set(all.filter((e) => e.tipo === 'evento'));
    });
  }
}
