import { BotState } from '../enums/bot-state';
export interface ConversaResumoResponse {
  whatsappPhone: string;
  currentState: BotState;
  chatwootConversationId: number | null;
  createdAt: string;
  updatedAt: string;
}
