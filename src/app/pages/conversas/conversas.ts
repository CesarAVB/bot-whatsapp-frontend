import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from '../../services/http-base';
import { ConversaResumoResponse } from '../../shared/models/conversa-resumo-response';
import { ConversaDetalheResponse } from '../../shared/models/conversa-detalhe-response';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class ConversasService {
  private readonly http = inject(HttpBaseService);

  listar(page = 0, size = 20): Observable<PageResponse<ConversaResumoResponse>> {
    return this.http.get<PageResponse<ConversaResumoResponse>>(`/conversas?page=${page}&size=${size}&sort=updatedAt,desc`);
  }

  buscarPorPhone(phone: string): Observable<ConversaDetalheResponse> {
    return this.http.get<ConversaDetalheResponse>(`/conversas/${encodeURIComponent(phone)}`);
  }
}
