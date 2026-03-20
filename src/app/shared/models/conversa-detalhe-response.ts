import { BotState } from '../enums/bot-state';
import { MensagemHistoricoResponse } from './mensagem-historico-response';
export interface ConversaDetalheResponse {
  whatsappPhone: string;
  currentState: BotState;
  chatwootConversationId: number | null;
  createdAt: string;
  updatedAt: string;
  historico: MensagemHistoricoResponse[];
}
