import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly carregando = signal(false);
  mostrar(): void { this.carregando.set(true); }
  ocultar(): void { this.carregando.set(false); }
}
