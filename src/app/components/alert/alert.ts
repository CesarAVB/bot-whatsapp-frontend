import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert';
@Component({ selector: 'app-alert', standalone: true, imports: [CommonModule], templateUrl: './alert.html', styleUrl: './alert.css' })
export class AlertComponent {
  protected readonly alertService = inject(AlertService);
  get classeBootstrap(): string {
    const mapa: Record<string, string> = { sucesso: 'alert-success', erro: 'alert-danger', aviso: 'alert-warning', info: 'alert-info' };
    return mapa[this.alertService.alerta()?.tipo ?? ''] ?? '';
  }
}
