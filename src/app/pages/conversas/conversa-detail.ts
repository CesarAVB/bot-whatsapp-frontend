import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ConversasService } from './conversas';
import { AlertService } from '../../services/alert';
import { ConversaDetalheResponse } from '../../shared/models/conversa-detalhe-response';
import { BadgeStatusComponent } from '../../components/badge-status/badge-status';
import { Direcao } from '../../shared/enums/direcao';

@Component({
  selector: 'app-conversa-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, BadgeStatusComponent],
  templateUrl: './conversa-detail.html',
  styleUrl: './conversa-detail.css'
})
export class ConversaDetailPage implements OnInit {
  private readonly service = inject(ConversasService);
  private readonly alertService = inject(AlertService);
  private readonly route = inject(ActivatedRoute);

  conversa: ConversaDetalheResponse | null = null;
  readonly Direcao = Direcao;

  ngOnInit(): void {
    const phone = this.route.snapshot.paramMap.get('phone')!;
    this.service.buscarPorPhone(phone).subscribe({
      next: (data) => this.conversa = data,
      error: () => this.alertService.erro('Conversa não encontrada.')
    });
  }
}
