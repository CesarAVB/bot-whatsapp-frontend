import { Injectable, inject } from '@angular/core';
import { HttpBaseService } from './http-base';
import { FluxoBotResponse } from '../shared/models/fluxo-bot-response';

@Injectable({ providedIn: 'root' })
export class FluxoBotService {
  private httpBase = inject(HttpBaseService);

  getFluxoCompleto() {
    return this.httpBase.get<FluxoBotResponse>('/fluxo');
  }
}
