import { Routes } from '@angular/router';

export const FLUXO_ROUTES: Routes = [
  {
    path: 'editor',
    loadComponent: () => import('../templates/editor-fluxo/editor-fluxo').then(m => m.EditorFluxoComponent)
  }
];
