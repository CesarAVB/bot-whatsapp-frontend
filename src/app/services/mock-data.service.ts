import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { DashboardMetricasResponse } from '../shared/models/dashboard-metricas-response';
import { BotState } from '../shared/enums/bot-state';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  /**
   * Retorna dados mock para dashboard (simula delay de rede de 500ms)
   */
  getDashboardMetricasMock(): Observable<DashboardMetricasResponse> {
    const data: DashboardMetricasResponse = {
      totalConversas: 1250,
      totalPorEstado: {
        [BotState.MENU_INICIAL]: 120,
        [BotState.SOU_CLIENTE]: 95,
        [BotState.FINANCEIRO]: 78,
        [BotState.AGUARDA_CPF_FATURA]: 32,
        [BotState.AGUARDA_CPF_DESBLOQUEIO]: 28,
        [BotState.CONFIRMA_IDENTIDADE_FATURA]: 15,
        [BotState.CONFIRMA_IDENTIDADE_DESBLOQUEIO]: 12,
        [BotState.TRANSFERIDO]: 45,
        [BotState.ENCERRADO]: 825
      }
    };

    return of(data).pipe(delay(500));
  }
}
