import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Comision, DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-comisiones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comisiones.html',
  styleUrl: './comisiones.scss',
})
export class ComisionesComponent implements OnInit {
  comisiones = signal<Comision[]>([]);
  activa = signal<number>(0);

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.listenToList<Comision>('comisiones', (data) => {
      this.comisiones.set(data);
    });
  }

  setActiva(idx: number): void {
    this.activa.set(idx);
  }
}
