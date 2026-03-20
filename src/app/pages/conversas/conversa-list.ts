import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConversasService, PageResponse } from './conversas';
import { AlertService } from '../../services/alert';
import { ConversaResumoResponse } from '../../shared/models/conversa-resumo-response';
import { BadgeStatusComponent } from '../../components/badge-status/badge-status';

@Component({
  selector: 'app-conversa-list',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeStatusComponent],
  templateUrl: './conversa-list.html',
  styleUrl: './conversa-list.css'
})
export class ConversaListPage implements OnInit {
  private readonly service = inject(ConversasService);
  private readonly alertService = inject(AlertService);

  conversas: ConversaResumoResponse[] = [];
  totalElements = 0;
  page = 0;
  size = 20;

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.service.listar(this.page, this.size).subscribe({
      next: (data) => { this.conversas = data.content; this.totalElements = data.totalElements; },
      error: () => this.alertService.erro('Erro ao carregar conversas.')
    });
  }

  proximaPagina(): void { this.page++; this.carregar(); }
  paginaAnterior(): void { if (this.page > 0) { this.page--; this.carregar(); } }
  get totalPaginas(): number { return Math.ceil(this.totalElements / this.size); }
  formatarPhone(phone: string): string { return phone.startsWith('55') ? `+${phone.substring(0,2)} (${phone.substring(2,4)}) ${phone.substring(4,9)}-${phone.substring(9)}` : phone; }
}
