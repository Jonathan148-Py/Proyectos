import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UsuarioService } from '../servicios/usuario.service';
import { map, take, switchMap, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  private mostrandoAlerta = false;

  constructor(private usuarioService: UsuarioService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    const rolesPermitidos = route.data['roles'] as string[];

    // ⭐ 1) Esperar SIEMPRE a que Firebase inicialice al usuario
    return this.usuarioService.inicializacionCompleta$.pipe(
      first(),
      switchMap(() =>
        this.usuarioService.usuario$.pipe(
          take(1),
          map(usuario => {

            // ❌ Si NO está logueado → al login
            if (!usuario) {
              if (state.url !== '/login') {
                this.router.navigate(['/login']);
              }
              return false;
            }

            // ⭐ Si la ruta NO define roles → acceso permitido
            if (!rolesPermitidos || rolesPermitidos.length === 0) {
              return true;
            }

            // 🔵 Normalizamos el rango del usuario
            const rangoUsuario = usuario.rango.toLowerCase().trim();

            // Comprobamos si el usuario tiene permiso
            const tienePermiso = rolesPermitidos.some(
              r => r.toLowerCase().trim() === rangoUsuario
            );

            // ❌ Bloqueo si no tiene permiso
            if (!tienePermiso) {
              if (!this.mostrandoAlerta) {
                this.mostrandoAlerta = true;
                alert('⚠️ No tienes permiso para acceder a esta sección.');
                setTimeout(() => {
                  this.mostrandoAlerta = false;
                  this.router.navigate(['/menu']);
                }, 1500);
              }
              return false;
            }

            // 🟢 Todo OK → permitir
            return true;
          })
        )
      )
    );
  }
}
