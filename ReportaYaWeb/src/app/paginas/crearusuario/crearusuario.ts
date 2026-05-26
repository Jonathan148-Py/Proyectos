import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { RouterModule, Router } from '@angular/router';
import { UsuarioService, Usuario } from '../../servicios/usuario.service'; // ✅ Ruta corregida

@Component({
  selector: 'app-crearusuario',
  templateUrl: './crearusuario.html',
  styleUrls: ['./crearusuario.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class Crearusuario implements OnInit {
  nombre = '';
  correo = '';
  password = '';
  rango = '';

  usuarioNombre = '';
  usuarioRango = '';

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    // ✅ Tipado explícito y ruta corregida
    this.usuarioService.usuario$.subscribe((usuario: Usuario | null) => {
      if (usuario) {
        this.usuarioNombre = usuario.nombre || 'Admin';
        this.usuarioRango = usuario.rango;
      }
    });
  }

  async crearUsuario(usuarioForm: NgForm) {
    if (!usuarioForm.valid) {
      alert('Por favor completa todos los campos.');
      return;
    }

    const { nombre, correo, password, rango } = usuarioForm.value;

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, correo, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: nombre });
      await setDoc(doc(this.firestore, 'users', user.uid), {
        uid: user.uid,
        nombre,
        correo,
        rango,
        createdAt: serverTimestamp()
      });

      alert(`✅ Usuario "${nombre}" creado correctamente con rango "${rango}".`);
      usuarioForm.resetForm();
      this.router.navigate(['/menu']);
    } catch (error: any) {
      console.error('❌ Error al crear usuario:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert('📧 Este correo ya está registrado.');
      } else if (error.code === 'auth/weak-password') {
        alert('🔒 La contraseña debe tener al menos 6 caracteres.');
      } else {
        alert('❌ Error inesperado: ' + (error.message || 'No se pudo crear el usuario.'));
      }
    }
  }

  volver(): void {
    this.router.navigate(['/menu']);
  }

  cerrarSesion(): void {
    this.usuarioService.cerrarSesion();
  }
}