import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadChildren: () => import('./pages/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES) },
  { path: 'conversas', loadChildren: () => import('./pages/conversas/conversas.routes').then(m => m.CONVERSAS_ROUTES) },
  { path: 'templates', loadChildren: () => import('./pages/templates/templates.routes').then(m => m.TEMPLATES_ROUTES) }
];
