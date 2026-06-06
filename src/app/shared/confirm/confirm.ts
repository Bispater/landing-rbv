import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (confirm.opciones(); as o) {
      <div class="confirm-overlay" (click)="confirm.responder(false)">
        <div class="confirm-card" (click)="$event.stopPropagation()">
          <div class="confirm-icon" [class.peligro]="o.peligro">
            <i class="fas" [class.fa-exclamation-triangle]="o.peligro" [class.fa-question-circle]="!o.peligro"></i>
          </div>
          <h3>{{ o.titulo || 'Confirmar acción' }}</h3>
          <p>{{ o.mensaje }}</p>
          <div class="confirm-actions">
            <button class="confirm-cancel" (click)="confirm.responder(false)">
              {{ o.cancelar || 'Cancelar' }}
            </button>
            <button class="confirm-ok" [class.peligro]="o.peligro" (click)="confirm.responder(true)">
              {{ o.confirmar || 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      inset: 0;
      z-index: 9700;
      background: rgba(10, 17, 40, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: cFade 0.2s ease;
    }
    .confirm-card {
      width: 100%;
      max-width: 400px;
      background: #fff;
      border-radius: var(--radius-lg, 16px);
      padding: 2rem 1.75rem 1.5rem;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
      animation: cPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .confirm-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 1rem;
      border-radius: 50%;
      background: rgba(26, 196, 176, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: var(--color-primary, #1AC4B0);
    }
    .confirm-icon.peligro { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
    .confirm-card h3 {
      font-family: var(--font-heading, serif);
      font-size: 1.25rem;
      color: var(--color-primary-dark, #0E9B8A);
      margin-bottom: 0.5rem;
    }
    .confirm-card p { color: var(--color-text-light, #555); line-height: 1.55; font-size: 0.95rem; margin-bottom: 1.5rem; }
    .confirm-actions { display: flex; gap: 0.75rem; }
    .confirm-actions button {
      flex: 1;
      padding: 0.7rem 1rem;
      border-radius: var(--radius-sm, 8px);
      font-weight: 600;
      font-size: 0.92rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }
    .confirm-cancel {
      background: #f1f3f7;
      color: var(--color-text, #333);
      &:hover { background: #e5e8ef; }
    }
    .confirm-ok {
      background: var(--color-primary, #1AC4B0);
      color: #fff;
      &:hover { filter: brightness(0.95); }
      &.peligro { background: #ef4444; }
    }
    @keyframes cFade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cPop {
      from { opacity: 0; transform: translateY(16px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `],
})
export class ConfirmComponent {
  constructor(public confirm: ConfirmService) {}
}
