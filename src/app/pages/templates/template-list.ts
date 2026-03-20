import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TemplatesService } from './templates';
import { AlertService } from '../../services/alert';
import { BotTemplateResponse } from '../../shared/models/bot-template-response';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './template-list.html',
  styleUrl: './template-list.css'
})
export class TemplateListPage implements OnInit {
  private readonly service = inject(TemplatesService);
  private readonly alertService = inject(AlertService);

  templates: BotTemplateResponse[] = [];

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.service.listar().subscribe({
      next: (data) => this.templates = data,
      error: () => this.alertService.erro('Erro ao carregar templates.')
    });
  }

  preview(texto: string): string {
    return texto.length > 80 ? texto.substring(0, 80) + '…' : texto;
  }
}
