import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from './http-base';
import {
  FluxoBotCompletoResponse,
  AtualizarPosicaoNodeRequest,
  CriarArestaRequest,
  AtualizarMensagemRequest,
  SuccessResponse,
  FluxoNodeAtualizado,
  FluxoAresta
} from '../shared/models/fluxo-node-updated';

@Injectable({
  providedIn: 'root'
})
export class FluxoService {
  private http = inject(HttpBaseService);

  /**
   * Carregar o grafo completo do fluxo (nós + arestas)
   */
  getFluxoCompleto(): Observable<FluxoBotCompletoResponse> {
    return this.http.get<FluxoBotCompletoResponse>('/fluxo');
  }

  /**
   * Atualizar posição de um nó (PATCH /fluxo/nodes/{id})
   */
  atualizarPosicaoNode(nodeId: string, request: AtualizarPosicaoNodeRequest): Observable<SuccessResponse> {
    return this.http.put<SuccessResponse>(
      `/fluxo/nodes/${nodeId}`,
      request
    );
  }

  /**
   * Criar uma nova aresta/conexão (POST /fluxo/conexoes)
   */
  criarAresta(request: CriarArestaRequest): Observable<FluxoAresta> {
    return this.http.post<FluxoAresta>(
      `/fluxo/conexoes`,
      request
    );
  }

  /**
   * Deletar uma aresta (DELETE /fluxo/conexoes/{id})
   */
  deletarAresta(arestaId: string): Observable<SuccessResponse> {
    return this.http.delete<SuccessResponse>(
      `/fluxo/conexoes/${arestaId}`
    );
  }

  /**
   * Atualizar mensagem de um nó (PUT /templates/{chave})
   */
  atualizarMensagem(chave: string, request: AtualizarMensagemRequest): Observable<SuccessResponse> {
    return this.http.put<SuccessResponse>(
      `/templates/${chave}`,
      request
    );
  }

  /**
   * Deletar nó (DELETE /fluxo/nodes/{id})
   */
  deletarNode(nodeId: string): Observable<SuccessResponse> {
    return this.http.delete<SuccessResponse>(
      `/fluxo/nodes/${nodeId}`
    );
  }

  /**
   * Criar novo nó (POST /fluxo/nodes)
   */
  criarNode(node: Partial<FluxoNodeAtualizado>): Observable<FluxoNodeAtualizado> {
    return this.http.post<FluxoNodeAtualizado>(
      `/fluxo/nodes`,
      node
    );
  }
}
