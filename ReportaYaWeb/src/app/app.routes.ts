import { Routes } from '@angular/router';
import { Inicio } from './paginas/inicio/inicio';
import { Listadeusuarios } from './paginas/listadeusuarios/listadeusuarios';
import { Login } from './paginas/login/login';
import { Menu } from './paginas/menu/menu';
import { AlertasVecinales } from './paginas/alertasvecinales/alertasvecinales';
import { CamarasSolicitadas } from './paginas/camarassolicitadas/camarassolicitadas';
import { Multas } from './paginas/multas/multas';
import { Crearusuario } from './paginas/crearusuario/crearusuario';
import { Mapa } from './paginas/mapa/mapa';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Public
  { path: 'login', component: Login },

  // Protegidas
  { path: 'menu', component: Menu, canActivate: [AuthGuard], data: { roles: ['admin', 'camaras', 'multas'] } },

  // Alertas vecinales — una sola instancia del componente por ruta
  {
    path: 'alertasvecinales',
    component: AlertasVecinales,
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'camaras'] }
  },
  {
    path: 'alertasvecinales/sin-completar',
    component: AlertasVecinales,
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'camaras'] }
  },
  {
    path: 'alertasvecinales/completadas',
    component: AlertasVecinales,
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'camaras'] }
  },

  { path: 'camarassolicitadas', component: CamarasSolicitadas, canActivate: [AuthGuard], data: { roles: ['admin', 'camaras'] } },

  { path: 'mapa', component: Mapa, canActivate: [AuthGuard], data: { roles: ['admin', 'camaras', 'ciudadano'] } },

  { path: 'multas', component: Multas, canActivate: [AuthGuard], data: { roles: ['admin', 'multas'] } },

  {
    path: 'partedetalle/:id',
    loadComponent: () => import('./paginas/partedetalle/partedetalle').then(m => m.Partedetalle),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'multas'] }
  },

  { path: 'crearusuario', component: Crearusuario, canActivate: [AuthGuard], data: { roles: ['admin'] } },

  {
    path: 'alertadetalle/:id',
    loadComponent: () => import('./paginas/alertadetalle/alertadetalle').then(m => m.Alertadetalle),
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'camaras'] }
  },

  {
    path: 'listadeusuarios',
    loadComponent: () => import('./paginas/listadeusuarios/listadeusuarios').then(m => m.Listadeusuarios),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },

  // Otras rutas (si tienes 'inicio' en uso, mantenla protegida)
  { path: 'inicio', component: Inicio, canActivate: [AuthGuard], data: { roles: ['admin', 'camaras', 'multas', 'ciudadano'] } },

  // Catch-all
  { path: '**', redirectTo: '' }
];
