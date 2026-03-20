import { Injectable, signal } from '@angular/core';
export interface Alerta { tipo: 'sucesso' | 'erro' | 'aviso' | 'info'; mensagem: string; }
@Injectable({ providedIn: 'root' })
export class AlertService {
  readonly alerta = signal<Alerta | null>(null);
  sucesso(mensagem: string): void { this.alerta.set({ tipo: 'sucesso', mensagem }); setTimeout(() => this.alerta.set(null), 4000); }
  erro(mensagem: string): void { this.alerta.set({ tipo: 'erro', mensagem }); setTimeout(() => this.alerta.set(null), 5000); }
  limpar(): void { this.alerta.set(null); }
}
