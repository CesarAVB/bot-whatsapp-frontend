import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FluxoNodeResponse, TipoNode } from '../../../shared/models/fluxo-bot-response';

@Component({
  selector: 'app-flow-node',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flow-node" [class]="'flow-node--' + getNodeType(node.tipo)">
      <div class="node-header">
        <i [class]="getNodeIcon(node.tipo)"></i>
        <span class="node-type">{{ node.tipo }}</span>
      </div>

      <div class="node-body">
        @if (isEditing()) {
          <input 
            type="text" 
            class="node-input" 
            [(ngModel)]="editingLabel"
            (blur)="saveLabel()"
            (keyup.enter)="saveLabel()"
            autofocus
          />
        } @else {
          <p class="node-label" (dblclick)="startEdit()">
            {{ node.label }}
          </p>
        }

        @if (node.template?.texto) {
          <div class="node-content">
            <pre class="node-text">{{ truncate(node.template.texto || '') }}</pre>
          </div>
        }

        @if (node.estado) {
          <div class="node-meta">
            <small>{{ node.estado }}</small>
          </div>
        }
      </div>

      <div class="node-footer">
        <span class="node-info">
          @if (node.mensagens && node.mensagens.length > 0) {
            <i class="fa-solid fa-comment-dots"></i>
            {{ node.mensagens.length }} msg
          }
        </span>
        <button class="node-btn" (click)="onEdit()" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>
      </div>

      <div class="node-handle node-handle-top"></div>
      <div class="node-handle node-handle-right"></div>
      <div class="node-handle node-handle-bottom"></div>
      <div class="node-handle node-handle-left"></div>
    </div>
  `,
  styles: [`
    .flow-node {
      position: absolute;
      width: 160px;
      min-height: 120px;
      background: var(--color-surface);
      border: 2px solid var(--color-border);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      padding: var(--spacing-sm);
      gap: var(--spacing-xs);
      cursor: grab;
      transition: all var(--transition-fast);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      z-index: 10;
    }

    .flow-node:active {
      cursor: grabbing;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }

    .flow-node:hover {
      border-color: var(--color-primary);
    }

    .flow-node--menu {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }

    .flow-node--aguarda-input {
      border-color: #8b5cf6;
      background: rgba(139, 92, 246, 0.05);
    }

    .flow-node--confirmacao {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.05);
    }

    .flow-node--transferencia {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }

    .flow-node--resultado-api {
      border-color: #06b6d4;
      background: rgba(6, 182, 212, 0.05);
    }

    .flow-node--mensagem {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
    }

    .flow-node--encerramento {
      border-color: #6b7280;
      background: rgba(107, 114, 128, 0.05);
    }

    .node-header {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--color-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .node-header i {
      font-size: 0.75rem;
    }

    .node-body {
      flex: 1;
      overflow: hidden;
    }

    .node-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
      word-break: break-word;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: background var(--transition-fast);
    }

    .node-label:hover {
      background: var(--color-border);
    }

    .node-input {
      font-size: 0.8rem;
      padding: 0.375rem;
      border: 1px solid var(--color-primary);
      border-radius: 4px;
      background: var(--color-bg);
      color: var(--color-text);
    }

    .node-content {
      margin-top: 0.375rem;
      padding: 0.5rem;
      background: var(--color-bg);
      border-radius: 4px;
      border-left: 2px solid var(--color-primary);
    }

    .node-text {
      font-size: 0.65rem;
      margin: 0;
      line-height: 1.3;
      color: var(--color-muted);
      white-space: pre-wrap;
      word-break: break-word;
      font-family: 'Fira Code', monospace;
    }

    .node-meta {
      margin-top: 0.375rem;
      font-size: 0.65rem;
      color: var(--color-subtle);
    }

    .node-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.65rem;
      border-top: 1px solid var(--color-border);
      padding-top: var(--spacing-xs);
    }

    .node-info {
      color: var(--color-muted);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .node-btn {
      width: 20px;
      height: 20px;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6rem;
      transition: all var(--transition-fast);
    }

    .node-btn:hover {
      background: var(--color-primary-hover);
      transform: scale(1.1);
    }

    .node-handle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--color-primary);
      border-radius: 50%;
      opacity: 0;
      cursor: crosshair;
      transition: opacity var(--transition-fast);
    }

    .node-handle-top {
      top: -4px;
      left: 50%;
      transform: translateX(-50%);
    }

    .node-handle-right {
      right: -4px;
      top: 50%;
      transform: translateY(-50%);
    }

    .node-handle-bottom {
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
    }

    .node-handle-left {
      left: -4px;
      top: 50%;
      transform: translateY(-50%);
    }

    .flow-node:hover .node-handle {
      opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        transition: none !important;
        animation: none !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowNodeComponent {
  @Input() node!: FluxoNodeResponse;
  @Output() nodeUpdated = new EventEmitter<FluxoNodeResponse>();
  @Output() nodeDragged = new EventEmitter<{ nodeId: string; x: number; y: number }>();

  isEditing = signal(false);
  editingLabel = signal('');

  private dragStart: { x: number; y: number } | null = null;

  @HostListener('drag', ['$event'])
  onDrag(event: DragEvent) {
    if (event.clientX === 0 && event.clientY === 0) return;
    
    if (!this.dragStart) {
      this.dragStart = { x: event.clientX, y: event.clientY };
    }

    const element = event.target as HTMLElement;
    const rect = element.getBoundingClientRect();
    const x = Math.max(0, event.clientX - (rect.width / 2));
    const y = Math.max(0, event.clientY - (rect.height / 2));

    this.nodeDragged.emit({
      nodeId: this.node.id,
      x,
      y
    });
  }

  @HostListener('dragend')
  onDragEnd() {
    this.dragStart = null;
  }

  startEdit() {
    this.editingLabel.set(this.node.label);
    this.isEditing.set(true);
  }

  saveLabel() {
    const label = this.editingLabel();
    if (label.trim()) {
      this.node.label = label;
      this.nodeUpdated.emit(this.node);
    }
    this.isEditing.set(false);
  }

  onEdit() {
    console.log('Editar nó:', this.node);
  }

  getNodeType(tipo: string): string {
    return tipo.toLowerCase().replace(/_/g, '-');
  }

  getNodeIcon(tipo: string): string {
    const icons: { [key: string]: string } = {
      [TipoNode.MENU]: 'fa-solid fa-bars',
      [TipoNode.AGUARDA_INPUT]: 'fa-solid fa-keyboard',
      [TipoNode.CONFIRMACAO]: 'fa-solid fa-circle-check',
      [TipoNode.TRANSFERENCIA]: 'fa-solid fa-arrow-right-arrow-left',
      [TipoNode.RESULTADO_API]: 'fa-solid fa-plug',
      [TipoNode.MENSAGEM]: 'fa-solid fa-comment-dots',
      [TipoNode.ENCERRAMENTO]: 'fa-solid fa-circle-stop'
    };
    return icons[tipo] || 'fa-solid fa-circle';
  }

  truncate(text: string, length: number = 40): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}
