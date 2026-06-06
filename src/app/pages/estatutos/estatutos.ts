import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, DocSeccion } from '../../core/services/data.service';

export const ESTATUTOS_DEFAULT: DocSeccion[] = [
  { titulo: 'Artículo 1 – Nombre y Domicilio', contenido: 'La agrupación se denominará "Reales Brillantes Valparaíso" y tendrá su domicilio en la ciudad de Valparaíso, Región de Valparaíso, República de Chile.' },
  { titulo: 'Artículo 2 – Naturaleza y Duración', contenido: 'La agrupación es una entidad cultural sin fines de lucro, de duración indefinida, dedicada a la promoción y difusión de la música y danza andina.' },
  { titulo: 'Artículo 3 – Objetivos', contenido: 'Son objetivos de la agrupación: preservar y difundir el patrimonio cultural andino, fomentar la integración comunitaria a través del arte, formar nuevas generaciones en el folclore andino y participar en festivales y eventos culturales.' },
  { titulo: 'Artículo 4 – Membresía', contenido: 'Podrá ser miembro de la agrupación toda persona mayor de 12 años que comparta los valores culturales y artísticos de la organización, previo cumplimiento del proceso de ingreso establecido por la directiva.' },
  { titulo: 'Artículo 5 – Directiva', contenido: 'La agrupación será dirigida por una directiva compuesta por: Presidente, Vicepresidente, Secretario, Tesorero y los directores de comisiones. La directiva será elegida democráticamente cada dos años.' },
  { titulo: 'Artículo 6 – Patrimonio', contenido: 'El patrimonio de la agrupación estará formado por las cuotas de sus miembros, donaciones, aportes de instituciones públicas o privadas, y los ingresos obtenidos por actividades propias de la organización.' },
  { titulo: 'Artículo 7 – Asambleas', contenido: 'La asamblea ordinaria se realizará al menos dos veces al año. Las asambleas extraordinarias podrán ser convocadas por la directiva o por el 20% de los miembros activos.' },
  { titulo: 'Artículo 8 – Modificación de Estatutos', contenido: 'Los presentes estatutos podrán ser modificados en asamblea extraordinaria convocada para tal efecto, con el voto favorable de al menos dos tercios de los miembros activos presentes.' },
];

@Component({
  selector: 'app-estatutos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estatutos.html',
  styleUrl: './estatutos.scss',
})
export class EstatutosComponent implements OnInit {
  secciones = signal<DocSeccion[]>(ESTATUTOS_DEFAULT);

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.listenToList<DocSeccion>('estatutos', (val) => {
      this.secciones.set(val.length ? val : ESTATUTOS_DEFAULT);
    });
  }
}
