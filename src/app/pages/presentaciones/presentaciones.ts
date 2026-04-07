import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Evento } from '../../core/services/data.service';

@Component({
  selector: 'app-presentaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './presentaciones.html',
  styleUrl: './presentaciones.scss',
})
export class PresentacionesComponent implements OnInit {
  presentaciones = signal<Evento[]>([]);

  constructor(private http: HttpClient) {}

  private meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  ngOnInit(): void {
    this.http.get<Evento[]>('assets/data/events.json').subscribe((data) => {
      this.presentaciones.set(data.filter((e) => e.tipo === 'presentacion'));
    });
  }

  getMes(fecha: string): string {
    const m = parseInt(fecha.slice(5, 7), 10) - 1;
    return this.meses[m] ?? '';
  }
}
