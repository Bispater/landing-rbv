import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reglamentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reglamentos.html',
  styleUrl: './reglamentos.scss',
})
export class ReglamentosComponent {
  reglamentos = [
    {
      icono: 'fa-users',
      titulo: 'Reglamento de Membresía',
      items: [
        'Todo integrante deberá asistir al menos al 80% de los ensayos mensuales.',
        'El ingreso a la agrupación requiere período de prueba de 3 meses.',
        'Los miembros deben mantener una conducta respetuosa dentro y fuera de la agrupación.',
        'Las ausencias deben ser justificadas con anticipación al director artístico.',
      ],
    },
    {
      icono: 'fa-music',
      titulo: 'Reglamento de Ensayos',
      items: [
        'Los ensayos se realizarán según el calendario establecido por la directiva.',
        'Se debe llegar 10 minutos antes del inicio del ensayo.',
        'El uso de instrumentos ajenos requiere autorización previa.',
        'Queda prohibido el uso de teléfonos celulares durante los ensayos.',
      ],
    },
    {
      icono: 'fa-star',
      titulo: 'Reglamento de Presentaciones',
      items: [
        'La participación en presentaciones es obligatoria salvo causa justificada.',
        'El vestuario debe estar limpio y en perfectas condiciones para cada presentación.',
        'Se debe respetar el horario de concentración indicado por la directiva.',
        'Queda prohibido el consumo de alcohol antes o durante las presentaciones.',
      ],
    },
    {
      icono: 'fa-coins',
      titulo: 'Reglamento Financiero',
      items: [
        'Las cuotas mensuales deben pagarse dentro de los primeros 5 días del mes.',
        'Los miembros con 3 meses de mora pierden su derecho a voto en asambleas.',
        'Los gastos mayores a $50.000 CLP requieren aprobación en asamblea.',
        'El tesorero presentará rendición de cuentas en cada asamblea ordinaria.',
      ],
    },
    {
      icono: 'fa-tshirt',
      titulo: 'Reglamento de Vestuario',
      items: [
        'Cada integrante es responsable de mantener en buen estado su vestuario.',
        'El vestuario es de propiedad de la agrupación y debe ser devuelto al retirarse.',
        'Las modificaciones al vestuario deben ser autorizadas por la comisión correspondiente.',
        'En caso de pérdida o daño, el integrante deberá cubrir el costo de reposición.',
      ],
    },
  ];
}
