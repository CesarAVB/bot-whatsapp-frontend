import { Component, Input, Output, EventEmitter, signal, computed, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FluxoNodeResponse, FluxoArestaResponse } from '../../../shared/models/fluxo-bot-response';

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

interface RenderableConnection {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}

@Component({
  selector: 'app-flow-canvas',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="flow-canvas">
      <!-- Grid background com SVG -->
      <svg class="grid-background" [attr.width]="canvasWidth" [attr.height]="canvasHeight">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" stroke="var(--color-border)" stroke-width="0.5" fill="none"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>

        <!-- Conexões entre nós -->
        @for (connection of renderableConnections(); track connection.id) {
          <g class="connection">
            <line [attr.x1]="connection.x1" [attr.y1]="connection.y1"
                  [attr.x2]="connection.x2" [attr.y2]="connection.y2"
                  class="connection-line"/>
            
            <!-- Seta no final -->
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="var(--color-primary)"/>
              </marker>
            </defs>
            <line [attr.x1]="connection.x1" [attr.y1]="connection.y1"
                  [attr.x2]="connection.x2" [attr.y2]="connection.y2"
                  stroke="var(--color-primary)" stroke-width="2"
                  marker-end="url(#arrowhead)"/>

            @if (connection.label) {
              <text [attr.x]="(connection.x1 + connection.x2) / 2" 
                    [attr.y]="(connection.y1 + connection.y2) / 2 - 8"
                    class="connection-label">
                {{ connection.label }}
              </text>
            }
          </g>
        }
      </svg>

      <!-- Nós container -->
      <div class="nodes-container" [style.width.px]="canvasWidth" [style.height.px]="canvasHeight">
        @for (node of nodes; track node.id) {
          <app-flow-node
            [node]="node"
            [style.left.px]="getNodePosition(node.id).x"
            [style.top.px]="getNodePosition(node.id).y"
            (nodeUpdated)="nodeUpdated.emit($any($event))"
            (nodeDragged)="onNodeDragged($any($event))"
            draggable="true"
            (dragstart)="onNodeDragStart($event, node)"
            (dragend)="onNodeDragEnd($event)"
            (dragover)="onNodeDragOver($event)"
          />
        }
      </div>

      <!-- Status bar -->
      <div class="canvas-status">
        <span class="status-item">
          <i class="fa-solid fa-cube"></i> {{ nodes.length }} nós
        </span>
        <span class="status-item">
          <i class="fa-solid fa-arrow-right"></i> {{ arestas.length }} conexões
        </span>
      </div>
    </div>
  `,
  styles: [`
    .flow-canvas {
      position: relative;
      width: 100%;
      height: 100%;
      background-color: var(--color-bg);
      overflow: auto;
      user-select: none;
    }

    .grid-background {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
    }

    .nodes-container {
      position: absolute;
      top: 0;
      left: 0;
    }

    app-flow-node {
      position: absolute;
      width: 180px;
      cursor: grab;
      transition: filter var(--transition-fast);
    }

    app-flow-node:active {
      cursor: grabbing;
      filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
    }

    app-flow-node:hover {
      filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.3));
    }

    .connection {
      pointer-events: none;
    }

    .connection-line {
      stroke: var(--color-border);
      stroke-width: 1;
      stroke-dasharray: 5,5;
    }

    .connection-label {
      font-size: 11px;
      fill: var(--color-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      pointer-events: none;
    }

    .canvas-status {
      position: fixed;
      bottom: var(--spacing-md);
      right: var(--spacing-md);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      display: flex;
      gap: var(--spacing-md);
      font-size: 0.75rem;
      color: var(--color-muted);
      pointer-events: none;
      z-index: 100;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        transition: none !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowCanvasComponent {
  @Input() nodes: FluxoNodeResponse[] = [];
  @Input() arestas: FluxoArestaResponse[] = [];
  @Output() nodeUpdated = new EventEmitter<FluxoNodeResponse>();
  @Output() arestaCreated = new EventEmitter<FluxoArestaResponse>();

  readonly GRID_SIZE = 20;
  readonly NODE_WIDTH = 180;
  readonly NODE_HEIGHT = 100;
  readonly COLS = 4;
  readonly ROWS = 4;

  canvasWidth = this.COLS * (this.NODE_WIDTH + 60) + 100;
  canvasHeight = this.ROWS * (this.NODE_HEIGHT + 60) + 100;

  nodePositions = signal<NodePosition[]>([]);
  draggedNode: FluxoNodeResponse | null = null;
  dragOffset = { x: 0, y: 0 };

  renderableConnections = computed(() => {
    return this.arestas.map(aresta => {
      const fromPos = this.nodePositions().find(p => p.id === aresta.de);
      const toPos = this.nodePositions().find(p => p.id === aresta.para);

      if (!fromPos || !toPos) return null;

      return {
        id: aresta.id,
        x1: fromPos.x + this.NODE_WIDTH / 2,
        y1: fromPos.y + this.NODE_HEIGHT,
        x2: toPos.x + this.NODE_WIDTH / 2,
        y2: toPos.y,
        label: aresta.condicao || aresta.label
      } as RenderableConnection;
    }).filter((c): c is RenderableConnection => c !== null);
  });

  constructor() {
    this.initializePositions();
  }

  private initializePositions() {
    const positions: NodePosition[] = [];
    this.nodes.forEach((node, index) => {
      const col = index % this.COLS;
      const row = Math.floor(index / this.COLS);
      positions.push({
        id: node.id,
        x: col * (this.NODE_WIDTH + 60) + 40,
        y: row * (this.NODE_HEIGHT + 60) + 40
      });
    });
    this.nodePositions.set(positions);
  }

  getNodePosition(nodeId: string) {
    return this.nodePositions().find(p => p.id === nodeId) || { x: 0, y: 0 };
  }

  onNodeDragStart(event: DragEvent, node: FluxoNodeResponse) {
    this.draggedNode = node;
    const element = event.target as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    this.dragOffset = {
      x: (event.clientX || 0) - rect.left,
      y: (event.clientY || 0) - rect.top
    };

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', node.id);
    }
  }

  onNodeDragEnd(event: DragEvent) {
    this.draggedNode = null;
  }

  onNodeDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onNodeDragged(data: { nodeId: string; x: number; y: number }) {
    const positions = this.nodePositions();
    const updated = positions.map(p => 
      p.id === data.nodeId ? { ...p, x: data.x, y: data.y } : p
    );
    this.nodePositions.set(updated);
  }
}
