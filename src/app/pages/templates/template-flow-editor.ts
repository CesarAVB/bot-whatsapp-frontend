import { Component, OnInit, inject, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { signal, computed } from '@angular/core';
import { FluxoBotService } from '../../services/fluxo-bot';
import { FluxoBotResponse, FluxoNodeResponse, FluxoArestaResponse } from '../../shared/models/fluxo-bot-response';

@Component({
  selector: 'app-template-flow-editor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="flow-editor-container">
      <div class="flow-header">
        <a routerLink="/templates" class="flow-back">
          <i class="fa-solid fa-chevron-left"></i>
          Voltar
        </a>
        <h1><i class="fa-solid fa-code-branch me-2"></i>Editor de Fluxo</h1>
        <div class="flow-actions">
          <button class="btn btn-sm btn-outline-secondary" (click)="resetLayout()">
            <i class="fa-solid fa-rotate-left me-1"></i>Resetar Layout
          </button>
        </div>
      </div>

      <div class="flow-content">
        @if (flowData()) {
          <app-flow-canvas 
            [nodes]="nodes()"
            [arestas]="arestas()"
            (nodeUpdated)="onNodeUpdated($any($event))"
            (arestaCreated)="onArestaCreated($any($event))"
          />
        } @else {
          <div class="flow-loading">
            <div class="spinner-small"></div>
            <p>Carregando fluxo...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .flow-editor-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--color-bg);
    }

    .flow-header {
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      background: var(--color-surface);
    }

    .flow-back {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
      transition: color var(--transition-fast);
      cursor: pointer;
    }

    .flow-back:hover {
      color: var(--color-primary-hover);
    }

    .flow-header h1 {
      font-size: 1.375rem;
      color: var(--color-text);
      margin: 0;
      flex: 1;
    }

    .flow-actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    .flow-content {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .flow-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: var(--spacing-md);
      color: var(--color-muted);
    }

    .spinner-small {
      width: 2rem;
      height: 2rem;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateFlowEditorComponent implements OnInit {
  private fluxoService = inject(FluxoBotService);

  flowData = signal<FluxoBotResponse | null>(null);
  nodes = computed(() => this.flowData()?.nodes ?? []);
  arestas = computed(() => this.flowData()?.arestas ?? []);

  ngOnInit() {
    this.loadFluxo();
  }

  private loadFluxo() {
    this.fluxoService.getFluxoCompleto().subscribe({
      next: (data) => this.flowData.set(data),
      error: (err) => console.error('Erro ao carregar fluxo', err)
    });
  }

  onNodeUpdated(node: FluxoNodeResponse) {
    // Atualizar nó no estado
    const current = this.flowData();
    if (current) {
      const updated = {
        ...current,
        nodes: current.nodes.map(n => n.id === node.id ? node : n)
      };
      this.flowData.set(updated);
    }
  }

  onArestaCreated(aresta: FluxoArestaResponse) {
    // Adicionar nova aresta
    const current = this.flowData();
    if (current) {
      const updated = {
        ...current,
        arestas: [...current.arestas, aresta]
      };
      this.flowData.set(updated);
    }
  }

  resetLayout() {
    this.loadFluxo();
  }
}

