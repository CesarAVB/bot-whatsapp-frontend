import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge-status.html',
  styleUrl: './badge-status.css'
})
export class BadgeStatusComponent {
  @Input() valor = '';

  get classeCustom(): string {
    const v = this.valor?.toUpperCase();
    if (['MENU_INICIAL', 'SOU_CLIENTE', 'FINANCEIRO', 'ENVIADA'].includes(v)) return 'badge--primary';
    if (['TRANSFERIDO'].includes(v)) return 'badge--warning';
    if (['AGUARDA_CPF_FATURA', 'AGUARDA_CPF_DESBLOQUEIO', 'CONFIRMA_IDENTIDADE_FATURA', 'CONFIRMA_IDENTIDADE_DESBLOQUEIO'].includes(v)) return 'badge--info';
    if (['RECEBIDA'].includes(v)) return 'badge--success';
    return 'badge--secondary';
  }
}
