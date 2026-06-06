import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../core/services/snackbar.service';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (snack.mensaje(); as m) {
      <div class="snackbar" [class.error]="m.tipo === 'error'" (click)="snack.cerrar()">
        <i class="fas" [class.fa-check-circle]="m.tipo === 'ok'" [class.fa-exclamation-circle]="m.tipo === 'error'"></i>
        <span>{{ m.texto }}</span>
      </div>
    }
  `,
  styles: [`
    .snackbar {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9800;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1.4rem;
      background: var(--color-dark, #0A1128);
      color: #fff;
      border-radius: 50px;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.35);
      font-size: 0.92rem;
      font-weight: 500;
      cursor: pointer;
      max-width: calc(100vw - 2rem);
      animation: snackIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border-left: 4px solid var(--color-primary, #1AC4B0);
    }
    .snackbar.error { border-left-color: #ef4444; }
    .snackbar i { color: var(--color-primary, #1AC4B0); font-size: 1.05rem; }
    .snackbar.error i { color: #ef4444; }
    @keyframes snackIn {
      from { opacity: 0; transform: translate(-50%, 16px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `],
})
export class SnackbarComponent {
  constructor(public snack: SnackbarService) {}
}
