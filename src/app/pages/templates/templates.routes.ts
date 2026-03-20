import { Routes } from '@angular/router';
export const TEMPLATES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./template-list').then(m => m.TemplateListPage) },
  { path: 'view/:id', loadComponent: () => import('./template-flow-editor').then(m => m.TemplateFlowEditorComponent) },
  { path: ':chave/editar', loadComponent: () => import('./template-form').then(m => m.TemplateFormPage) }
];
