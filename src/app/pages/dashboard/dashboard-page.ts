import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from './dashboard';
import { AlertService } from '../../services/alert';
import { DashboardMetricasResponse } from '../../shared/models/dashboard-metricas-response';
import { BotState } from '../../shared/enums/bot-state';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css'
})
export class DashboardPage implements OnInit {
  private readonly service = inject(DashboardService);
  private readonly alertService = inject(AlertService);

  metricas: DashboardMetricasResponse | null = null;
  // Expor o enum para uso no template (ex: getTotal(BotState.TRANSFERIDO))
  readonly BotState = BotState;
  readonly estadosAtivos: BotState[] = [
    BotState.MENU_INICIAL, BotState.SOU_CLIENTE, BotState.FINANCEIRO,
    BotState.AGUARDA_CPF_FATURA, BotState.AGUARDA_CPF_DESBLOQUEIO,
    BotState.CONFIRMA_IDENTIDADE_FATURA, BotState.CONFIRMA_IDENTIDADE_DESBLOQUEIO,
    BotState.TRANSFERIDO, BotState.ENCERRADO
  ];

  ngOnInit(): void {
    this.carregarMetricas();
  }

  carregarMetricas(): void {
    this.service.buscarMetricas().subscribe({
      next: (data) => this.metricas = data,
      error: () => this.alertService.erro('Erro ao carregar métricas.')
    });
  }

  getTotal(estado: BotState): number {
    return this.metricas?.totalPorEstado?.[estado] ?? 0;
  }

  getEstadoLabel(estado: BotState): string {
    const labels: Record<BotState, string> = {
      [BotState.MENU_INICIAL]: 'Menu Inicial',
      [BotState.SOU_CLIENTE]: 'Sou Cliente',
      [BotState.FINANCEIRO]: 'Financeiro',
      [BotState.AGUARDA_CPF_FATURA]: 'Aguarda CPF (Fatura)',
      [BotState.AGUARDA_CPF_DESBLOQUEIO]: 'Aguarda CPF (Desbloqueio)',
      [BotState.CONFIRMA_IDENTIDADE_FATURA]: 'Confirma Identidade (Fatura)',
      [BotState.CONFIRMA_IDENTIDADE_DESBLOQUEIO]: 'Confirma Identidade (Desbloqueio)',
      [BotState.TRANSFERIDO]: 'Com Atendente',
      [BotState.ENCERRADO]: 'Encerrado'
    };
    return labels[estado] ?? estado;
  }

  getEstadoIcone(estado: BotState): string {
    const icones: Record<BotState, string> = {
      [BotState.MENU_INICIAL]: 'fa-house',
      [BotState.SOU_CLIENTE]: 'fa-user',
      [BotState.FINANCEIRO]: 'fa-coins',
      [BotState.AGUARDA_CPF_FATURA]: 'fa-id-card',
      [BotState.AGUARDA_CPF_DESBLOQUEIO]: 'fa-lock-open',
      [BotState.CONFIRMA_IDENTIDADE_FATURA]: 'fa-circle-check',
      [BotState.CONFIRMA_IDENTIDADE_DESBLOQUEIO]: 'fa-circle-check',
      [BotState.TRANSFERIDO]: 'fa-headset',
      [BotState.ENCERRADO]: 'fa-circle-xmark'
    };
    return icones[estado] ?? 'fa-circle';
  }
}
