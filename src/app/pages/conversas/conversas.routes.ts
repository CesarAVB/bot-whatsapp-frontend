import { Routes } from '@angular/router';
export const CONVERSAS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./conversa-list').then(m => m.ConversaListPage) },
  { path: ':phone', loadComponent: () => import('./conversa-detail').then(m => m.ConversaDetailPage) }
];
