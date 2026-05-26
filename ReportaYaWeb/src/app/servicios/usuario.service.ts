import { Injectable } from '@angular/core';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { ReplaySubject, BehaviorSubject, Observable } from 'rxjs';

export interface Usuario {
  uid: string;
  correo: string;
  nombre?: string;
  rango: string;
  createdAt?: any;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  // 🚀 ReplaySubject = NO emite null inicial (evita que tus componentes carguen vacíos)
  private usuarioSubject = new ReplaySubject<Usuario | null>(1);
  usuario$: Observable<Usuario | null> = this.usuarioSubject.asObservable();
  private usuarioActual: Usuario | null = null;

  // Control de inicialización global
  private inicializacionSubject = new BehaviorSubject<boolean>(false);
  inicializacionCompleta$ = this.inicializacionSubject.asObservable();
  private inicializacionCompleta = false;

  constructor(private auth: Auth, private firestore: Firestore) {

    // 🔥 Detectar login/logout en tiempo real
    onAuthStateChanged(this.auth, async (user: User | null) => {

      if (user) {
        await this.cargarDatosUsuario(user.uid);
      } else {
        this.limpiarTodo();
      }

      // Al terminar, marcaremos inicialización como completa
      this.inicializacionCompleta = true;
      this.inicializacionSubject.next(true);
    });
  }

  // --- MÉTODOS INTERNOS --------------------------------------

  private normalizarRango(rango: any): string {
    if (!rango) return 'ciudadano';

    let str = String(rango).toLowerCase().trim();

    if (str === 'inspector') str = 'inspectores';
    if (str === 'administrador') str = 'admin';

    return str;
  }

  private limpiarTodo() {
    this.usuarioActual = null;
    this.usuarioSubject.next(null);
  }

  // --- CARGA DE USUARIO DESDE FIRESTORE ---------------------

  async cargarDatosUsuario(uid: string) {
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        console.warn('⚠️ No existe documento del usuario en Firestore');
        this.usuarioSubject.next(null);
        return;
      }

      const data = userSnap.data();

      const usuario: Usuario = {
        uid,
        correo: data['email'] || data['correo'] || '',
        nombre: data['firstName'] || data['nombre'] || data['name'] || '',
        rango: this.normalizarRango(data['rango'] || data['range'] || data['rang']),
        createdAt: data['createdAt']
      };

      this.usuarioActual = usuario;
      this.usuarioSubject.next(usuario);

    } catch (error) {
      console.error('❌ Error al cargar datos del usuario:', error);
      this.usuarioSubject.next(null);
    }
  }

  // --- GETTERS / LOGOUT -------------------------------------

  get usuario(): Usuario | null {
    return this.usuarioActual;
  }

  async cerrarSesion() {
    await this.auth.signOut();
    this.limpiarTodo();

    this.inicializacionCompleta = true;
    this.inicializacionSubject.next(true);
  }

  // --- ESPERA A QUE FIREBASE CARGUE -------------------------

  async esperarInicializacion(): Promise<void> {
    if (this.inicializacionCompleta) return;

    return new Promise(resolve => {
      const sub = this.inicializacionSubject.subscribe(ok => {
        if (ok) {
          sub.unsubscribe();
          resolve();
        }
      });
    });
  }
}
