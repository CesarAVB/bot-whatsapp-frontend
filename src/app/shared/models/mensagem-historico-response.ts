import { Direcao } from '../enums/direcao';
export interface MensagemHistoricoResponse {
  direcao: Direcao;
  conteudo: string;
  createdAt: string;
}
