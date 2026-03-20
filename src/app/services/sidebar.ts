import { Injectable, inject } from '@angular/core';
import { signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private doc = inject(DOCUMENT);
  isCollapsed = signal(this.getInitialState());

  private getInitialState(): boolean {
    // Inicia recolhido em telas menores que 992px
    if (this.doc.defaultView) {
      return this.doc.defaultView.innerWidth < 992;
    }
    return false;
  }

  toggle() {
    this.isCollapsed.update(value => !value);
  }
}
