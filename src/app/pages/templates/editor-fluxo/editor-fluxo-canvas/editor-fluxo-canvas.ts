import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  HostListener,
  NO_ERRORS_SCHEMA,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FluxoNodeAtualizado, FluxoAresta } from '../../../../shared/models/fluxo-node-updated';
import { EditorFluxoNodeComponent } from '../editor-fluxo-node/editor-fluxo-node';

@Component({
  selector: 'app-editor-fluxo-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="canvas-container" (mousemove)="onCanvasMouseMove($event)" (mouseup)="onCanvasMouseUp()">
      <!-- SVG para arestas -->
      <svg class="canvas-connections" [attr.width]="canvasWidth" [attr.height]="canvasHeight">
        <defs>
          <marker id="arrowDefault" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="var(--color-primary)"/>
          </marker>
          <marker id="arrowAuto" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="var(--color-muted)"/>
          </marker>
          <marker id="arrowErro" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="var(--color-danger)"/>
          </marker>
          <marker id="arrowSucesso" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="var(--color-success)"/>
          </marker>
        </defs>

        <!-- Arestas existentes -->
        @for (aresta of arestas; track aresta.id) {
          <g class="aresta-group" (click)="onArestaClick($event, aresta.id)">
            <line
              [attr.x1]="getNodeCenter(aresta.de).x"
              [attr.y1]="getNodeCenter(aresta.de).y"
              [attr.x2]="getNodeCenter(aresta.para).x"
              [attr.y2]="getNodeCenter(aresta.para).y"
              [class]="'aresta-line aresta-' + getArestaCorClass(aresta.condicao)"
              [attr.marker-end]="'url(#arrow' + getArestaMarkerClass(aresta.condicao) + ')'"
            />
            @if (aresta.label) {
              <text
                [attr.x]="(getNodeCenter(aresta.de).x + getNodeCenter(aresta.para).x) / 2"
                [attr.y]="(getNodeCenter(aresta.de).y + getNodeCenter(aresta.para).y) / 2 - 5"
                class="aresta-label"
              >
                {{ aresta.label }}
              </text>
            }
          </g>
        }
      </svg>

      <!-- Canvas para nós -->
      <div class="nodes-container" [style.width.px]="canvasWidth" [style.height.px]="canvasHeight">
        @for (node of nodes; track node.id) {
          <app-editor-fluxo-node
            [node]="node"
            [selected]="nodeEmDrag() === node.id"
            [style.left.px]="node.posX"
            [style.top.px]="node.posY"
            (mousedown)="onNodeMouseDown($event, node)"
            (mensagemDuploClique)="onMensagemDuploClique($any($event), node.id)"
            (nodoDeletado)="onNodeDeletado(node.id)"
          />
        }
      </div>

      <!-- Instrução de ajuda -->
      <div class="canvas-hint">
        <small>
          <i class="fa-solid fa-info-circle me-1"></i>
          Arraste nós para mover • Duplo clique em mensagem para editar • Clique em aresta para deletar
        </small>
      </div>
    </div>
  `,
  styles: [`
    .canvas-container {
      position: relative;
      width: 100%;
      height: 100%;
      background: var(--color-bg);
      background-image:
        linear-gradient(var(--color-border) 1px, transparent 1px),
        linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
      background-size: 25px 25px;
      overflow: hidden;
      user-select: none;
    }

    .canvas-connections {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 10;
    }

    .aresta-group {
      pointer-events: stroke;
      cursor: pointer;
    }

    .aresta-line {
      stroke: var(--color-primary);
      stroke-width: 2;
      fill: none;
      transition: stroke-width 0.2s;
    }

    .aresta-line.aresta-auto {
      stroke: var(--color-muted);
      stroke-dasharray: 5, 5;
    }

    .aresta-line.aresta-erro {
      stroke: var(--color-danger);
    }

    .aresta-line.aresta-sucesso {
      stroke: var(--color-success);
    }

    .aresta-group:hover .aresta-line {
      stroke-width: 3;
    }

    .aresta-label {
      font-size: 11px;
      fill: var(--color-muted);
      text-anchor: middle;
      pointer-events: none;
      font-weight: 600;
      background: var(--color-surface);
      padding: 2px 4px;
    }

    .nodes-container {
      position: absolute;
      top: 0;
      left: 0;
    }

    app-editor-fluxo-node {
      position: absolute;
      cursor: grab;
    }

    app-editor-fluxo-node:active {
      cursor: grabbing;
    }

    .canvas-hint {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      background: rgba(0, 0, 0, 0.7);
      color: var(--color-text);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      z-index: 50;
      font-size: 0.75rem;
    }

    @media (max-width: 768px) {
      .canvas-hint {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        transition: none !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorFluxoCanvasComponent {
  @Input() nodes: FluxoNodeAtualizado[] = [];
  @Input() arestas: FluxoAresta[] = [];
  @Output() nodePositionChanged = new EventEmitter<{ nodeId: string; x: number; y: number }>();
  @Output() arestaSelected = new EventEmitter<string>();
  @Output() novoArestaRequest = new EventEmitter<{ de: string; para: string }>();
  @Output() mensagemEdicao = new EventEmitter<{ nodeId: string; mensagemChave: string; novoTexto: string }>();

  canvasWidth = 3000;
  canvasHeight = 2000;

  nodeEmDrag = signal<string | null>(null);
  dragOffset = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  onNodeMouseDown(event: MouseEvent, node: FluxoNodeAtualizado) {
    this.nodeEmDrag.set(node.id);
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.dragOffset.set({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  }

  onCanvasMouseMove(event: MouseEvent) {
    const nodeId = this.nodeEmDrag();
    if (!nodeId) return;

    const canvas = (event.target as HTMLElement);
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - this.dragOffset().x;
    const y = event.clientY - rect.top - this.dragOffset().y;

    this.nodePositionChanged.emit({ nodeId, x, y });
  }

  onCanvasMouseUp() {
    this.nodeEmDrag.set(null);
  }

  onArestaClick(event: MouseEvent, arestaId: string) {
    event.stopPropagation();
    this.arestaSelected.emit(arestaId);
  }

  onMensagemDuploClique(novoTexto: string, nodeId: string) {
    // Implementado em editor-fluxo-node, aqui só passamos para cima
  }

  onNodeDeletado(nodeId: string) {
    // Implementar deleção de nó
  }

  getNodeCenter(nodeId: string) {
    const node = this.nodes.find(n => n.id === nodeId);
    return {
      x: (node?.posX ?? 0) + 80,
      y: (node?.posY ?? 0) + 60
    };
  }

  getArestaCorClass(condicao?: string): string {
    if (!condicao) return 'default';
    if (condicao === 'auto') return 'auto';
    if (condicao === 'fora_horario') return 'erro';
    if (condicao === 'cpf_valido') return 'sucesso';
    return 'default';
  }

  getArestaMarkerClass(condicao?: string): string {
    if (!condicao) return 'Default';
    if (condicao === 'auto') return 'Auto';
    if (condicao === 'fora_horario') return 'Erro';
    if (condicao === 'cpf_valido') return 'Sucesso';
    return 'Default';
  }
}
