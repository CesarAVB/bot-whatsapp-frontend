import { Component, OnInit, inject, ChangeDetectionStrategy, signal, computed, effect, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-editor-fluxo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="editor-fluxo-container">
      <div class="editor-header">
        <h1>
          <i class="fa-solid fa-project-diagram me-2"></i>
          Editor Visual de Fluxo
        </h1>
        <div class="header-actions">
          <button class="btn btn-sm btn-primary" (click)="adicionarNode()">
            <i class="fa-solid fa-plus me-1"></i> Novo Nó
          </button>
          <button class="btn btn-sm btn-secondary" (click)="recarregarFluxo()">
            <i class="fa-solid fa-sync me-1"></i> Recarregar
          </button>
        </div>
      </div>

      <div class="editor-content">
        @if (fluxoData(); as fluxo) {
          <app-editor-fluxo-canvas
            [nodes]="fluxo.nodes"
            [arestas]="fluxo.arestas"
            (nodePositionChanged)="onNodePositionChanged($any($event))"
            (arestaSelected)="onArestaSelected($any($event))"
            (novoArestaRequest)="onNovoArestaRequest($any($event))"
            (mensagemEdicao)="onMensagemEdicao($any($event))"
          />
        } @else {
          <div class="loading-state">
            <div class="spinner-border spinner-border-sm"></div>
            <p>Carregando fluxo...</p>
          </div>
        }
      </div>

      <!-- Modal para criar aresta -->
      <app-modal-criar-aresta
        [visible]="modalCriarArestaVisivel()"
        [nodeOrigem]="nodeOrigem()"
        [nodeDestino]="nodeDestino()"
        (confirmar)="onConfirmarNovaAresta($any($event))"
        (cancelar)="fecharModalAresta()"
      />
    </div>
  `,
  styles: [`
    .editor-fluxo-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--color-bg);
    }

    .editor-header {
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      padding: var(--spacing-lg);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .editor-header h1 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--color-text);
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    .editor-content {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: var(--spacing-md);
      color: var(--color-muted);
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
export class EditorFluxoComponent implements OnInit {
  private fluxoService = inject(FluxoService);
  private alertService = inject(AlertService);

  fluxoData = signal<FluxoBotCompletoResponse | null>(null);
  modalCriarArestaVisivel = signal(false);
  nodeOrigem = signal<FluxoNodeAtualizado | null>(null);
  nodeDestino = signal<FluxoNodeAtualizado | null>(null);

  ngOnInit() {
    this.recarregarFluxo();
  }

  recarregarFluxo() {
    this.fluxoService.getFluxoCompleto().subscribe({
      next: (data) => {
        this.fluxoData.set(data);
        this.alertService.sucesso('Fluxo carregado com sucesso');
      },
      error: (err) => {
        console.error('Erro ao carregar fluxo:', err);
        this.alertService.erro('Erro ao carregar fluxo do servidor');
      }
    });
  }

  onNodePositionChanged(data: { nodeId: string; x: number; y: number }) {
    this.fluxoService.atualizarPosicaoNode(data.nodeId, {
      posX: data.x,
      posY: data.y
    }).subscribe({
      next: () => {
        const fluxo = this.fluxoData();
        if (fluxo) {
          const node = fluxo.nodes.find(n => n.id === data.nodeId);
          if (node) {
            node.posX = data.x;
            node.posY = data.y;
          }
        }
      },
      error: (err) => {
        console.error('Erro ao atualizar posição:', err);
        this.alertService.erro('Erro ao atualizar posição do nó');
      }
    });
  }

  onArestaSelected(arestaId: string) {
    const resposta = confirm('Deseja deletar esta conexão?');
    if (!resposta) return;

    this.fluxoService.deletarAresta(arestaId).subscribe({
      next: () => {
        const fluxo = this.fluxoData();
        if (fluxo) {
          fluxo.arestas = fluxo.arestas.filter(a => a.id !== arestaId);
        }
        this.alertService.sucesso('Conexão deletada');
      },
      error: (err) => {
        console.error('Erro ao deletar:', err);
        this.alertService.erro('Erro ao deletar conexão');
      }
    });
  }

  onNovoArestaRequest(data: { de: string; para: string }) {
    const fluxo = this.fluxoData();
    if (!fluxo) return;

    const nodeOrigem = fluxo.nodes.find(n => n.id === data.de);
    const nodeDestino = fluxo.nodes.find(n => n.id === data.para);

    if (!nodeOrigem || !nodeDestino) return;

    this.nodeOrigem.set(nodeOrigem);
    this.nodeDestino.set(nodeDestino);
    this.modalCriarArestaVisivel.set(true);
  }

  onConfirmarNovaAresta(data: { condicao?: string; label?: string }) {
    const origen = this.nodeOrigem();
    const destino = this.nodeDestino();

    if (!origen || !destino) return;

    this.fluxoService.criarAresta({
      de: origen.id,
      para: destino.id,
      condicao: data.condicao,
      label: data.label
    }).subscribe({
      next: (aresta) => {
        const fluxo = this.fluxoData();
        if (fluxo) {
          fluxo.arestas.push(aresta);
        }
        this.fecharModalAresta();
        this.alertService.sucesso('Conexão criada com sucesso');
      },
      error: (err) => {
        console.error('Erro ao criar aresta:', err);
        this.alertService.erro('Erro ao criar conexão');
      }
    });
  }

  fecharModalAresta() {
    this.modalCriarArestaVisivel.set(false);
    this.nodeOrigem.set(null);
    this.nodeDestino.set(null);
  }

  onMensagemEdicao(data: { nodeId: string; mensagemChave: string; novoTexto: string }) {
    this.fluxoService.atualizarMensagem(data.mensagemChave, {
      texto: data.novoTexto
    }).subscribe({
      next: () => {
        const fluxo = this.fluxoData();
        if (fluxo) {
          const node = fluxo.nodes.find(n => n.id === data.nodeId);
          const msg = node?.mensagens.find(m => m.chave === data.mensagemChave);
          if (msg) {
            msg.texto = data.novoTexto;
          }
        }
        this.alertService.sucesso('Mensagem atualizada');
      },
      error: (err) => {
        console.error('Erro ao atualizar mensagem:', err);
        this.alertService.erro('Erro ao atualizar mensagem');
      }
    });
  }

  adicionarNode() {
    // Implementar criação de novo nó com modal
    this.alertService.erro('Função não implementada ainda');
  }
}
