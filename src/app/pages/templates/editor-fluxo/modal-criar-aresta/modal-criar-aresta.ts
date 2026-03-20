import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FluxoNodeAtualizado } from '../../../../shared/models/fluxo-node-updated';

@Component({
  selector: 'app-modal-criar-aresta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible) {
      <div class="modal-overlay" (click)="onCancelar()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Nova Conexão</h3>
            <button class="btn-close" (click)="onCancelar()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          @if (nodeOrigem && nodeDestino) {
            <div class="modal-body">
              <div class="nodes-info">
                <div class="node-info">
                  <span class="label">De:</span>
                  <span class="value">{{ nodeOrigem.tipo }}</span>
                </div>
                <i class="fa-solid fa-arrow-right"></i>
                <div class="node-info">
                  <span class="label">Para:</span>
                  <span class="value">{{ nodeDestino.tipo }}</span>
                </div>
              </div>

              <div class="form-group">
                <label>Condição (opcional)</label>
                <select [(ngModel)]="condicao" class="form-control">
                  <option value="">Sem condição</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="cpf_valido">CPF Válido</option>
                  <option value="fora_horario">Fora do Horário</option>
                  <option value="auto">Automático</option>
                </select>
              </div>

              <div class="form-group">
                <label>Label (opcional)</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="label"
                  placeholder="Ex: Resposta do usuário"
                />
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="onCancelar()">
                Cancelar
              </button>
              <button class="btn btn-primary" (click)="onConfirmar()">
                <i class="fa-solid fa-check me-1"></i>
                Criar Conexão
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-content {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--color-border);
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.125rem;
      color: var(--color-text);
    }

    .btn-close {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: var(--color-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      transition: all 0.2s;
    }

    .btn-close:hover {
      background: var(--color-border);
      color: var(--color-text);
    }

    .modal-body {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .nodes-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md);
      background: var(--color-bg);
      border-radius: var(--radius-md);
      gap: var(--spacing-md);
    }

    .node-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      flex: 1;
      text-align: center;
    }

    .node-info .label {
      font-size: 0.75rem;
      color: var(--color-muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .node-info .value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-primary);
    }

    .nodes-info i {
      color: var(--color-muted);
      font-size: 0.875rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .form-control {
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg);
      color: var(--color-text);
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-sm);
      padding: var(--spacing-lg);
      border-top: 1px solid var(--color-border);
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation: none !important;
        transition: none !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalCriarArestaComponent {
  @Input() visible = false;
  @Input() nodeOrigem: FluxoNodeAtualizado | null = null;
  @Input() nodeDestino: FluxoNodeAtualizado | null = null;
  @Output() confirmar = new EventEmitter<{ condicao?: string; label?: string }>();
  @Output() cancelar = new EventEmitter<void>();

  condicao = '';
  label = '';

  onConfirmar() {
    this.confirmar.emit({
      condicao: this.condicao || undefined,
      label: this.label || undefined
    });
    this.resetForm();
  }

  onCancelar() {
    this.resetForm();
    this.cancelar.emit();
  }

  private resetForm() {
    this.condicao = '';
    this.label = '';
  }
}
