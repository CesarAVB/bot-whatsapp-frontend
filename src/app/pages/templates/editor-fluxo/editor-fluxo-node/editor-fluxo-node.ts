import {
  Component,
  input,
  output,
  computed,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FluxoNodeAtualizado, MensagemNode, TipoNodeAtualizado } from '../../../../shared/models/fluxo-node-updated';

export interface MensagemEditadaEvent {
  chave: string;
  texto: string;
}

@Component({
  selector: 'app-editor-fluxo-node',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flow-node-host' },
  template: `
    <div
      class="flow-node"
      [class]="nodeClass()"
      [class.flow-node--selected]="selected()"
      [class.flow-node--connecting-target]="isConnecting() && !selected()"
    >
      <!-- Header -->
      <div class="flow-node__header">
        <div class="flow-node__type">
          <i [class]="iconClass()"></i>
          <span>{{ typeLabel() }}</span>
        </div>
        @if (!node().ativo) {
          <span class="flow-node__inactive">inativo</span>
        }
      </div>

      <!-- Bubbles de mensagem -->
      <div class="flow-node__body">
        @for (msg of node().mensagens; track msg.chave) {
          <div
            class="flow-node__bubble"
            [class.flow-node__bubble--editing]="msgEmEdicao() === msg.chave"
            (dblclick)="iniciarEdicao(msg, $event)"
            title="Duplo clique para editar"
          >
            @if (msgEmEdicao() === msg.chave) {
              <textarea
                class="flow-node__textarea"
                [value]="textoEdicao()"
                (input)="textoEdicao.set($any($event.target).value)"
                (blur)="salvarEdicao(msg)"
                (keydown.escape)="cancelarEdicao()"
                (keydown.control.enter)="salvarEdicao(msg)"
                (click)="$event.stopPropagation()"
                (mousedown)="$event.stopPropagation()"
                rows="3"
                autofocus
              ></textarea>
              <div class="flow-node__edit-hint">Ctrl+Enter para salvar • Esc para cancelar</div>
            } @else {
              <p class="flow-node__text">{{ truncate(msg.texto, 90) }}</p>
            }
          </div>
        }

        @if (node().mensagens.length === 0) {
          <div class="flow-node__empty">
            <i class="fa-regular fa-comment-dots"></i>
            <span>Sem mensagens</span>
          </div>
        }
      </div>

      <!-- Rodapé visual por tipo -->
      @switch (node().tipo) {
        @case ('MENU') {
          <div class="flow-node__footer flow-node__footer--menu">
            <i class="fa-solid fa-list-ul"></i>
            <span>Menu de opções</span>
          </div>
        }
        @case ('CONFIRMACAO') {
          <div class="flow-node__footer flow-node__footer--confirm">
            <span class="flow-node__pill flow-node__pill--yes">1 Sim</span>
            <span class="flow-node__pill flow-node__pill--no">2 Não</span>
          </div>
        }
        @case ('AGUARDA_INPUT') {
          <div class="flow-node__footer flow-node__footer--input">
            <i class="fa-solid fa-keyboard"></i>
            <span>Aguarda resposta...</span>
          </div>
        }
        @case ('TRANSFERENCIA') {
          <div class="flow-node__footer flow-node__footer--transfer">
            <i class="fa-solid fa-headset"></i>
            <span>{{ node().propriedades?.equipeTransferencia || 'Equipe padrão' }}</span>
          </div>
        }
        @case ('RESULTADO_API') {
          <div class="flow-node__footer flow-node__footer--api">
            <i class="fa-solid fa-plug"></i>
            <span>Chamada API</span>
          </div>
        }
        @case ('ENCERRAMENTO') {
          <div class="flow-node__footer flow-node__footer--end">
            <i class="fa-solid fa-circle-xmark"></i>
            <span>Fim do fluxo</span>
          </div>
        }
      }

      <!-- Porta de saída (output port) -->
      <div
        class="flow-node__port flow-node__port--out"
        (click)="portClick.emit($event)"
        (mousedown)="$event.stopPropagation()"
        title="Clique para conectar"
      >
        <div class="flow-node__port-dot"></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: absolute;
      display: block;
      /* left/top set externally via [style.left.px] / [style.top.px] */
    }

    /* ── Node container ───────────────────────────── */
    .flow-node {
      width: 248px;
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: var(--border-radius-xl);
      overflow: visible;
      position: relative;
      cursor: grab;
      transition: border-color 120ms ease-out, box-shadow 120ms ease-out;
      user-select: none;
      box-shadow: var(--shadow-sm);
    }

    .flow-node:active { cursor: grabbing; }

    .flow-node--selected {
      border-color: var(--color-primary) !important;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.18), var(--shadow);
    }

    .flow-node--connecting-target:hover {
      border-color: var(--color-success);
      box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
      cursor: crosshair;
    }

    /* ── Header ───────────────────────────────────── */
    .flow-node__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--color-border-light);
      border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
      gap: 0.5rem;
    }

    .flow-node__type {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }

    /* Type-specific header colors */
    .flow-node--menu .flow-node__header        { background: rgba(59,130,246,0.1); }
    .flow-node--menu .flow-node__type          { color: var(--color-primary); }

    .flow-node--confirmacao .flow-node__header { background: rgba(245,158,11,0.1); }
    .flow-node--confirmacao .flow-node__type   { color: var(--color-warning); }

    .flow-node--aguarda-input .flow-node__header { background: rgba(139,92,246,0.1); }
    .flow-node--aguarda-input .flow-node__type   { color: var(--color-secondary); }

    .flow-node--transferencia .flow-node__header { background: rgba(239,68,68,0.1); }
    .flow-node--transferencia .flow-node__type   { color: var(--color-danger); }

    .flow-node--resultado-api .flow-node__header { background: rgba(6,182,212,0.1); }
    .flow-node--resultado-api .flow-node__type   { color: var(--color-info); }

    .flow-node--mensagem .flow-node__header    { background: rgba(16,185,129,0.1); }
    .flow-node--mensagem .flow-node__type      { color: var(--color-success); }

    .flow-node--encerramento .flow-node__header { background: rgba(107,114,128,0.1); }
    .flow-node--encerramento .flow-node__type   { color: var(--color-muted); }

    .flow-node__inactive {
      font-size: 0.6rem;
      font-weight: 600;
      color: var(--color-muted);
      background: var(--color-border);
      padding: 0.15rem 0.4rem;
      border-radius: 9999px;
    }

    /* ── Body ─────────────────────────────────────── */
    .flow-node__body {
      padding: 0.5rem 0.625rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      min-height: 52px;
    }

    .flow-node__bubble {
      background: var(--color-bg);
      border: 1px solid var(--color-border-light);
      border-radius: 0.5rem;
      padding: 0.375rem 0.5rem;
      cursor: text;
      transition: border-color 100ms ease-out;
      position: relative;
    }

    .flow-node__bubble:hover { border-color: var(--color-primary); }
    .flow-node__bubble--editing { border-color: var(--color-primary); }

    .flow-node__text {
      margin: 0;
      font-size: 0.76rem;
      line-height: 1.45;
      color: var(--color-text);
      white-space: pre-wrap;
      word-break: break-word;
    }

    .flow-node__textarea {
      width: 100%;
      border: none;
      background: transparent;
      color: var(--color-text);
      font-size: 0.76rem;
      line-height: 1.45;
      padding: 0;
      resize: none;
      outline: none;
      font-family: var(--font-family);
    }

    .flow-node__edit-hint {
      font-size: 0.6rem;
      color: var(--color-subtle);
      margin-top: 0.2rem;
      text-align: right;
    }

    .flow-node__empty {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.72rem;
      color: var(--color-subtle);
      padding: 0.25rem;
    }

    /* ── Footer ───────────────────────────────────── */
    .flow-node__footer {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-top: 1px solid var(--color-border-light);
      font-size: 0.7rem;
      font-weight: 600;
      border-radius: 0 0 var(--border-radius-xl) var(--border-radius-xl);
      background: var(--color-surface-raised);
    }

    .flow-node__footer--menu     { color: var(--color-primary); }
    .flow-node__footer--confirm  { color: var(--color-muted); justify-content: center; gap: 0.5rem; }
    .flow-node__footer--input    { color: var(--color-secondary); }
    .flow-node__footer--transfer { color: var(--color-danger); }
    .flow-node__footer--api      { color: var(--color-info); }
    .flow-node__footer--end      { color: var(--color-muted); }

    .flow-node__pill {
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.65rem;
      font-weight: 700;
    }

    .flow-node__pill--yes { background: var(--color-success-light); color: var(--color-success); }
    .flow-node__pill--no  { background: var(--color-danger-light); color: var(--color-danger); }

    /* ── Output port ──────────────────────────────── */
    .flow-node__port--out {
      position: absolute;
      right: -10px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
      cursor: crosshair;
    }

    .flow-node__port-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--color-surface);
      border: 2px solid var(--color-primary);
      transition: all 120ms ease-out;
      box-shadow: var(--shadow-xs);
    }

    .flow-node__port--out:hover .flow-node__port-dot {
      background: var(--color-primary);
      transform: scale(1.25);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
    }

    @media (prefers-reduced-motion: reduce) {
      * { transition: none !important; }
    }
  `]
})
export class EditorFluxoNodeComponent {
  readonly node = input.required<FluxoNodeAtualizado>();
  readonly selected = input(false);
  readonly isConnecting = input(false);

  readonly portClick = output<MouseEvent>();
  readonly mensagemEditada = output<MensagemEditadaEvent>();

  readonly msgEmEdicao = signal<string | null>(null);
  readonly textoEdicao = signal('');

  readonly nodeClass = computed(() => {
    const tipo = this.node().tipo ?? '';
    const tipoClass = tipo.toLowerCase().replace(/_/g, '-');
    return `flow-node flow-node--${tipoClass}`;
  });

  readonly iconClass = computed(() => {
    const icons: Record<string, string> = {
      [TipoNodeAtualizado.MENU]: 'fa-solid fa-list-ul',
      [TipoNodeAtualizado.CONFIRMACAO]: 'fa-solid fa-circle-check',
      [TipoNodeAtualizado.AGUARDA_INPUT]: 'fa-solid fa-keyboard',
      [TipoNodeAtualizado.TRANSFERENCIA]: 'fa-solid fa-headset',
      [TipoNodeAtualizado.RESULTADO_API]: 'fa-solid fa-plug',
      [TipoNodeAtualizado.MENSAGEM]: 'fa-solid fa-comment-dots',
      [TipoNodeAtualizado.ENCERRAMENTO]: 'fa-solid fa-circle-xmark',
    };
    return icons[this.node().tipo] ?? 'fa-solid fa-circle';
  });

  readonly typeLabel = computed(() => {
    const labels: Record<string, string> = {
      [TipoNodeAtualizado.MENU]: 'Menu',
      [TipoNodeAtualizado.CONFIRMACAO]: 'Confirmação',
      [TipoNodeAtualizado.AGUARDA_INPUT]: 'Aguarda Input',
      [TipoNodeAtualizado.TRANSFERENCIA]: 'Transferência',
      [TipoNodeAtualizado.RESULTADO_API]: 'API',
      [TipoNodeAtualizado.MENSAGEM]: 'Mensagem',
      [TipoNodeAtualizado.ENCERRAMENTO]: 'Encerramento',
    };
    return labels[this.node().tipo] ?? this.node().tipo;
  });

  truncate(text: string, max: number): string {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '…' : text;
  }

  iniciarEdicao(msg: MensagemNode, event: MouseEvent): void {
    event.stopPropagation();
    this.msgEmEdicao.set(msg.chave);
    this.textoEdicao.set(msg.texto);
  }

  salvarEdicao(msg: MensagemNode): void {
    const texto = this.textoEdicao().trim();
    if (texto && texto !== msg.texto) {
      this.mensagemEditada.emit({ chave: msg.chave, texto });
    }
    this.cancelarEdicao();
  }

  cancelarEdicao(): void {
    this.msgEmEdicao.set(null);
    this.textoEdicao.set('');
  }
}
