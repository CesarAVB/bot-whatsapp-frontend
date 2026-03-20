import { Component, OnInit, inject, ChangeDetectionStrategy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { signal, computed } from '@angular/core';
import { MermaidService } from '../../services/mermaid';
import { FluxoBotService } from '../../services/fluxo-bot';
import { FluxoBotResponse, TipoNode } from '../../shared/models/fluxo-bot-response';

@Component({
  selector: 'app-template-flow-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flow-container">
      <div class="flow-header">
        <a routerLink="/templates" class="flow-back">
          <i class="fa-solid fa-chevron-left"></i>
          Voltar
        </a>
        <h1><i class="fa-solid fa-code-branch me-2"></i>Fluxo de Atendimento</h1>
      </div>
      
      <div class="flow-canvas" #canvas>
        @if (flowData()) {
          @if (flowDiagram()) {
            <pre #mermaidContent class="mermaid">{{ flowDiagram() }}</pre>
          } @else {
            <div class="flow-empty">
              <p>Fluxo carregado, mas não há nós para renderizar.</p>
              <pre class="flow-debug">{{ flowData() | json }}</pre>
            </div>
          }
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
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .flow-container {
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

    .flow-canvas {
      flex: 1;
      overflow: auto;
      padding: var(--spacing-2xl);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mermaid {
      background: transparent;
      color: var(--color-text);
      max-width: 100%;
    }

    .flow-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
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
export class TemplateFlowViewerComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private mermaidService = inject(MermaidService);
  private fluxoService = inject(FluxoBotService);
  
  @ViewChild('canvas') canvas!: ElementRef;
  @ViewChild('mermaidContent') mermaidContent!: ElementRef;
  
  templateId = signal<string>('');
  flowData = signal<FluxoBotResponse | null>(null);
  flowDiagram = computed(() => {
    const data = this.flowData();
    if (!data) return '';
    return this.generateMermaidDiagram(data);
  });

  async ngOnInit() {
    await this.mermaidService.initialize();
    this.loadFluxo();
  }

  async ngAfterViewInit() {
    await this.mermaidService.render(this.canvas.nativeElement);
  }

  private loadFluxo() {
    this.fluxoService.getFluxoCompleto().subscribe({
      next: (data) => {
        this.flowData.set(data);
        // Re-render Mermaid quando dados mudam
        setTimeout(() => this.mermaidService.render(this.canvas.nativeElement), 100);
      },
      error: (err) => {
        console.error('Erro ao carregar fluxo', err);
        this.flowData.set(null);
      }
    });
  }

  private generateMermaidDiagram(data: FluxoBotResponse): string {
    if (!data?.nodes || data.nodes.length === 0) return '';

    let diagram = 'graph TD\n';

    // Adicionar nós
    data.nodes.forEach(node => {
      const nodeId = this.sanitizeId(node.id);
      const label = this.truncateLabel(node.label);
      const nodeClass = this.getNodeClass(node.tipo);
      diagram += `  ${nodeId}["${label}"]:::${nodeClass}\n`;
    });

    // Adicionar arestas
    data.arestas?.forEach(aresta => {
      const deId = this.sanitizeId(aresta.de);
      const paraId = this.sanitizeId(aresta.para);
      const label = aresta.condicao || aresta.label || '';
      
      if (label) {
        diagram += `  ${deId} -->|${label}| ${paraId}\n`;
      } else {
        diagram += `  ${deId} --> ${paraId}\n`;
      }
    });

    // Definir estilos por tipo
    diagram += `\n  classDef menu fill:#3b82f6,stroke:#1e40af,color:#fff,stroke-width:2px\n`;
    diagram += `  classDef aguarda fill:#8b5cf6,stroke:#6d28d9,color:#fff,stroke-width:2px\n`;
    diagram += `  classDef confirmacao fill:#f59e0b,stroke:#d97706,color:#fff,stroke-width:2px\n`;
    diagram += `  classDef transferencia fill:#ef4444,stroke:#b91c1c,color:#fff,stroke-width:2px\n`;
    diagram += `  classDef api fill:#06b6d4,stroke:#0369a1,color:#fff,stroke-width:2px\n`;
    diagram += `  classDef mensagem fill:#10b981,stroke:#047857,color:#fff,stroke-width:2px\n`;
    diagram += `  classDef encerramento fill:#6b7280,stroke:#374151,color:#fff,stroke-width:2px\n`;

    return diagram;
  }

  private getNodeClass(tipo: string): string {
    switch (tipo) {
      case TipoNode.MENU:
        return 'menu';
      case TipoNode.AGUARDA_INPUT:
        return 'aguarda';
      case TipoNode.CONFIRMACAO:
        return 'confirmacao';
      case TipoNode.TRANSFERENCIA:
        return 'transferencia';
      case TipoNode.RESULTADO_API:
        return 'api';
      case TipoNode.MENSAGEM:
        return 'mensagem';
      case TipoNode.ENCERRAMENTO:
        return 'encerramento';
      default:
        return 'mensagem';
    }
  }

  private sanitizeId(id: string): string {
    // Remove caracteres especiais e espaços
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private truncateLabel(label: string, maxLength: number = 30): string {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength) + '...';
  }
}

