import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
  computed,
  HostListener,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FluxoNodeAtualizado, FluxoAresta } from '../../../../shared/models/fluxo-node-updated';
import { EditorFluxoNodeComponent, MensagemEditadaEvent } from '../editor-fluxo-node/editor-fluxo-node';

const NODE_WIDTH   = 248;
const NODE_PORT_Y  = 68;  // vert center of port from node top

@Component({
  selector: 'app-editor-fluxo-canvas',
  standalone: true,
  imports: [CommonModule, EditorFluxoNodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #outerEl
      class="canvas-outer"
      [style]="gridStyle()"
      (mousedown)="onOuterMouseDown($event)"
      (wheel)="onWheel($event)"
    >
      <!-- Transformed inner canvas (nodes + SVG) -->
      <div class="canvas-inner" [style.transform]="transform()">

        <!-- SVG layer for connections -->
        <svg class="canvas-svg" width="6000" height="5000">
          <defs>
            <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--color-primary)" opacity="0.8"/>
            </marker>
            <marker id="arrow-auto" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--color-muted)"/>
            </marker>
            <marker id="arrow-success" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--color-success)"/>
            </marker>
            <marker id="arrow-danger" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--color-danger)"/>
            </marker>
          </defs>

          <!-- Existing connections -->
          @for (aresta of arestas; track aresta.id) {
            <g
              class="conn-group"
              [class.conn-group--selected]="arestaHovered() === aresta.id"
              (mouseenter)="arestaHovered.set(aresta.id)"
              (mouseleave)="arestaHovered.set(null)"
              (click)="onArestaClick($event, aresta.id)"
            >
              <!-- invisible thick hit area -->
              <path
                [attr.d]="getConnPath(aresta)"
                fill="none"
                stroke="transparent"
                stroke-width="12"
                style="cursor:pointer"
              />
              <!-- visible path -->
              <path
                [attr.d]="getConnPath(aresta)"
                fill="none"
                [attr.stroke]="getConnColor(aresta.condicao)"
                stroke-width="2"
                [attr.stroke-dasharray]="aresta.condicao === 'auto' ? '6 4' : 'none'"
                [attr.marker-end]="'url(#' + getConnMarker(aresta.condicao) + ')'"
                class="conn-path"
              />
              @if (aresta.label) {
                <g [attr.transform]="'translate(' + getMid(aresta).x + ',' + getMid(aresta).y + ')'">
                  <rect x="-22" y="-9" width="44" height="18" rx="9"
                    fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1"/>
                  <text class="conn-label" text-anchor="middle" dominant-baseline="middle">
                    {{ aresta.label }}
                  </text>
                </g>
              }
            </g>
          }

          <!-- Temp connection (while dragging from a port) -->
          @if (connectingFromId()) {
            <path
              [attr.d]="tempConnPath()"
              fill="none"
              stroke="var(--color-success)"
              stroke-width="2"
              stroke-dasharray="6 4"
              pointer-events="none"
            />
          }
        </svg>

        <!-- Nodes layer -->
        @for (node of nodesLocal(); track node.id) {
          <app-editor-fluxo-node
            [node]="node"
            [selected]="selectedNodeId() === node.id"
            [isConnecting]="connectingFromId() !== null && connectingFromId() !== node.id"
            [style.left.px]="node.posX"
            [style.top.px]="node.posY"
            (mousedown)="onNodeMouseDown($event, node)"
            (click)="onNodeClick($event, node)"
            (portClick)="onPortClick($event, node.id)"
            (mensagemEditada)="onMensagemEditada($event, node.id)"
          />
        }
      </div>

      <!-- Zoom controls -->
      <div class="canvas-controls">
        <button class="canvas-btn" (click)="zoomIn()" title="Zoom in">
          <i class="fa-solid fa-plus"></i>
        </button>
        <span class="canvas-zoom-pct">{{ zoomPct() }}%</span>
        <button class="canvas-btn" (click)="zoomOut()" title="Zoom out">
          <i class="fa-solid fa-minus"></i>
        </button>
        <div class="canvas-divider"></div>
        <button class="canvas-btn" (click)="fitView()" title="Centralizar">
          <i class="fa-solid fa-compress-arrows-alt"></i>
        </button>
      </div>

      <!-- Hint bar -->
      <div class="canvas-hint">
        <i class="fa-solid fa-circle-info"></i>
        Arraste para mover &nbsp;•&nbsp; Scroll para zoom &nbsp;•&nbsp;
        Clique <strong>●</strong> para conectar &nbsp;•&nbsp;
        Duplo clique na mensagem para editar
      </div>

      <!-- Connect mode badge -->
      @if (connectingFromId()) {
        <div class="canvas-connect-badge">
          <i class="fa-solid fa-link"></i> Clique em outro nó para conectar &nbsp;
          <button class="canvas-connect-cancel" (click)="cancelConnect()">
            <i class="fa-solid fa-xmark"></i> Cancelar
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    /* ── Outer container ──────────────────────────── */
    .canvas-outer {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      cursor: default;
      background-color: var(--color-bg);
      background-image:
        radial-gradient(circle, var(--color-border) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    /* ── Inner transformed canvas ─────────────────── */
    .canvas-inner {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: 0 0;
      will-change: transform;
    }

    /* ── SVG layer ────────────────────────────────── */
    .canvas-svg {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      overflow: visible;
    }

    .conn-group { pointer-events: all; }
    .conn-group--selected .conn-path { stroke-width: 3 !important; }

    .conn-path {
      transition: stroke-width 100ms ease-out;
    }

    .conn-label {
      font-size: 10px;
      fill: var(--color-muted);
      font-weight: 700;
      font-family: var(--font-family);
    }

    /* ── Zoom controls ────────────────────────────── */
    .canvas-controls {
      position: absolute;
      bottom: 3rem;
      right: 1rem;
      display: flex;
      align-items: center;
      gap: 2px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      padding: 4px;
      box-shadow: var(--shadow-sm);
      z-index: 50;
    }

    .canvas-btn {
      width: 30px;
      height: 30px;
      border: none;
      background: transparent;
      border-radius: var(--border-radius);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      color: var(--color-muted);
      transition: all 100ms ease-out;
    }

    .canvas-btn:hover {
      background: var(--color-primary-light);
      color: var(--color-primary);
    }

    .canvas-zoom-pct {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-muted);
      min-width: 38px;
      text-align: center;
    }

    .canvas-divider {
      width: 1px;
      height: 20px;
      background: var(--color-border);
      margin: 0 2px;
    }

    /* ── Hint bar ─────────────────────────────────── */
    .canvas-hint {
      position: absolute;
      bottom: 0.75rem;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-lg);
      padding: 0.3rem 0.875rem;
      font-size: 0.7rem;
      color: var(--color-muted);
      white-space: nowrap;
      box-shadow: var(--shadow-xs);
      z-index: 50;
      pointer-events: none;
    }

    /* ── Connect mode badge ───────────────────────── */
    .canvas-connect-badge {
      position: absolute;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
      background: var(--color-success-light);
      border: 1.5px solid var(--color-success);
      color: var(--color-success);
      border-radius: var(--border-radius-lg);
      padding: 0.4rem 0.875rem;
      font-size: 0.78rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: var(--shadow-sm);
      z-index: 100;
      white-space: nowrap;
    }

    .canvas-connect-cancel {
      background: transparent;
      border: 1px solid currentColor;
      color: inherit;
      border-radius: var(--border-radius-sm);
      padding: 0.1rem 0.5rem;
      font-size: 0.7rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      transition: all 100ms;
    }

    .canvas-connect-cancel:hover {
      background: var(--color-success);
      color: white;
    }

    @media (prefers-reduced-motion: reduce) {
      * { transition: none !important; }
    }
  `]
})
export class EditorFluxoCanvasComponent implements OnChanges {
  @ViewChild('outerEl') outerEl!: ElementRef<HTMLElement>;

  @Input() nodes: FluxoNodeAtualizado[] = [];
  @Input() arestas: FluxoAresta[] = [];
  @Input() selectedId: string | null = null;

  @Output() nodePositionChanged = new EventEmitter<{ nodeId: string; x: number; y: number }>();
  @Output() mensagemEditada = new EventEmitter<{ nodeId: string } & MensagemEditadaEvent>();
  @Output() arestaClicked = new EventEmitter<string>();
  @Output() connectRequest = new EventEmitter<{ de: string; para: string }>();
  @Output() nodeSelected = new EventEmitter<string | null>();

  // ── Reactive state ───────────────────────────────
  readonly nodesLocal = signal<FluxoNodeAtualizado[]>([]);
  readonly panX       = signal(60);
  readonly panY       = signal(60);
  readonly scale      = signal(1);
  readonly selectedNodeId   = signal<string | null>(null);
  readonly connectingFromId = signal<string | null>(null);
  readonly arestaHovered    = signal<string | null>(null);
  readonly tempMousePos     = signal({ x: 0, y: 0 });

  readonly transform = computed(() =>
    `translate(${this.panX()}px, ${this.panY()}px) scale(${this.scale()})`
  );

  readonly zoomPct = computed(() => Math.round(this.scale() * 100));

  readonly gridStyle = computed(() => {
    const x = ((this.panX() % 24) + 24) % 24;
    const y = ((this.panY() % 24) + 24) % 24;
    return { 'background-position': `${x}px ${y}px` };
  });

  readonly tempConnPath = computed(() => {
    const fromId = this.connectingFromId();
    if (!fromId) return '';
    const from = this.nodesLocal().find(n => n.id === fromId);
    if (!from) return '';
    const p1 = this.portPos(from, 'out');
    const p2 = this.tempMousePos();
    return this.bezier(p1, p2);
  });

  // ── Drag state (imperative, not reactive) ────────
  private isDraggingNode = false;
  private draggingNodeId: string | null = null;
  private dragOffset = { x: 0, y: 0 };
  private isPanning = false;
  private panStart  = { x: 0, y: 0 };

  // ── Lifecycle ────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes']) {
      this.nodesLocal.set(this.nodes.map(n => ({ ...n })));
    }
    if (changes['selectedId']) {
      this.selectedNodeId.set(this.selectedId);
    }
  }

  // ── Document-level mouse events ──────────────────
  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    const outer = this.outerEl?.nativeElement;
    if (!outer) return;
    const rect = outer.getBoundingClientRect();

    if (this.isDraggingNode && this.draggingNodeId) {
      const cx = (event.clientX - rect.left - this.panX()) / this.scale();
      const cy = (event.clientY - rect.top  - this.panY()) / this.scale();
      this.nodesLocal.update(nodes =>
        nodes.map(n => n.id !== this.draggingNodeId ? n : {
          ...n,
          posX: Math.max(0, cx - this.dragOffset.x),
          posY: Math.max(0, cy - this.dragOffset.y)
        })
      );
    }

    if (this.isPanning) {
      const dx = event.clientX - this.panStart.x;
      const dy = event.clientY - this.panStart.y;
      this.panX.update(v => v + dx);
      this.panY.update(v => v + dy);
      this.panStart = { x: event.clientX, y: event.clientY };
    }

    if (this.connectingFromId()) {
      const cx = (event.clientX - rect.left - this.panX()) / this.scale();
      const cy = (event.clientY - rect.top  - this.panY()) / this.scale();
      this.tempMousePos.set({ x: cx, y: cy });
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onDocumentMouseUp(_event: MouseEvent): void {
    if (this.isDraggingNode && this.draggingNodeId) {
      const node = this.nodesLocal().find(n => n.id === this.draggingNodeId);
      if (node) {
        this.nodePositionChanged.emit({ nodeId: node.id, x: node.posX, y: node.posY });
      }
    }
    this.isDraggingNode = false;
    this.draggingNodeId = null;
    this.isPanning = false;
  }

  // ── Canvas interactions ──────────────────────────
  onOuterMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Only pan if clicking the canvas background (not a node or port)
    if (target.closest('app-editor-fluxo-node') || target.closest('.conn-group')) return;

    this.isPanning = true;
    this.panStart  = { x: event.clientX, y: event.clientY };

    // Deselect + cancel connect on canvas click
    this.selectedNodeId.set(null);
    this.nodeSelected.emit(null);
    if (this.connectingFromId()) this.connectingFromId.set(null);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta    = event.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(3, Math.max(0.15, this.scale() * delta));
    const outer    = this.outerEl.nativeElement;
    const rect     = outer.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const ratio = newScale / this.scale();
    this.panX.update(v => mx - ratio * (mx - v));
    this.panY.update(v => my - ratio * (my - v));
    this.scale.set(newScale);
  }

  onNodeMouseDown(event: MouseEvent, node: FluxoNodeAtualizado): void {
    event.stopPropagation();
    if ((event.target as HTMLElement).tagName === 'TEXTAREA') return;

    this.isDraggingNode  = true;
    this.draggingNodeId  = node.id;

    const outer = this.outerEl.nativeElement;
    const rect  = outer.getBoundingClientRect();
    const cx = (event.clientX - rect.left - this.panX()) / this.scale();
    const cy = (event.clientY - rect.top  - this.panY()) / this.scale();
    this.dragOffset = { x: cx - node.posX, y: cy - node.posY };
  }

  onNodeClick(event: MouseEvent, node: FluxoNodeAtualizado): void {
    event.stopPropagation();

    // If in connect mode → create connection
    const connecting = this.connectingFromId();
    if (connecting && connecting !== node.id) {
      this.connectRequest.emit({ de: connecting, para: node.id });
      this.connectingFromId.set(null);
      return;
    }

    // Otherwise → select node
    this.selectedNodeId.set(node.id);
    this.nodeSelected.emit(node.id);
  }

  onPortClick(event: MouseEvent, nodeId: string): void {
    event.stopPropagation();
    const connecting = this.connectingFromId();
    if (connecting) {
      if (connecting !== nodeId) {
        this.connectRequest.emit({ de: connecting, para: nodeId });
      }
      this.connectingFromId.set(null);
    } else {
      this.connectingFromId.set(nodeId);
      const node = this.nodesLocal().find(n => n.id === nodeId);
      if (node) {
        this.tempMousePos.set(this.portPos(node, 'out'));
      }
    }
  }

  onArestaClick(event: MouseEvent, arestaId: string): void {
    event.stopPropagation();
    this.arestaClicked.emit(arestaId);
  }

  onMensagemEditada(ev: MensagemEditadaEvent, nodeId: string): void {
    this.mensagemEditada.emit({ nodeId, ...ev });
  }

  cancelConnect(): void {
    this.connectingFromId.set(null);
  }

  // ── Zoom controls ────────────────────────────────
  zoomIn():  void { this.scale.update(s => Math.min(3, s * 1.2)); }
  zoomOut(): void { this.scale.update(s => Math.max(0.15, s * 0.8)); }
  fitView(): void {
    const nodes = this.nodesLocal();
    if (nodes.length === 0) { this.panX.set(60); this.panY.set(60); this.scale.set(1); return; }

    const outer = this.outerEl?.nativeElement;
    if (!outer) return;
    const { width: vw, height: vh } = outer.getBoundingClientRect();

    const minX = Math.min(...nodes.map(n => n.posX));
    const minY = Math.min(...nodes.map(n => n.posY));
    const maxX = Math.max(...nodes.map(n => n.posX + NODE_WIDTH));
    const maxY = Math.max(...nodes.map(n => n.posY + 140));

    const contentW = maxX - minX + 120;
    const contentH = maxY - minY + 120;
    const newScale = Math.min(3, Math.max(0.15, Math.min(vw / contentW, vh / contentH) * 0.9));

    this.scale.set(newScale);
    this.panX.set((vw  - contentW * newScale) / 2 - minX * newScale + 60);
    this.panY.set((vh  - contentH * newScale) / 2 - minY * newScale + 60);
  }

  // ── Path helpers ─────────────────────────────────
  portPos(node: FluxoNodeAtualizado, side: 'in' | 'out') {
    return {
      x: side === 'out' ? node.posX + NODE_WIDTH : node.posX,
      y: node.posY + NODE_PORT_Y
    };
  }

  bezier(p1: { x: number; y: number }, p2: { x: number; y: number }): string {
    const cp = Math.abs(p2.x - p1.x) * 0.55 + 40;
    return `M ${p1.x},${p1.y} C ${p1.x + cp},${p1.y} ${p2.x - cp},${p2.y} ${p2.x},${p2.y}`;
  }

  getConnPath(aresta: FluxoAresta): string {
    const nodes = this.nodesLocal();
    const from  = nodes.find(n => n.id === aresta.de);
    const to    = nodes.find(n => n.id === aresta.para);
    if (!from || !to) return '';
    return this.bezier(this.portPos(from, 'out'), this.portPos(to, 'in'));
  }

  getMid(aresta: FluxoAresta): { x: number; y: number } {
    const nodes = this.nodesLocal();
    const from  = nodes.find(n => n.id === aresta.de);
    const to    = nodes.find(n => n.id === aresta.para);
    if (!from || !to) return { x: 0, y: 0 };
    const p1 = this.portPos(from, 'out');
    const p2 = this.portPos(to, 'in');
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  }

  getConnColor(condicao?: string): string {
    if (!condicao || condicao === '1' || condicao === '2' || condicao === '3') return 'var(--color-primary)';
    if (condicao === 'auto')       return 'var(--color-muted)';
    if (condicao === 'cpf_valido') return 'var(--color-success)';
    if (condicao === 'fora_horario') return 'var(--color-danger)';
    return 'var(--color-primary)';
  }

  getConnMarker(condicao?: string): string {
    if (condicao === 'auto') return 'arrow-auto';
    if (condicao === 'cpf_valido') return 'arrow-success';
    if (condicao === 'fora_horario') return 'arrow-danger';
    return 'arrow-default';
  }
}
