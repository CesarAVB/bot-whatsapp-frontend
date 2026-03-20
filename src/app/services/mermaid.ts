import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class MermaidService {
  private doc = inject(DOCUMENT);
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.loadViaScript();
      this.initialized = true;
    } catch (error) {
      console.warn('Mermaid não disponível', error);
    }
  }

  private loadViaScript(): Promise<any> {
    return new Promise((resolve, reject) => {
      if ((window as any).mermaid) {
        resolve((window as any).mermaid);
        return;
      }

      const script = this.doc.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.async = true;
      script.onload = () => {
        const mermaid = (window as any).mermaid;
        if (mermaid) {
          mermaid.initialize({ startOnLoad: true, theme: 'dark' });
          resolve(mermaid);
        }
      };
      script.onerror = () => {
        console.error('Erro ao carregar Mermaid');
        reject(new Error('Failed to load Mermaid'));
      };
      this.doc.body.appendChild(script);
    });
  }

  async render(element: HTMLElement) {
    try {
      const mermaid = (window as any).mermaid;
      if (mermaid && mermaid.run) {
        await mermaid.run();
      }
    } catch (error) {
      console.warn('Erro ao renderizar Mermaid', error);
    }
  }
}
