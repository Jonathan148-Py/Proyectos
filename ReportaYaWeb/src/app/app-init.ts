import { inject } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { UsuarioService } from './servicios/usuario.service';

export function appInitializer() {
  const auth = inject(Auth);
  const usuarioService = inject(UsuarioService);

  return () =>
    new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (user) => {

        if (user) {
          // 🔥 Esperar a que el UsuarioService cargue los datos del usuario
          await usuarioService.cargarDatosUsuario(user.uid);
        } else {
          usuarioService.cerrarSesion();
        }

        resolve();
      });
    });
}
