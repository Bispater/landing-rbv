import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, DocSeccion } from '../../core/services/data.service';

export const REGLAMENTOS_DEFAULT: DocSeccion[] = [
  { icono: 'fa-users', titulo: 'Reglamento de Membresía', contenido: 'Todo integrante deberá asistir al menos al 80% de los ensayos mensuales.\nEl ingreso a la agrupación requiere período de prueba de 3 meses.\nLos miembros deben mantener una conducta respetuosa dentro y fuera de la agrupación.\nLas ausencias deben ser justificadas con anticipación al director artístico.' },
  { icono: 'fa-music', titulo: 'Reglamento de Ensayos', contenido: 'Los ensayos se realizarán según el calendario establecido por la directiva.\nSe debe llegar 10 minutos antes del inicio del ensayo.\nEl uso de instrumentos ajenos requiere autorización previa.\nQueda prohibido el uso de teléfonos celulares durante los ensayos.' },
  { icono: 'fa-star', titulo: 'Reglamento de Presentaciones', contenido: 'La participación en presentaciones es obligatoria salvo causa justificada.\nEl vestuario debe estar limpio y en perfectas condiciones para cada presentación.\nSe debe respetar el horario de concentración indicado por la directiva.\nQueda prohibido el consumo de alcohol antes o durante las presentaciones.' },
  { icono: 'fa-coins', titulo: 'Reglamento Financiero', contenido: 'Las cuotas mensuales deben pagarse dentro de los primeros 5 días del mes.\nLos miembros con 3 meses de mora pierden su derecho a voto en asambleas.\nLos gastos mayores a $50.000 CLP requieren aprobación en asamblea.\nEl tesorero presentará rendición de cuentas en cada asamblea ordinaria.' },
  { icono: 'fa-tshirt', titulo: 'Reglamento de Vestuario', contenido: 'Cada integrante es responsable de mantener en buen estado su vestuario.\nEl vestuario es de propiedad de la agrupación y debe ser devuelto al retirarse.\nLas modificaciones al vestuario deben ser autorizadas por la comisión correspondiente.\nEn caso de pérdida o daño, el integrante deberá cubrir el costo de reposición.' },
];

@Component({
  selector: 'app-reglamentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reglamentos.html',
  styleUrl: './reglamentos.scss',
})
export class ReglamentosComponent implements OnInit {
  reglamentos = signal<DocSeccion[]>(REGLAMENTOS_DEFAULT);

  constructor(private data: DataService) {}

  ngOnInit(): void {
    this.data.listenToList<DocSeccion>('reglamentos', (val) => {
      this.reglamentos.set(val.length ? val : REGLAMENTOS_DEFAULT);
    });
  }

  items(contenido: string): string[] {
    return (contenido || '').split('\n').map((s) => s.trim()).filter(Boolean);
  }
}
