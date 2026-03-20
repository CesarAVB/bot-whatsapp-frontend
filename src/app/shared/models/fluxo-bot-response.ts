export interface FluxoBotResponse {
  nodes: FluxoNodeResponse[];
  arestas: FluxoArestaResponse[];
}

export interface FluxoNodeResponse {
  id: string;
  label: string;
  estado?: string;
  tipo: string; // MENU, AGUARDA_INPUT, CONFIRMACAO, TRANSFERENCIA, RESULTADO_API, MENSAGEM, ENCERRAMENTO
  posX?: number;
  posY?: number;
  mensagens?: string[];
  equipeTransferencia?: string;
  horarioAtendimento?: string;
  template?: FluxoTemplateResponse;
}

export interface FluxoArestaResponse {
  id: string;
  de: string;
  para: string;
  condicao?: string; // "1", "2", "cpf_valido", "fora_horario", "auto"
  label?: string;
}

export interface FluxoTemplateResponse {
  texto?: string;
  chave?: string;
}

export enum TipoNode {
  MENU = 'MENU',
  AGUARDA_INPUT = 'AGUARDA_INPUT',
  CONFIRMACAO = 'CONFIRMACAO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  RESULTADO_API = 'RESULTADO_API',
  MENSAGEM = 'MENSAGEM',
  ENCERRAMENTO = 'ENCERRAMENTO'
}
