import { Routes } from '@angular/router';
import { RenderMode } from '@angular/ssr';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('../app/components/business/home/home.component').then(
        (m) => m.HomeComponent,
      ),
    data: {
      renderMode: RenderMode.Server, // Ahora SÍ podemos usar SSR
      preload: true,
      priority: 'high',
    },
  },
  {
    path: 'about',
    loadComponent: () =>
      import('../app/components/business/about/about.component').then(
        (m) => m.AboutComponent,
      ),
    data: {
      renderMode: RenderMode.Server, // SSR habilitado
      preload: true,
      priority: 'medium',
    },
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('../app/components/business/contact/contact.component').then(
        (m) => m.ContactComponent,
      ),
    data: {
      renderMode: RenderMode.Server, // SSR habilitado
      preload: false,
      priority: 'low',
    },
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];
