import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FluxoNodeAtualizado, MensagemNode, TipoNodeAtualizado } from '../../../../shared/models/fluxo-node-updated';

@Component({
  selector: 'app-editor-fluxo-node',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div [class]="'editor-node editor-node--' + getTipoClass(node.tipo)" [class.selected]="selected">
      <!-- Header com ícone do tipo -->
      <div class="node-header">
        <i [class]="getIconoPorTipo(node.tipo)"></i>
        <span class="tipo-label">{{ node.tipo }}</span>
      </div>

      <!-- Balões de mensagem -->
      <div class="mensagens-container">
        @for (msg of node.mensagens; track msg.chave) {
          <div
            class="balao-mensagem"
            (dblclick)="iniciarEdicao(msg)"
            [title]="'Duplo clique para editar'"
          >
            @if (msgEmEdicao === msg.chave) {
              <textarea
                class="editor-inline"
                [(ngModel)]="textoEdicao"
                (blur)="salvarEdicao(msg)"
                (keydown.escape)="cancelarEdicao()"
                (keydown.enter)="salvarEdicao(msg)"
                autofocus
              ></textarea>
            } @else {
              <p class="balao-texto">{{ msg.texto }}</p>
            }
          </div>
        }
      </div>

      <!-- Visual específico por tipo -->
      @switch (node.tipo) {
        @case ('MENU') {
          <div class="tipo-visual menu-visual">
            <i class="fa-solid fa-list-ol"></i>
            <span>Menu</span>
          </div>
        }
        @case ('CONFIRMACAO') {
          <div class="tipo-visual confirmacao-visual">
            <button class="btn-opcao btn-sim">1 Sim</button>
            <button class="btn-opcao btn-nao">2 Não</button>
          </div>
        }
        @case ('AGUARDA_INPUT') {
          <div class="tipo-visual input-visual">
            <input type="text" placeholder="Digite sua resposta..." disabled />
          </div>
        }
        @case ('TRANSFERENCIA') {
          <div class="tipo-visual transfer-visual">
            @if (node.propriedades?.equipeTransferencia) {
              <span class="badge">{{ node.propriedades?.equipeTransferencia }}</span>
            }
          </div>
        }
        @case ('RESULTADO_API') {
          <div class="tipo-visual api-visual">
            <i class="fa-solid fa-plug"></i>
            <span>API Call</span>
          </div>
        }
        @case ('ENCERRAMENTO') {
          <div class="tipo-visual fim-visual">
            <i class="fa-solid fa-times"></i>
            <span>Fim</span>
          </div>
        }
      }

      <!-- Footer com ações -->
      <div class="node-footer">
        <small class="info-text">
          @if (node.mensagens.length > 0) {
            {{ node.mensagens.length }} mensagem(ns)
          }
        </small>
        <button class="btn-action" (click)="deletarNode()" title="Deletar nó">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .editor-node {
      position: relative;
      width: 220px;
      min-height: 140px;
      background: var(--color-surface);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      padding: var(--spacing-md);
      gap: var(--spacing-sm);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.2s;
    }

    .editor-node.selected {
      border-color: var(--color-primary);
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
    }

    .editor-node:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    /* Variações por tipo */
    .editor-node--menu {
      border-left: 4px solid #3b82f6;
    }

    .editor-node--confirmacao {
      border-left: 4px solid #f59e0b;
    }

    .editor-node--aguarda-input {
      border-left: 4px solid #8b5cf6;
    }

    .editor-node--transferencia {
      border-left: 4px solid #ef4444;
    }

    .editor-node--resultado-api {
      border-left: 4px solid #06b6d4;
    }

    .editor-node--mensagem {
      border-left: 4px solid #10b981;
    }

    .editor-node--encerramento {
      border-left: 4px solid #6b7280;
    }

    .node-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-bottom: var(--spacing-sm);
      border-bottom: 1px solid var(--color-border);
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--color-primary);
    }

    .node-header i {
      font-size: 1rem;
    }

    .tipo-label {
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .mensagens-container {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .balao-mensagem {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: var(--spacing-sm);
      cursor: pointer;
      transition: all 0.15s;
      position: relative;
      min-height: 40px;
      display: flex;
      align-items: center;
    }

    .balao-mensagem:hover {
      background: var(--color-border);
    }

    .balao-texto {
      margin: 0;
      font-size: 0.75rem;
      line-height: 1.3;
      color: var(--color-text);
      word-break: break-word;
      max-height: 60px;
      overflow: hidden;
    }

    .editor-inline {
      width: 100%;
      padding: var(--spacing-xs);
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-xs);
      background: var(--color-bg);
      color: var(--color-text);
      font-size: 0.75rem;
      resize: vertical;
      min-height: 40px;
      max-height: 100px;
    }

    .tipo-visual {
      padding: var(--spacing-sm);
      border-top: 1px solid var(--color-border);
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      color: var(--color-muted);
    }

    .menu-visual {
      background: rgba(59, 130, 246, 0.1);
    }

    .confirmacao-visual {
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .btn-opcao {
      width: 100%;
      padding: 0.25rem 0.5rem;
      font-size: 0.65rem;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      border-radius: var(--radius-xs);
      cursor: default;
    }

    .btn-sim {
      border-color: var(--color-success);
      color: var(--color-success);
    }

    .btn-nao {
      border-color: var(--color-danger);
      color: var(--color-danger);
    }

    .input-visual input {
      width: 100%;
      padding: var(--spacing-xs);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xs);
      background: var(--color-bg);
      color: var(--color-muted);
      font-size: 0.65rem;
    }

    .transfer-visual {
      background: rgba(239, 68, 68, 0.1);
    }

    .badge {
      background: var(--color-danger);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-xs);
      font-size: 0.65rem;
      font-weight: 600;
    }

    .api-visual {
      background: rgba(6, 182, 212, 0.1);
    }

    .fim-visual {
      background: rgba(107, 114, 128, 0.1);
    }

    .node-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: var(--spacing-sm);
      border-top: 1px solid var(--color-border);
      font-size: 0.65rem;
    }

    .info-text {
      color: var(--color-muted);
    }

    .btn-action {
      width: 24px;
      height: 24px;
      border: none;
      background: var(--color-danger);
      color: white;
      border-radius: var(--radius-xs);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6rem;
      transition: all 0.15s;
    }

    .btn-action:hover {
      background: var(--color-danger-hover);
      transform: scale(1.1);
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        transition: none !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorFluxoNodeComponent {
  @Input() node!: FluxoNodeAtualizado;
  @Input() selected = false;
  @Output() mensagemDuploClique = new EventEmitter<string>();
  @Output() nodoDeletado = new EventEmitter<void>();

  msgEmEdicao: string | null = null;
  textoEdicao = '';

  getTipoClass(tipo: string): string {
    return tipo.toLowerCase().replace(/_/g, '-');
  }

  getIconoPorTipo(tipo: string): string {
    const icones: Record<string, string> = {
      [TipoNodeAtualizado.MENU]: 'fa-solid fa-list-ul',
      [TipoNodeAtualizado.CONFIRMACAO]: 'fa-solid fa-circle-check',
      [TipoNodeAtualizado.AGUARDA_INPUT]: 'fa-solid fa-keyboard',
      [TipoNodeAtualizado.TRANSFERENCIA]: 'fa-solid fa-arrow-right-arrow-left',
      [TipoNodeAtualizado.RESULTADO_API]: 'fa-solid fa-plug',
      [TipoNodeAtualizado.MENSAGEM]: 'fa-solid fa-comment-dots',
      [TipoNodeAtualizado.ENCERRAMENTO]: 'fa-solid fa-times-circle'
    };
    return icones[tipo] || 'fa-solid fa-circle';
  }

  iniciarEdicao(msg: MensagemNode) {
    this.msgEmEdicao = msg.chave;
    this.textoEdicao = msg.texto;
  }

  salvarEdicao(msg: MensagemNode) {
    if (this.textoEdicao.trim()) {
      this.mensagemDuploClique.emit(this.textoEdicao);
    }
    this.cancelarEdicao();
  }

  cancelarEdicao() {
    this.msgEmEdicao = null;
    this.textoEdicao = '';
  }

  deletarNode() {
    const confirmar = confirm('Deletar este nó? As conexões também serão removidas.');
    if (confirmar) {
      this.nodoDeletado.emit();
    }
  }
}
