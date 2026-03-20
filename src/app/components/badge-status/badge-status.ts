import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({ selector: 'app-badge-status', standalone: true, imports: [CommonModule], templateUrl: './badge-status.html', styleUrl: './badge-status.css' })
export class BadgeStatusComponent {
  @Input() valor = '';
  get classeBootstrap(): string {
    const v = this.valor?.toUpperCase();
    if (['MENU_INICIAL', 'SOU_CLIENTE', 'FINANCEIRO'].includes(v)) return 'bg-primary';
    if (['TRANSFERIDO'].includes(v)) return 'bg-warning text-dark';
    if (['ENCERRADO'].includes(v)) return 'bg-secondary';
    if (['AGUARDA_CPF_FATURA','AGUARDA_CPF_DESBLOQUEIO','CONFIRMA_IDENTIDADE_FATURA','CONFIRMA_IDENTIDADE_DESBLOQUEIO'].includes(v)) return 'bg-info text-dark';
    if (['RECEBIDA'].includes(v)) return 'bg-success';
    if (['ENVIADA'].includes(v)) return 'bg-primary';
    return 'bg-secondary';
  }
}
