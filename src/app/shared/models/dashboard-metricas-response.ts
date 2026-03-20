import { BotState } from '../enums/bot-state';
export interface DashboardMetricasResponse {
  totalPorEstado: Record<BotState, number>;
  totalConversas: number;
}
