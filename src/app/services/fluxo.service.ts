import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpBaseService } from './http-base';
import {
  FluxoBotCompletoResponse,
  AtualizarPosicaoNodeRequest,
  CriarArestaRequest,
  AtualizarMensagemRequest,
  SuccessResponse,
  FluxoNodeAtualizado,
  FluxoAresta,
  TipoNodeAtualizado
} from '../shared/models/fluxo-node-updated';

// ─── Mock data (usado quando a API /fluxo não está disponível) ────────────────
const MOCK_FLUXO: FluxoBotCompletoResponse = {
  botId: 'bot-asb-001',
  nodoInicial: 'menu-inicial',
  versionado: false,
  nodes: [
    {
      id: 'menu-inicial',
      tipo: TipoNodeAtualizado.MENU,
      label: 'Menu Inicial',
      mensagens: [
        {
          chave: 'menu_boas_vindas',
          texto: 'Olá! 👋 Seja bem-vindo ao *ASB Bot*.\n\nComo posso te ajudar hoje?',
          ordem: 1
        },
        {
          chave: 'menu_opcoes',
          texto: '1️⃣ Sou cliente\n2️⃣ Falar com atendente',
          ordem: 2
        }
      ],
      posX: 80,
      posY: 240,
      ativo: true,
      criadoEm: '2026-01-01T00:00:00Z'
    },
    {
      id: 'sou-cliente',
      tipo: TipoNodeAtualizado.MENU,
      label: 'Sou Cliente',
      mensagens: [
        {
          chave: 'sou_cliente_intro',
          texto: 'Ótimo! Sobre o que você precisa de ajuda?',
          ordem: 1
        },
        {
          chave: 'sou_cliente_opcoes',
          texto: '1️⃣ Segunda via de fatura\n2️⃣ Desbloqueio de linha\n3️⃣ Outras dúvidas',
          ordem: 2
        }
      ],
      posX: 420,
      posY: 80,
      ativo: true,
      criadoEm: '2026-01-01T00:00:00Z'
    },
    {
      id: 'aguarda-cpf-fatura',
      tipo: TipoNodeAtualizado.AGUARDA_INPUT,
      label: 'Aguarda CPF (Fatura)',
      mensagens: [
        {
          chave: 'aguarda_cpf_fatura',
          texto: 'Por favor, informe o *CPF* do titular da linha para consultar sua fatura. 📄',
          ordem: 1
        }
      ],
      posX: 760,
      posY: 20,
      ativo: true,
      criadoEm: '2026-01-01T00:00:00Z'
    },
    {
      id: 'aguarda-cpf-desbloqueio',
      tipo: TipoNodeAtualizado.AGUARDA_INPUT,
      label: 'Aguarda CPF (Desbloqueio)',
      mensagens: [
        {
          chave: 'aguarda_cpf_desbloqueio',
          texto: 'Informe o *CPF* do titular para prosseguir com o desbloqueio. 🔓',
          ordem: 1
        }
      ],
      posX: 760,
      posY: 180,
      ativo: true,
      criadoEm: '2026-01-01T00:00:00Z'
    },
    {
      id: 'financeiro',
      tipo: TipoNodeAtualizado.RESULTADO_API,
      label: 'Financeiro',
      mensagens: [
        {
          chave: 'financeiro_msg',
          texto: 'Consultando informações financeiras... ⏳',
          ordem: 1
        }
      ],
      posX: 760,
      posY: 340,
      ativo: true,
      criadoEm: '2026-01-01T00:00:00Z'
    },
    {
      id: 'confirma-fatura',
      tipo: TipoNodeAtualizado.CONFIRMACAO,
      label: 'Confirmação Identidade (Fatura)',
      mensagens: [
        {
          chave: 'confirma_fatura',
          texto: 'Encontrei seu cadastro! Para sua segurança, confirme: o CPF informado termina em *XXX*?',
          ordem: 1
        },
        {
          chave: 'confirma_fatura_opcoes',
          texto: '1️⃣ Sim, confirmo\n2️⃣ Não, é outro CPF',
          ordem: 2
        }
      ],
      posX: 1100,
      posY: 20,
      ativo: true,
      criadoEm: '2026-01-01T00:00:00Z'
    },
    {
      id: 'confirma-desbloqueio',
      tipo: TipoNodeAtualizado.CONFIRMACAO,
      label: 'Confirmação Identidade (Desbloqueio)',
      mensagens: [
        {
          chave: 'confirma_desbloqueio',
          texto: 'Identidade confirmada. Deseja prosseguir com o desbloqueio da linha?',
          ordem: 1
        },
        {
          chave: 'confirma_desbloqueio_opcoes',
          texto: '1️⃣ Sim, desbloquear\n2️⃣ Cancelar',
          ordem: 2
        }
      ],
      posX: 1100,
      posY: 180,
      ativo: true,
      criadoEm: '2026-01-01T00:00:00Z'
    },
    {
      id: 'transferido',
      tipo: TipoNodeAtualizado.TRANSFERENCIA,
      label: 'Transferido',
      mensagens: [
        {
          chave: 'transferido_msg',
          texto: 'Um momento! Estou te transferindo para um de nossos atendentes. 👨‍💼\n\nTempo médio de espera: *5 minutos*.',
          ordem: 1
        }
      ],
      propriedades: { equipeTransferencia: 'Suporte Geral' },
      posX: 420,
      posY: 420,
      ativo: true,
      criadoEm: '2026-01-01T00:00:00Z'
    },
    {
      id: 'encerrado',
      tipo: TipoNodeAtualizado.ENCERRAMENTO,
      label: 'Encerrado',
      mensagens: [
        {
          chave: 'encerrado_msg',
          texto: 'Atendimento encerrado. Obrigado por entrar em contato com a *ASB*! 😊\n\nHave a great day! 🌟',
          ordem: 1
        }
      ],
      posX: 1100,
      posY: 420,
      ativo: true,
      criadoEm: '2026-01-01T00:00:00Z'
    }
  ],
  arestas: [
    { id: 'a01', de: 'menu-inicial', para: 'sou-cliente', condicao: '1', label: '1' },
    { id: 'a02', de: 'menu-inicial', para: 'transferido', condicao: '2', label: 'Atendente' },
    { id: 'a03', de: 'sou-cliente', para: 'aguarda-cpf-fatura', condicao: '1', label: 'Fatura' },
    { id: 'a04', de: 'sou-cliente', para: 'aguarda-cpf-desbloqueio', condicao: '2', label: 'Desbloqueio' },
    { id: 'a05', de: 'sou-cliente', para: 'financeiro', condicao: '3', label: 'Outras' },
    { id: 'a06', de: 'aguarda-cpf-fatura', para: 'confirma-fatura', condicao: 'cpf_valido', label: 'CPF ✓' },
    { id: 'a07', de: 'aguarda-cpf-desbloqueio', para: 'confirma-desbloqueio', condicao: 'cpf_valido', label: 'CPF ✓' },
    { id: 'a08', de: 'financeiro', para: 'encerrado', condicao: 'auto', label: 'auto' },
    { id: 'a09', de: 'confirma-fatura', para: 'encerrado', condicao: '1', label: 'Confirma' },
    { id: 'a10', de: 'confirma-fatura', para: 'transferido', condicao: '2', label: 'Transfere' },
    { id: 'a11', de: 'confirma-desbloqueio', para: 'encerrado', condicao: '1', label: 'Confirma' },
    { id: 'a12', de: 'confirma-desbloqueio', para: 'transferido', condicao: '2', label: 'Transfere' }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FluxoService {
  private http = inject(HttpBaseService);

  getFluxoCompleto(): Observable<FluxoBotCompletoResponse> {
    return this.http.get<FluxoBotCompletoResponse>('/fluxo').pipe(
      catchError(() => of(MOCK_FLUXO))
    );
  }

  atualizarPosicaoNode(nodeId: string, request: AtualizarPosicaoNodeRequest): Observable<SuccessResponse> {
    return this.http.put<SuccessResponse>(`/fluxo/nodes/${nodeId}`, request).pipe(
      catchError(() => of({ sucesso: true }))
    );
  }

  criarAresta(request: CriarArestaRequest): Observable<FluxoAresta> {
    const mock: FluxoAresta = {
      id: `a-${Date.now()}`,
      de: request.de,
      para: request.para,
      condicao: request.condicao,
      label: request.label
    };
    return this.http.post<FluxoAresta>('/fluxo/conexoes', request).pipe(
      catchError(() => of(mock))
    );
  }

  deletarAresta(arestaId: string): Observable<SuccessResponse> {
    return this.http.delete<SuccessResponse>(`/fluxo/conexoes/${arestaId}`).pipe(
      catchError(() => of({ sucesso: true }))
    );
  }

  atualizarMensagem(chave: string, request: AtualizarMensagemRequest): Observable<SuccessResponse> {
    return this.http.put<SuccessResponse>(`/templates/${chave}`, request).pipe(
      catchError(() => of({ sucesso: true }))
    );
  }

  deletarNode(nodeId: string): Observable<SuccessResponse> {
    return this.http.delete<SuccessResponse>(`/fluxo/nodes/${nodeId}`).pipe(
      catchError(() => of({ sucesso: true }))
    );
  }

  criarNode(node: Partial<FluxoNodeAtualizado>): Observable<FluxoNodeAtualizado> {
    return this.http.post<FluxoNodeAtualizado>('/fluxo/nodes', node).pipe(
      catchError(() => of({
        id: `node-${Date.now()}`,
        tipo: node.tipo ?? TipoNodeAtualizado.MENSAGEM,
        mensagens: [],
        posX: node.posX ?? 200,
        posY: node.posY ?? 200,
        ativo: true,
        criadoEm: new Date().toISOString(),
        ...node
      } as FluxoNodeAtualizado))
    );
  }
}
