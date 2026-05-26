import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  usuario: string = '';
  contrasena: string = '';
  error: string = '';

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {}

  async iniciarSesion() {
    this.error = '';

    if (!this.usuario || !this.contrasena) {
      this.error = 'Por favor ingresa tu usuario y contraseña.';
      return;
    }

    try {
      // 🔍 Buscar el usuario por nombre en la colección "users"
      const usuariosRef = collection(this.firestore, 'users');
      const q = query(usuariosRef, where('nombre', '==', this.usuario));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        this.error = 'Usuario no encontrado.';
        return;
      }

      // 📧 Obtener los datos del documento del usuario
      const userDoc = querySnapshot.docs[0].data() as any;
      const correo = userDoc.correo;
      const rango = userDoc.rango;
      const uid = userDoc.uid;

      // 🔐 Iniciar sesión en Firebase Auth
      await signInWithEmailAndPassword(this.auth, correo, this.contrasena);

      // 💾 Guardar los datos del usuario en localStorage
      const usuarioData = {
        uid: uid,
        nombre: this.usuario,
        correo: correo,
        rango: rango
      };

      localStorage.setItem('usuario', JSON.stringify(usuarioData));

      console.log('🟢 Usuario guardado en localStorage:', usuarioData);

      // ✅ Redirigir al menú principal
      this.router.navigate(['/menu']);

    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      if (err.code === 'auth/wrong-password') {
        this.error = 'Contraseña incorrecta.';
      } else if (err.code === 'auth/user-not-found') {
        this.error = 'No existe una cuenta con ese correo.';
      } else {
        this.error = 'Error al iniciar sesión. Intenta nuevamente.';
      }
    }
  }
}
