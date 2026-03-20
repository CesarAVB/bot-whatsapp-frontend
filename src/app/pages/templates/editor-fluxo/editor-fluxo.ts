import {
  Component,
  OnInit,
  ViewChild,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FluxoService } from '../../../services/fluxo.service';
import { AlertService } from '../../../services/alert';
import {
  FluxoBotCompletoResponse,
  FluxoNodeAtualizado,
  FluxoAresta,
  TipoNodeAtualizado
} from '../../../shared/models/fluxo-node-updated';
import { EditorFluxoCanvasComponent } from './editor-fluxo-canvas/editor-fluxo-canvas';
import { ModalCriarArestaComponent } from './modal-criar-aresta/modal-criar-aresta';
import { MensagemEditadaEvent } from './editor-fluxo-node/editor-fluxo-node';

// Tipos de nó disponíveis na palette
const PALETTE_NODES = [
  { tipo: TipoNodeAtualizado.MENU,        label: 'Menu',          icon: 'fa-solid fa-list-ul',               color: '#3b82f6' },
  { tipo: TipoNodeAtualizado.MENSAGEM,    label: 'Mensagem',      icon: 'fa-solid fa-comment-dots',          color: '#10b981' },
  { tipo: TipoNodeAtualizado.AGUARDA_INPUT, label: 'Input',       icon: 'fa-solid fa-keyboard',              color: '#8b5cf6' },
  { tipo: TipoNodeAtualizado.CONFIRMACAO, label: 'Confirmação',   icon: 'fa-solid fa-circle-check',          color: '#f59e0b' },
  { tipo: TipoNodeAtualizado.RESULTADO_API, label: 'API',         icon: 'fa-solid fa-plug',                  color: '#06b6d4' },
  { tipo: TipoNodeAtualizado.TRANSFERENCIA, label: 'Transferência', icon: 'fa-solid fa-headset',            color: '#ef4444' },
  { tipo: TipoNodeAtualizado.ENCERRAMENTO, label: 'Encerramento', icon: 'fa-solid fa-circle-xmark',         color: '#6b7280' },
];

@Component({
  selector: 'app-editor-fluxo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditorFluxoCanvasComponent, ModalCriarArestaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="editor-root">

      <!-- ── Toolbar ───────────────────────────────── -->
      <header class="editor-toolbar">
        <div class="editor-toolbar__left">
          <a routerLink="/dashboard" class="editor-back">
            <i class="fa-solid fa-chevron-left"></i>
          </a>
          <div class="editor-toolbar__title">
            <i class="fa-solid fa-diagram-project"></i>
            <span>Editor de Fluxo</span>
            @if (fluxoData()) {
              <span class="editor-toolbar__badge">
                {{ fluxoData()!.nodes.length }} nós &nbsp;·&nbsp; {{ fluxoData()!.arestas.length }} conexões
              </span>
            }
          </div>
        </div>

        <div class="editor-toolbar__right">
          <button class="editor-btn editor-btn--ghost" (click)="recarregar()" [disabled]="carregando()">
            <i class="fa-solid fa-rotate-right" [class.fa-spin]="carregando()"></i>
            Recarregar
          </button>
          <button class="editor-btn editor-btn--ghost" (click)="fitView()">
            <i class="fa-solid fa-compress-arrows-alt"></i>
            Centralizar
          </button>
          <button class="editor-btn editor-btn--primary" (click)="salvarPosicoes()" [disabled]="carregando()">
            <i class="fa-solid fa-floppy-disk"></i>
            Salvar Layout
          </button>
        </div>
      </header>

      <!-- ── Body ─────────────────────────────────── -->
      <div class="editor-body">

        <!-- Palette (left) -->
        <aside class="editor-palette">
          <div class="editor-palette__title">Adicionar nó</div>
          @for (item of palette; track item.tipo) {
            <button
              class="palette-item"
              [style.--item-color]="item.color"
              (click)="adicionarNode(item.tipo)"
              [title]="'Adicionar ' + item.label"
            >
              <span class="palette-item__icon">
                <i [class]="item.icon"></i>
              </span>
              <span class="palette-item__label">{{ item.label }}</span>
            </button>
          }
        </aside>

        <!-- Canvas -->
        <main class="editor-canvas-area">
          @if (fluxoData(); as fluxo) {
            <app-editor-fluxo-canvas
              #canvasRef
              [nodes]="fluxo.nodes"
              [arestas]="fluxo.arestas"
              [selectedId]="selectedNodeId()"
              (nodePositionChanged)="onNodePositionChanged($any($event))"
              (mensagemEditada)="onMensagemEditada($any($event))"
              (arestaClicked)="onArestaClicked($event)"
              (connectRequest)="onConnectRequest($any($event))"
              (nodeSelected)="onNodeSelected($event)"
            />
          } @else {
            <div class="editor-loading">
              <div class="editor-spinner"></div>
              <p>Carregando fluxo...</p>
            </div>
          }
        </main>

        <!-- Properties panel (right, animated) -->
        <aside class="editor-panel" [class.editor-panel--open]="selectedNode()">
          @if (selectedNode(); as node) {
            <div class="editor-panel__header">
              <div class="editor-panel__type">
                <i [class]="getNodeIcon(node.tipo)"></i>
                <span>{{ getNodeLabel(node.tipo) }}</span>
              </div>
              <button class="editor-panel__close" (click)="deselect()">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div class="editor-panel__body">
              <!-- Node info -->
              <div class="panel-field">
                <label class="panel-label">ID</label>
                <code class="panel-id">{{ node.id }}</code>
              </div>

              <div class="panel-field">
                <label class="panel-label">Status</label>
                <span class="panel-badge" [class.panel-badge--on]="node.ativo" [class.panel-badge--off]="!node.ativo">
                  {{ node.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </div>

              @if (node.propriedades?.equipeTransferencia) {
                <div class="panel-field">
                  <label class="panel-label">Equipe</label>
                  <span>{{ node.propriedades!.equipeTransferencia }}</span>
                </div>
              }

              <!-- Mensagens -->
              <div class="panel-section-title">
                <i class="fa-solid fa-comment-dots"></i>
                Mensagens
                <span class="panel-section-count">{{ node.mensagens.length }}</span>
              </div>

              @for (msg of node.mensagens; track msg.chave) {
                <div class="panel-msg">
                  <div class="panel-msg__header">
                    <code class="panel-msg__key">{{ msg.chave }}</code>
                    <span class="panel-msg__order">#{{ msg.ordem }}</span>
                  </div>
                  @if (panelEditando() === msg.chave) {
                    <textarea
                      class="panel-msg__textarea"
                      [value]="panelTexto()"
                      (input)="onPanelInput($event)"
                      rows="5"
                    ></textarea>
                    <div class="panel-msg__actions">
                      <button class="editor-btn editor-btn--sm editor-btn--primary" (click)="salvarPanelEdit(msg, node)">
                        <i class="fa-solid fa-check"></i> Salvar
                      </button>
                      <button class="editor-btn editor-btn--sm editor-btn--ghost" (click)="cancelarPanelEdit()">
                        Cancelar
                      </button>
                    </div>
                  } @else {
                    <pre class="panel-msg__text">{{ msg.texto }}</pre>
                    <button class="panel-msg__edit-btn" (click)="iniciarPanelEdit(msg.chave, msg.texto)">
                      <i class="fa-solid fa-pen"></i> Editar
                    </button>
                  }
                </div>
              }

              @if (node.mensagens.length === 0) {
                <p class="panel-empty">Nenhuma mensagem neste nó.</p>
              }
            </div>

            <!-- Panel footer -->
            <div class="editor-panel__footer">
              <button class="editor-btn editor-btn--danger editor-btn--sm" (click)="deletarNode(node.id)">
                <i class="fa-solid fa-trash"></i> Deletar nó
              </button>
            </div>
          }

          @if (!selectedNode()) {
            <div class="editor-panel__empty">
              <i class="fa-solid fa-hand-pointer"></i>
              <p>Selecione um nó para ver suas propriedades</p>
            </div>
          }
        </aside>
      </div>

      <!-- Modal criar aresta -->
      <app-modal-criar-aresta
        [visible]="modalArestaVisivel()"
        [nodeOrigem]="nodeOrigem()"
        [nodeDestino]="nodeDestino()"
        (confirmar)="onConfirmarAresta($any($event))"
        (cancelar)="fecharModal()"
      />
    </div>
  `,
  styles: [`
    /* ── Root layout ──────────────────────────────── */
    .editor-root {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: var(--color-bg);
    }

    /* ── Toolbar ──────────────────────────────────── */
    .editor-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1rem;
      height: 52px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
      gap: 1rem;
      z-index: 100;
      box-shadow: var(--shadow-xs);
    }

    .editor-toolbar__left,
    .editor-toolbar__right {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .editor-back {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-muted);
      text-decoration: none;
      border: 1px solid var(--color-border);
      background: var(--color-bg);
      font-size: 0.8rem;
      transition: all 100ms ease-out;
      flex-shrink: 0;
    }

    .editor-back:hover {
      color: var(--color-primary);
      border-color: var(--color-primary);
      background: var(--color-primary-light);
    }

    .editor-toolbar__title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--color-text);
    }

    .editor-toolbar__title i { color: var(--color-primary); }

    .editor-toolbar__badge {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--color-muted);
      background: var(--color-border-light);
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }

    /* ── Shared button styles ─────────────────────── */
    .editor-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      border: none;
      border-radius: var(--border-radius);
      font-family: var(--font-family);
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.4rem 0.75rem;
      cursor: pointer;
      transition: all 100ms ease-out;
      white-space: nowrap;
    }

    .editor-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .editor-btn--primary {
      background: var(--color-primary);
      color: white;
    }
    .editor-btn--primary:hover:not(:disabled) {
      background: var(--color-primary-hover);
      transform: translateY(-1px);
    }

    .editor-btn--ghost {
      background: transparent;
      color: var(--color-muted);
      border: 1px solid var(--color-border);
    }
    .editor-btn--ghost:hover:not(:disabled) {
      background: var(--color-surface-raised);
      color: var(--color-text);
    }

    .editor-btn--danger {
      background: var(--color-danger-light);
      color: var(--color-danger);
      border: 1px solid var(--color-danger);
    }
    .editor-btn--danger:hover:not(:disabled) {
      background: var(--color-danger);
      color: white;
    }

    .editor-btn--sm { font-size: 0.7rem; padding: 0.3rem 0.6rem; }

    /* ── Body ─────────────────────────────────────── */
    .editor-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── Palette ──────────────────────────────────── */
    .editor-palette {
      width: 96px;
      flex-shrink: 0;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem 0.5rem;
      gap: 0.375rem;
      overflow-y: auto;
    }

    .editor-palette__title {
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-subtle);
      margin-bottom: 0.25rem;
      text-align: center;
    }

    .palette-item {
      width: 72px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      padding: 0.5rem 0.25rem;
      border: 1.5px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      background: var(--color-surface);
      cursor: pointer;
      transition: all 120ms ease-out;
      font-family: var(--font-family);
    }

    .palette-item:hover {
      border-color: var(--item-color, var(--color-primary));
      background: color-mix(in srgb, var(--item-color, var(--color-primary)) 8%, transparent);
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .palette-item__icon {
      width: 32px;
      height: 32px;
      border-radius: var(--border-radius);
      background: color-mix(in srgb, var(--item-color, var(--color-primary)) 12%, transparent);
      color: var(--item-color, var(--color-primary));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }

    .palette-item__label {
      font-size: 0.62rem;
      font-weight: 600;
      color: var(--color-muted);
      text-align: center;
      line-height: 1.2;
    }

    /* ── Canvas area ──────────────────────────────── */
    .editor-canvas-area {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .editor-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
      color: var(--color-muted);
      font-size: 0.875rem;
    }

    .editor-spinner {
      width: 2rem;
      height: 2rem;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Properties panel ─────────────────────────── */
    .editor-panel {
      width: 0;
      flex-shrink: 0;
      overflow: hidden;
      transition: width 200ms ease-out;
      background: var(--color-surface);
      border-left: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
    }

    .editor-panel--open {
      width: 320px;
    }

    .editor-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .editor-panel__type {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .editor-panel__close {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-muted);
      font-size: 0.875rem;
      transition: all 100ms;
    }

    .editor-panel__close:hover {
      background: var(--color-border);
      color: var(--color-text);
    }

    .editor-panel__body {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .editor-panel__footer {
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    .editor-panel__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 0.75rem;
      color: var(--color-subtle);
      font-size: 0.8rem;
      text-align: center;
      padding: 1rem;
    }

    .editor-panel__empty i {
      font-size: 2rem;
      opacity: 0.4;
    }

    /* ── Panel fields ─────────────────────────────── */
    .panel-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .panel-label {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--color-muted);
    }

    .panel-id {
      font-size: 0.72rem;
      color: var(--color-text-secondary);
      background: var(--color-bg);
      padding: 0.25rem 0.5rem;
      border-radius: var(--border-radius-sm);
      word-break: break-all;
    }

    .panel-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.68rem;
      font-weight: 700;
    }

    .panel-badge--on  { background: var(--color-success-light); color: var(--color-success); }
    .panel-badge--off { background: var(--color-border); color: var(--color-muted); }

    .panel-section-title {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--color-muted);
      border-top: 1px solid var(--color-border-light);
      padding-top: 0.5rem;
    }

    .panel-section-count {
      margin-left: auto;
      background: var(--color-border);
      color: var(--color-muted);
      border-radius: 9999px;
      font-size: 0.65rem;
      padding: 0.1rem 0.45rem;
    }

    /* ── Panel message cards ──────────────────────── */
    .panel-msg {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
    }

    .panel-msg__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.375rem 0.625rem;
      background: var(--color-surface-raised);
      border-bottom: 1px solid var(--color-border-light);
    }

    .panel-msg__key {
      font-size: 0.68rem;
      color: var(--color-primary);
    }

    .panel-msg__order {
      font-size: 0.65rem;
      color: var(--color-subtle);
      font-weight: 600;
    }

    .panel-msg__text {
      margin: 0;
      padding: 0.5rem 0.625rem;
      font-size: 0.78rem;
      font-family: var(--font-family);
      white-space: pre-wrap;
      line-height: 1.5;
      color: var(--color-text);
      word-break: break-word;
    }

    .panel-msg__textarea {
      width: 100%;
      border: none;
      border-top: 1px solid var(--color-border-light);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: 0.78rem;
      font-family: var(--font-family);
      line-height: 1.5;
      padding: 0.5rem 0.625rem;
      resize: none;
      outline: none;
      display: block;
    }

    .panel-msg__textarea:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(59,130,246,0.1);
    }

    .panel-msg__actions {
      display: flex;
      gap: 0.375rem;
      padding: 0.375rem 0.625rem;
      border-top: 1px solid var(--color-border-light);
      background: var(--color-surface-raised);
    }

    .panel-msg__edit-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      width: 100%;
      padding: 0.3rem 0.625rem;
      border: none;
      border-top: 1px solid var(--color-border-light);
      background: transparent;
      color: var(--color-primary);
      font-size: 0.7rem;
      font-weight: 600;
      font-family: var(--font-family);
      cursor: pointer;
      transition: background 100ms;
    }

    .panel-msg__edit-btn:hover { background: var(--color-primary-light); }

    .panel-empty {
      font-size: 0.78rem;
      color: var(--color-muted);
      text-align: center;
      padding: 0.5rem;
    }

    @media (prefers-reduced-motion: reduce) {
      * { transition: none !important; animation: none !important; }
    }
  `]
})
export class EditorFluxoComponent implements OnInit {
  private fluxoService = inject(FluxoService);
  private alertService = inject(AlertService);

  // ── State ─────────────────────────────────────────
  readonly fluxoData    = signal<FluxoBotCompletoResponse | null>(null);
  readonly carregando   = signal(false);
  readonly selectedNodeId = signal<string | null>(null);

  // Modal aresta
  readonly modalArestaVisivel = signal(false);
  readonly nodeOrigem  = signal<FluxoNodeAtualizado | null>(null);
  readonly nodeDestino = signal<FluxoNodeAtualizado | null>(null);

  // Panel editing
  readonly panelEditando = signal<string | null>(null);
  readonly panelTexto    = signal('');

  // Derived
  readonly selectedNode = computed(() => {
    const id   = this.selectedNodeId();
    const data = this.fluxoData();
    if (!id || !data) return null;
    return data.nodes.find(n => n.id === id) ?? null;
  });

  readonly palette = PALETTE_NODES;

  // ── ViewChild for fitView ─────────────────────────
  @ViewChild('canvasRef') private canvasComp?: EditorFluxoCanvasComponent;

  // ── Lifecycle ─────────────────────────────────────
  ngOnInit(): void {
    this.recarregar();
  }

  recarregar(): void {
    this.carregando.set(true);
    this.fluxoData.set(null);
    this.fluxoService.getFluxoCompleto().subscribe({
      next: data => {
        this.fluxoData.set(data);
        this.carregando.set(false);
        // Fit view after data loads
        setTimeout(() => this.fitView(), 100);
      },
      error: () => {
        this.alertService.erro('Erro ao carregar fluxo.');
        this.carregando.set(false);
      }
    });
  }

  fitView(): void {
    this.canvasComp?.fitView();
  }

  // ── Canvas events ──────────────────────────────────
  onNodePositionChanged(ev: { nodeId: string; x: number; y: number }): void {
    this.fluxoService.atualizarPosicaoNode(ev.nodeId, { posX: ev.x, posY: ev.y }).subscribe();
    // Update local state
    this.fluxoData.update(d => d ? {
      ...d,
      nodes: d.nodes.map(n => n.id === ev.nodeId ? { ...n, posX: ev.x, posY: ev.y } : n)
    } : d);
  }

  onMensagemEditada(ev: { nodeId: string } & MensagemEditadaEvent): void {
    this.fluxoService.atualizarMensagem(ev.chave, { texto: ev.texto }).subscribe({
      next: () => this.alertService.sucesso('Mensagem atualizada!'),
      error: () => this.alertService.erro('Erro ao salvar mensagem.')
    });
    // Update local state
    this.fluxoData.update(d => d ? {
      ...d,
      nodes: d.nodes.map(n => n.id !== ev.nodeId ? n : {
        ...n,
        mensagens: n.mensagens.map(m => m.chave === ev.chave ? { ...m, texto: ev.texto } : m)
      })
    } : d);
  }

  onArestaClicked(arestaId: string): void {
    if (!confirm('Deseja deletar esta conexão?')) return;
    this.fluxoService.deletarAresta(arestaId).subscribe({
      next: () => {
        this.alertService.sucesso('Conexão deletada.');
        this.fluxoData.update(d => d ? {
          ...d,
          arestas: d.arestas.filter(a => a.id !== arestaId)
        } : d);
      },
      error: () => this.alertService.erro('Erro ao deletar conexão.')
    });
  }

  onConnectRequest(ev: { de: string; para: string }): void {
    const data = this.fluxoData();
    if (!data) return;
    const origem  = data.nodes.find(n => n.id === ev.de);
    const destino = data.nodes.find(n => n.id === ev.para);
    if (!origem || !destino) return;
    this.nodeOrigem.set(origem);
    this.nodeDestino.set(destino);
    this.modalArestaVisivel.set(true);
  }

  onNodeSelected(id: string | null): void {
    this.selectedNodeId.set(id);
    this.panelEditando.set(null);
  }

  // ── Modal aresta ──────────────────────────────────
  onConfirmarAresta(ev: { condicao?: string; label?: string }): void {
    const origem  = this.nodeOrigem();
    const destino = this.nodeDestino();
    if (!origem || !destino) return;

    this.fluxoService.criarAresta({ de: origem.id, para: destino.id, ...ev }).subscribe({
      next: aresta => {
        this.alertService.sucesso('Conexão criada!');
        this.fluxoData.update(d => d ? { ...d, arestas: [...d.arestas, aresta] } : d);
        this.fecharModal();
      },
      error: () => this.alertService.erro('Erro ao criar conexão.')
    });
  }

  fecharModal(): void {
    this.modalArestaVisivel.set(false);
    this.nodeOrigem.set(null);
    this.nodeDestino.set(null);
  }

  // ── Palette — add node ────────────────────────────
  adicionarNode(tipo: TipoNodeAtualizado): void {
    const novoNode: Partial<FluxoNodeAtualizado> = {
      tipo,
      mensagens: [],
      posX: 200 + Math.random() * 200,
      posY: 200 + Math.random() * 200,
      ativo: true
    };
    this.fluxoService.criarNode(novoNode).subscribe({
      next: node => {
        this.alertService.sucesso('Nó criado!');
        this.fluxoData.update(d => d ? { ...d, nodes: [...d.nodes, node] } : d);
      },
      error: () => this.alertService.erro('Erro ao criar nó.')
    });
  }

  // ── Panel editing ─────────────────────────────────
  onPanelInput(event: Event): void {
    this.panelTexto.set((event.target as HTMLTextAreaElement).value);
  }

  iniciarPanelEdit(chave: string, texto: string): void {
    this.panelEditando.set(chave);
    this.panelTexto.set(texto);
  }

  cancelarPanelEdit(): void {
    this.panelEditando.set(null);
    this.panelTexto.set('');
  }

  salvarPanelEdit(msg: { chave: string; texto: string }, node: FluxoNodeAtualizado): void {
    const novoTexto = this.panelTexto().trim();
    if (!novoTexto) return;
    this.onMensagemEditada({ nodeId: node.id, chave: msg.chave, texto: novoTexto });
    this.cancelarPanelEdit();
  }

  // ── Node actions ──────────────────────────────────
  deletarNode(nodeId: string): void {
    if (!confirm('Deletar este nó? Suas conexões também serão removidas.')) return;
    this.fluxoService.deletarNode(nodeId).subscribe({
      next: () => {
        this.alertService.sucesso('Nó deletado.');
        this.deselect();
        this.fluxoData.update(d => d ? {
          ...d,
          nodes: d.nodes.filter(n => n.id !== nodeId),
          arestas: d.arestas.filter(a => a.de !== nodeId && a.para !== nodeId)
        } : d);
      },
      error: () => this.alertService.erro('Erro ao deletar nó.')
    });
  }

  deselect(): void {
    this.selectedNodeId.set(null);
    this.panelEditando.set(null);
  }

  salvarPosicoes(): void {
    const data = this.fluxoData();
    if (!data) return;
    this.carregando.set(true);
    let pending = data.nodes.length;
    if (pending === 0) { this.carregando.set(false); return; }
    data.nodes.forEach(n => {
      this.fluxoService.atualizarPosicaoNode(n.id, { posX: n.posX, posY: n.posY }).subscribe({
        next: () => { if (--pending === 0) { this.carregando.set(false); this.alertService.sucesso('Layout salvo!'); } },
        error: () => { if (--pending === 0) { this.carregando.set(false); } }
      });
    });
  }

  // ── Node helpers ──────────────────────────────────
  getNodeIcon(tipo: string): string {
    const m: Record<string, string> = {
      MENU: 'fa-solid fa-list-ul',
      CONFIRMACAO: 'fa-solid fa-circle-check',
      AGUARDA_INPUT: 'fa-solid fa-keyboard',
      TRANSFERENCIA: 'fa-solid fa-headset',
      RESULTADO_API: 'fa-solid fa-plug',
      MENSAGEM: 'fa-solid fa-comment-dots',
      ENCERRAMENTO: 'fa-solid fa-circle-xmark',
    };
    return m[tipo] ?? 'fa-solid fa-circle';
  }

  getNodeLabel(tipo: string): string {
    const m: Record<string, string> = {
      MENU: 'Menu',
      CONFIRMACAO: 'Confirmação',
      AGUARDA_INPUT: 'Aguarda Input',
      TRANSFERENCIA: 'Transferência',
      RESULTADO_API: 'API',
      MENSAGEM: 'Mensagem',
      ENCERRAMENTO: 'Encerramento',
    };
    return m[tipo] ?? tipo;
  }
}
