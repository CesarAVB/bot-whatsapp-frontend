import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TemplatesService } from './templates';
import { AlertService } from '../../services/alert';
import { BotTemplateResponse } from '../../shared/models/bot-template-response';
import { BotTemplateAuditoriaResponse } from '../../shared/models/bot-template-auditoria-response';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './template-form.html',
  styleUrl: './template-form.css'
})
export class TemplateFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TemplatesService);
  private readonly alertService = inject(AlertService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  template: BotTemplateResponse | null = null;
  auditoria: BotTemplateAuditoriaResponse[] = [];
  formulario!: FormGroup;
  chave = '';
  mostrarAuditoria = false;

  ngOnInit(): void {
    this.chave = this.route.snapshot.paramMap.get('chave')!;
    this.formulario = this.fb.group({
      texto: ['', Validators.required],
      alteradoPor: ['', Validators.maxLength(100)]
    });
    this.carregarTemplate();
  }

  carregarTemplate(): void {
    this.service.buscarPorChave(this.chave).subscribe({
      next: (data) => {
        this.template = data;
        this.formulario.patchValue({ texto: data.texto });
      },
      error: () => this.alertService.erro('Template não encontrado.')
    });
  }

  carregarAuditoria(): void {
    this.mostrarAuditoria = !this.mostrarAuditoria;
    if (this.mostrarAuditoria && this.auditoria.length === 0) {
      this.service.buscarAuditoria(this.chave).subscribe({
        next: (data) => this.auditoria = data,
        error: () => this.alertService.erro('Erro ao carregar auditoria.')
      });
    }
  }

  salvar(): void {
    if (this.formulario.invalid) return;
    this.service.atualizar(this.chave, this.formulario.value).subscribe({
      next: () => {
        this.alertService.sucesso('Template atualizado com sucesso!');
        this.auditoria = [];
        this.mostrarAuditoria = false;
        this.carregarTemplate();
      },
      error: () => this.alertService.erro('Erro ao salvar template.')
    });
  }
}
