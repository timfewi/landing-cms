import { Routes } from '@angular/router';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./modules/landing-page/components/page-viewer/page-viewer.component').then(c => c.PageViewerComponent)
  },
  {
    path: 'page/:slug',
    loadComponent: () => import('./modules/landing-page/components/page-viewer/page-viewer.component').then(c => c.PageViewerComponent)
  },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./modules/admin/pages/dashboard/dashboard.component').then(c => c.DashboardComponent)
      },
      {
        path: 'pages',
        children: [
          {
            path: '',
            loadComponent: () => import('./modules/admin/components/pages-list/pages-list.component').then(c => c.PagesListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./modules/admin/editor/editor.component').then(c => c.EditorComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./modules/admin/editor/editor.component').then(c => c.EditorComponent)
          }
        ]
      },
      {
        path: 'editor',
        redirectTo: 'pages/new'
      },
      {
        path: 'editor/:id',
        redirectTo: 'pages/edit/:id',
        pathMatch: 'prefix'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
