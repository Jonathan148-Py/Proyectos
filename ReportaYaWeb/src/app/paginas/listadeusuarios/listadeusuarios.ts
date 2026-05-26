import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  updateDoc, 
  Timestamp 
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { UsuarioService } from '../../servicios/usuario.service';

interface UsuarioFirestore {
  id: string;
  createdAt: Date | null;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  rango: string;
  blockedUntil?: Timestamp;
}

@Component({
  selector: 'app-listadeusuarios',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './listadeusuarios.html',
  styleUrls: ['./listadeusuarios.css']
})
export class Listadeusuarios implements OnInit, OnDestroy {
  usuarioNombre = '';
  usuarioRango = '';
  currentUserId = '';

  // 🔍 Filtros (solo campos reales de usuario)
  filtroNombre = '';
  filtroApellido = '';
  filtroTelefono = '';
  filtroEmail = '';
  filtroID = '';

  pestanas = [
    { id: 'ciudadano', nombre: 'Ciudadanos' },
    { id: 'camaras', nombre: 'Cámaras' },
    { id: 'multas', nombre: 'Multas' },
    { id: 'inspectores', nombre: 'Inspectores' },
    { id: 'admin', nombre: 'Administradores' },
  ];

  pestanaActiva: string = 'ciudadano';
  usuarios: UsuarioFirestore[] = [];
  usuariosFiltrados: UsuarioFirestore[] = [];
  cargando = true;

  private usuariosSub?: Subscription;
  // ⚠️ authSub ELIMINADO: ya no se necesita

  constructor(
    private firestore: Firestore,
    private usuarioService: UsuarioService
  ) {}

  // ✅ ngOnInit corregido: sin suscripción a usuario$
  async ngOnInit() {
    // Espera a que Firebase verifique la sesión
    await this.usuarioService.esperarInicializacion();

    const usuario = this.usuarioService.usuario;

    // Si no es admin, cierra sesión y sale (sin alerta)
    if (!usuario || usuario.rango !== 'admin') {
      this.usuarioService.cerrarSesion();
      return;
    }

    this.usuarioNombre = usuario.nombre || 'Admin';
    this.usuarioRango = usuario.rango;
    this.currentUserId = usuario.uid;
    this.cargarUsuarios();
  }

  ngOnDestroy() {
    this.usuariosSub?.unsubscribe();
    // authSub ya no existe
  }

  private cargarUsuarios() {
    const usersRef = collection(this.firestore, 'users');
    this.usuariosSub = collectionData(usersRef, { idField: 'id' }).pipe(
      map(data => data.map(doc => {
        const email = doc['email'] || doc['correo'] || '';
        const firstName = doc['firstName'] || doc['nombre'] || '';
        const lastName = doc['lastName'] || '';
        const phone = doc['phone'] || '';
        let rango = doc['rango'] || doc['range'] || doc['rang'] || 'ciudadano';
        rango = rango.toLowerCase().trim();
        if (rango === 'inspector') rango = 'inspectores';

        return {
          id: doc.id,
          createdAt: doc['createdAt'] ? doc['createdAt'].toDate() : null,
          email: email || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || undefined,
          rango: rango,
          blockedUntil: doc['blockedUntil']
        };
      }))
    ).subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.aplicarFiltrosCombinados();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.cargando = false;
      }
    });
  }

  cambiarPestana(id: string) {
    this.pestanaActiva = id;
    this.aplicarFiltrosCombinados();
  }

  aplicarFiltrosCombinados() {
    let filtrados = this.usuarios.filter(u => u.rango === this.pestanaActiva);

    if (
      this.filtroNombre.trim() ||
      this.filtroApellido.trim() ||
      this.filtroTelefono.trim() ||
      this.filtroEmail.trim() ||
      this.filtroID.trim()
    ) {
      filtrados = filtrados.filter(u => {
        const nombre = (u.firstName || '').toLowerCase();
        const apellido = (u.lastName || '').toLowerCase();
        const telefono = (u.phone || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const id = (u.id || '').toLowerCase();

        return (
          (!this.filtroNombre.trim() || nombre.includes(this.filtroNombre.toLowerCase().trim())) &&
          (!this.filtroApellido.trim() || apellido.includes(this.filtroApellido.toLowerCase().trim())) &&
          (!this.filtroTelefono.trim() || telefono.includes(this.filtroTelefono.toLowerCase().trim())) &&
          (!this.filtroEmail.trim() || email.includes(this.filtroEmail.toLowerCase().trim())) &&
          (!this.filtroID.trim() || id.includes(this.filtroID.toLowerCase().trim()))
        );
      });
    }

    this.usuariosFiltrados = filtrados;
  }

  getNombreCompleto(usuario: UsuarioFirestore): string {
    if (usuario.firstName || usuario.lastName) {
      return `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim() || 'Sin nombre';
    }
    if (usuario.email) return usuario.email.split('@')[0];
    if (usuario.phone) return usuario.phone;
    return usuario.id || 'Usuario sin identificador';
  }

  getEmailOTelefono(usuario: UsuarioFirestore): string {
    return usuario.email || usuario.phone || 'Sin contacto';
  }

  isBlocked(usuario: UsuarioFirestore): boolean {
    if (!usuario.blockedUntil) return false;
    const now = new Date();
    return usuario.blockedUntil.toDate() > now;
  }

  async toggleBloqueo(usuario: UsuarioFirestore) {
    const userDoc = doc(this.firestore, `users/${usuario.id}`);
    
    if (this.isBlocked(usuario)) {
      await updateDoc(userDoc, { blockedUntil: null });
      usuario.blockedUntil = undefined;
    } else {
      const blockedUntil = new Date();
      blockedUntil.setHours(blockedUntil.getHours() + 48);
      await updateDoc(userDoc, { blockedUntil: blockedUntil });
      usuario.blockedUntil = Timestamp.fromDate(blockedUntil);
    }
    
    alert(`✅ Usuario ${this.isBlocked(usuario) ? 'bloqueado' : 'desbloqueado'} correctamente.`);
  }

  // ✅ cerrarSesion corregido: sin desuscripción innecesaria
  cerrarSesion(): void {
    this.usuarioService.cerrarSesion();
  }
}