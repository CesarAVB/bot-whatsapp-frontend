/**
 * Novo contrato do Backend para o fluxo de bots
 * Alinhado com UUIDs, sem BotState, com currentNodeKey
 */

// Enum de tipos de nós - define visual e comportamento
export enum TipoNodeAtualizado {
  MENU = 'MENU',
  CONFIRMACAO = 'CONFIRMACAO',
  AGUARDA_INPUT = 'AGUARDA_INPUT',
  TRANSFERENCIA = 'TRANSFERENCIA',
  RESULTADO_API = 'RESULTADO_API',
  MENSAGEM = 'MENSAGEM',
  ENCERRAMENTO = 'ENCERRAMENTO'
}

// Mensagem dentro de um nó
export interface MensagemNode {
  chave: string; // identificador único da mensagem (ex: msg_menu_001)
  texto: string; // conteúdo da mensagem
  ordem: number; // ordem de exibição
  alteradoPor?: string; // quem modificou por último
  alteradoEm?: string; // timestamp ISO 8601
}

// Propriedades específicas por tipo de nó
export interface PropriedadesNode {
  equipeTransferencia?: string; // Para TRANSFERENCIA: qual equipe
  urlApi?: string; // Para RESULTADO_API: endpoint a chamar
  metodoHttp?: 'GET' | 'POST' | 'PUT'; // Para RESULTADO_API
  validacaoCpf?: boolean; // Para CONFIRMACAO/AGUARDA_INPUT
}

// Um nó individual no fluxo
export interface FluxoNodeAtualizado {
  id: string; // UUID v4 - identificador único
  tipo: TipoNodeAtualizado; // tipo do nó
  label?: string; // nome/label interno (não exibido no frontend)
  mensagens: MensagemNode[]; // balões de chat
  propriedades?: PropriedadesNode; // dados específicos do tipo
  posX: number; // posição X no canvas
  posY: number; // posição Y no canvas
  ativo: boolean; // nó ativo ou desativado
  criadoEm: string; // timestamp ISO 8601
  atualizadoEm?: string;
}

// Uma aresta/conexão entre nós
export interface FluxoAresta {
  id: string; // UUID v4
  de: string; // ID do nó de origem (UUID)
  para: string; // ID do nó de destino (UUID)
  condicao?: string; // condição da rota (ex: "fora_horario", "cpf_valido", "1", "2", "auto")
  label?: string; // descrição da aresta (ex: "Resposta: Sim")
  ordem?: number; // ordem de exibição
}

// Response completo do GET /fluxo
export interface FluxoBotCompletoResponse {
  botId: string;
  nodes: FluxoNodeAtualizado[];
  arestas: FluxoAresta[];
  nodoInicial?: string; // ID do nó inicial (UUID), pode ser null
  versionado: boolean;
  versionagemEm?: string;
}

// Request para PATCH /fluxo/nodes/{id} - atualizar posição
export interface AtualizarPosicaoNodeRequest {
  posX: number;
  posY: number;
  alteradoPor?: string;
}

// Request para POST /fluxo/conexoes - criar aresta
export interface CriarArestaRequest {
  de: string; // UUID do nó origem
  para: string; // UUID do nó destino
  condicao?: string;
  label?: string;
  alteradoPor?: string;
}

// Request para PUT /templates/{chave} - atualizar mensagem
export interface AtualizarMensagemRequest {
  texto: string;
  alteradoPor?: string;
}

// Response genérico de sucesso
export interface SuccessResponse {
  sucesso: boolean;
  mensagem?: string;
  dados?: any;
}

// Conversa atualizada - sem BotState, usa currentNodeKey
export interface ConversaAtualizada {
  id: string;
  telefone: string;
  botId: string;
  currentNodeKey: string; // UUID do nó atual (antes era BotState)
  historicoMensagens: MensagemHistorico[];
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface MensagemHistorico {
  id: string;
  tipo: 'entrada' | 'saida';
  texto: string;
  timestamp: string;
}
