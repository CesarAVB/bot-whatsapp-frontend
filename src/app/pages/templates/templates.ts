import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from '../../services/http-base';
import { BotTemplateResponse } from '../../shared/models/bot-template-response';
import { BotTemplateAuditoriaResponse } from '../../shared/models/bot-template-auditoria-response';
import { AtualizarTemplateRequest } from '../../shared/models/atualizar-template-request';

@Injectable({ providedIn: 'root' })
export class TemplatesService {
  private readonly http = inject(HttpBaseService);

  listar(): Observable<BotTemplateResponse[]> {
    return this.http.get<BotTemplateResponse[]>('/templates');
  }

  buscarPorChave(chave: string): Observable<BotTemplateResponse> {
    return this.http.get<BotTemplateResponse>(`/templates/${encodeURIComponent(chave)}`);
  }

  atualizar(chave: string, request: AtualizarTemplateRequest): Observable<BotTemplateResponse> {
    return this.http.put<BotTemplateResponse>(`/templates/${encodeURIComponent(chave)}`, request);
  }

  buscarAuditoria(chave: string): Observable<BotTemplateAuditoriaResponse[]> {
    return this.http.get<BotTemplateAuditoriaResponse[]>(`/templates/${encodeURIComponent(chave)}/auditoria`);
  }
}
