import { Component, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeEsCL from '@angular/common/locales/es-CL';
import { FormsModule } from '@angular/forms';
import { FilterMultasPipe } from './filter-multas-pipe';
import { RouterModule, Router } from '@angular/router';
import {
  Firestore,
  collection,
  collectionData,
  query,
  orderBy,
  doc,
  getDoc
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

registerLocaleData(localeEsCL);

@Component({
  selector: 'app-multas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FilterMultasPipe],
  providers: [{ provide: LOCALE_ID, useValue: 'es-CL' }],
  templateUrl: './multas.html',
  styleUrls: ['./multas.css']
})
export class Multas {
  partes: any[] = [];
  usuarioActual: any = null;

  filtroFecha = '';
  filtroInfraccion = '';
  filtroComentarios = '';
  filtroUbicacion = '';
  filtroPatente = '';

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      const userRef = doc(this.firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.warn('❌ Usuario autenticado pero no encontrado en "users"');
        this.router.navigate(['/login']);
        return;
      }

      const data = userSnap.data();
      const rango = data['rango'];

      if (!rango || !['admin', 'multas'].includes(rango)) {
        console.warn(`❌ Acceso denegado para rango: ${rango}`);
        this.router.navigate(['/login']);
        return;
      }

      this.usuarioActual = {
        nombre: data['nombre'] || 'Usuario',
        rango: rango
      };

      this.cargarPartes();
    });
  }

  // ✅ MÉTODO FALTANTE: Control de permisos
  puedeVer(ruta: string): boolean {
    if (!this.usuarioActual) return false;

    const permisos: { [key: string]: string[] } = {
      alertasvecinales: ['admin', 'camaras'],
      camarassolicitadas: ['admin', 'camaras'],
      mapa: ['admin', 'camaras', 'usuario'],
      multas: ['admin', 'multas'],
      crearusuario: ['admin']
    };

    return permisos[ruta]?.includes(this.usuarioActual.rango) ?? false;
  }

  truncarTexto(texto: string, maxCaracteres: number = 50): string {
    if (!texto) return '';
    return texto.length > maxCaracteres 
      ? texto.substring(0, maxCaracteres) + '...' 
      : texto;
  }

  private cargarPartes() {
    const partesRef = collection(this.firestore, 'partes');
    const partesQuery = query(partesRef, orderBy('fecha', 'asc'));
    collectionData(partesQuery, { idField: 'id' }).subscribe({
      next: async (partesData) => {
        if (!partesData) return;

        const partesConNombre = await Promise.all(
          partesData.map(async (parte) => {
            const usuarioUID = parte['usuarioUID'];
            let nombreCreador = 'Desconocido';

            if (usuarioUID) {
              const userRef = doc(this.firestore, 'users', usuarioUID);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                nombreCreador = userData['nombre'] || 'Desconocido';
              }
            }

            const fechaFormateada = this.formatearFecha(parte['fecha']);

            return {
              ...parte,
              nombreCreador,
              fechaFormateada
            };
          })
        );

        this.partes = partesConNombre;
        console.log('✅ partes recibidas con nombre del creador:', this.partes);
      },
      error: (err) => {
        console.error('❌ Error al cargar partes:', err);
      }
    });
  }

  formatearFecha(fecha: any): string {
    if (fecha && fecha.toDate && typeof fecha.toDate === 'function') {
      const date = fecha.toDate();
      return new Intl.DateTimeFormat('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
    if (typeof fecha === 'string') return fecha;
    if (typeof fecha === 'number') {
      const date = new Date(fecha);
      return new Intl.DateTimeFormat('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
    return 'Fecha no disponible';
  }

  irADetalle(parte: any) {
    const id = parte?.id?.toString();
    if (!id) {
      alert('ID inválido, no se puede abrir detalle.');
      return;
    }
    this.router.navigate(['/partedetalle', id]);
  }

  isCurrentRoute(route: string): boolean {
    return this.router.url.includes(route);
  }

  cerrarSesion(): void {
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}