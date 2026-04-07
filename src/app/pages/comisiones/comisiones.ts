import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Comision } from '../../core/services/data.service';

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Comision[]>('assets/data/comisiones.json').subscribe((data) => {
      this.comisiones.set(data);
    });
  }

  setActiva(idx: number): void {
    this.activa.set(idx);
  }
}
