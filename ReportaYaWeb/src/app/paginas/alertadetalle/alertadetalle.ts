import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import {
  Firestore,
  doc,
  docData,
  updateDoc,
  deleteDoc,
  Timestamp,
  collection,
  collectionData,
  query,
  where,
  getDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { DATA } from './categorias';
import { UsuarioService, Usuario } from '../../servicios/usuario.service';

interface EstadoAlerta {
  pendiente: boolean;
  enProceso: boolean;
  enTerreno: boolean;
  resuelto: boolean;
  resultado?: boolean;
}

@Component({
  selector: 'app-alertadetalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './alertadetalle.html',
  styleUrls: ['./alertadetalle.css'],
})
export class Alertadetalle implements OnInit {
  alerta: any = null;
  categorias = DATA;
  subcategoriasFiltradas: string[] = [];

  inspectores$!: Observable<any[]>;
  usuario: Usuario | null = null;
  usuarioNombre = '';
  usuarioRango = '';
  inspectorAsignado: any = null;

  private categoriaTimeout: any;
  private subcategoriaTimeout: any;
  private descripcionTimeout: any;
  private comentariosTimeout: any;

  tabActual = 'general';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.usuarioService.usuario$.subscribe((usuario) => {
      this.usuario = usuario;
      this.usuarioNombre = usuario?.nombre || 'Usuario';
      this.usuarioRango = usuario?.rango || 'Invitado';

      if (!usuario || !['admin', 'camaras'].includes(usuario?.rango ?? '')) {
        alert('⚠️ No tienes permiso para acceder a esta sección.');
        this.router.navigate(['/menu']);
        return;
      }

      this.route.paramMap.subscribe((params) => {
        const idParam = params.get('id');
        if (!idParam) {
          console.warn('⚠️ ID no encontrado');
          this.router.navigate(['/alertasvecinales']);
          return;
        }

        const alertaDocRef = doc(this.firestore, `reportes/${idParam}`);
        docData(alertaDocRef, { idField: 'id' }).subscribe(async (data) => {
          if (!data) {
            console.warn('⚠️ Reporte no encontrado');
            alert('⚠️ Reporte no encontrado');
            this.router.navigate(['/alertasvecinales']);
            return;
          }

          this.alerta = data;

          this.alerta.estado = (this.alerta.estado as EstadoAlerta) || {
            pendiente: false,
            enProceso: false,
            enTerreno: false,
            resuelto: false,
            resultado: false
          };

          if (this.alerta.estado.resultado === undefined) {
            this.alerta.estado.resultado = false;
          }

          if (this.alerta?.inspectorAsignado) {
            await this.cargarInspectorAsignado();
          }

          const fechaCampo = this.alerta.fecha || this.alerta.creadoEn;
          if (fechaCampo instanceof Timestamp) {
            this.alerta.fecha = fechaCampo.toDate();
          }

          this.alerta.visibilidad = this.alerta.visibilidad === true;

          if (this.alerta.categoria) this.onCategoriaChange(false);
        });
      });

      if (this.esAdmin()) {
        const usersRef = collection(this.firestore, 'users');
        const q = query(usersRef, where('rango', '==', 'inspector'));
        this.inspectores$ = collectionData(q, { idField: 'uid' });
      }
    });
  }

  puedeEditar(): boolean {
    return ['admin', 'camaras'].includes(this.usuario?.rango ?? '');
  }

  esAdmin(): boolean {
    return this.usuario?.rango === 'admin';
  }

  async cargarInspectorAsignado() {
    const uid = this.alerta.inspectorAsignado;
    const inspectorDocRef = doc(this.firestore, `users/${uid}`);

    try {
      const inspectorSnap = await getDoc(inspectorDocRef);
      if (inspectorSnap.exists()) {
        const inspectorData = inspectorSnap.data();
        this.inspectorAsignado = {
          ...inspectorData,
          uid: inspectorSnap.id
        };
      } else {
        console.warn(`⚠️ Inspector con UID ${uid} no encontrado`);
        this.inspectorAsignado = { uid, nombre: 'Inspector no encontrado', email: 'N/A' };
        await this.liberarInspector(uid);
      }
    } catch (err) {
      console.error('❌ Error al cargar inspector:', err);
      this.inspectorAsignado = { uid, nombre: 'Error al cargar inspector', email: 'N/A' };
    }
  }

  async marcarComoCompletado() {
    if (!this.alerta?.id) return;
    if (!this.puedeEditar()) {
      alert('Solo administradores y cámaras pueden marcar alertas como finalizadas.');
      return;
    }

    const confirmar = confirm(
      this.alerta.estado.resultado
        ? '¿Estás seguro de que deseas marcar esta alerta como pendiente?'
        : '¿Estás seguro de que deseas finalizar esta alerta?'
    );

    if (!confirmar) return;

    const nuevoEstado = !this.alerta.estado.resultado;
    try {
      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
      await updateDoc(alertaDocRef, { 'estado.resultado': nuevoEstado });
      this.alerta.estado.resultado = nuevoEstado;
      alert(nuevoEstado ? '✅ Alerta marcada como finalizada' : '🔄 Alerta marcada como pendiente');
      this.router.navigate(['/alertasvecinales']);
    } catch (err) {
      console.error('❌ Error al marcar como finalizado:', err);
      alert('Error al actualizar el estado de la alerta.');
    }
  }

  onCategoriaChange(autoSave = true) {
    if (!this.alerta) return;
    const categoriaSeleccionada = this.categorias.find(c => c.FAMILIA === this.alerta.categoria);
    this.subcategoriasFiltradas = categoriaSeleccionada ? categoriaSeleccionada.REQUERIMIENTO : [];

    if (!this.subcategoriasFiltradas.includes(this.alerta.subcategoria)) {
      this.alerta.subcategoria = '';
    }

    if (!autoSave) return;

    if (this.categoriaTimeout) clearTimeout(this.categoriaTimeout);
    this.categoriaTimeout = setTimeout(async () => {
      if (!this.alerta?.id) return;
      try {
        const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
        await updateDoc(alertaDocRef, { categoria: this.alerta.categoria || null });
      } catch (err) {
        console.error('❌ Error actualizando categoría:', err);
      }
    }, 500);
  }

  onSubcategoriaChange() {
    if (this.subcategoriaTimeout) clearTimeout(this.subcategoriaTimeout);
    this.subcategoriaTimeout = setTimeout(async () => {
      if (!this.alerta?.id) return;
      try {
        const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
        await updateDoc(alertaDocRef, { subcategoria: this.alerta.subcategoria || null });
      } catch (err) {
        console.error('❌ Error actualizando subcategoría:', err);
      }
    }, 500);
  }

  async actualizarEstado(nombreCampo: keyof EstadoAlerta, valor: boolean) {
    if (!this.alerta?.id) return;
    if (!this.puedeEditar()) {
      alert('No tienes permiso para actualizar el estado.');
      return;
    }

    try {
      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
      await updateDoc(alertaDocRef, { [`estado.${nombreCampo}`]: valor });
      this.alerta.estado[nombreCampo] = valor;

      if (nombreCampo === 'resuelto' && valor && this.alerta.inspectorAsignado) {
        await this.liberarInspector(this.alerta.inspectorAsignado);
      }
    } catch (err) {
      console.error('❌ Error actualizando estado:', err);
    }
  }

  async liberarInspector(uidInspector: string) {
    if (!this.esAdmin()) {
      alert('Solo un administrador puede liberar inspectores.');
      return;
    }

    try {
      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
      await updateDoc(alertaDocRef, { inspectorAsignado: null });
      this.alerta.inspectorAsignado = null;
      this.inspectorAsignado = null;
      console.log(`✅ Inspector ${uidInspector} liberado`);
    } catch (err) {
      console.error('❌ Error liberando inspector:', err);
    }
  }

  onDescripcionChange() {
    if (!this.puedeEditar()) return;
    if (this.descripcionTimeout) clearTimeout(this.descripcionTimeout);
    this.descripcionTimeout = setTimeout(async () => {
      if (!this.alerta?.id) return;
      try {
        const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
        await updateDoc(alertaDocRef, { descripcion: this.alerta.descripcion || '' });
      } catch (err) {
        console.error('❌ Error actualizando descripción:', err);
      }
    }, 600);
  }

  onComentariosChange() {
    if (!this.puedeEditar()) return;
    if (this.comentariosTimeout) clearTimeout(this.comentariosTimeout);
    this.comentariosTimeout = setTimeout(async () => {
      if (!this.alerta?.id) return;
      try {
        const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
        await updateDoc(alertaDocRef, { comentariosInspector: this.alerta.comentariosInspector || '' });
      } catch (err) {
        console.error('❌ Error actualizando comentarios:', err);
      }
    }, 600);
  }

  onPrioridadChange() {
    if (this.puedeEditar()) {
      this.guardarCambios('prioridad');
    }
  }

  onVisibilidadChange() {
    if (this.puedeEditar() && this.alerta?.id) {
      const visibilidadBooleana = this.alerta.visibilidad === true;
      this.guardarCambios('visibilidad', visibilidadBooleana);
    }
  }

  guardarCambios(campo: string, valor: any = null) {
    if (!this.puedeEditar() || !this.alerta?.id) return;
    const valorGuardar = valor !== null ? valor : this.alerta[campo];
    try {
      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
      updateDoc(alertaDocRef, { [campo]: valorGuardar });
    } catch (err) {
      console.error(`❌ Error guardando ${campo}:`, err);
    }
  }

  async asignarReporte(uidInspector: string) {
    if (!this.esAdmin()) {
      alert('Solo un administrador puede asignar inspectores.');
      return;
    }

    const confirmar = confirm('¿Asignar esta alerta al inspector seleccionado?');
    if (!confirmar) return;

    try {
      const alertaDocRef = doc(this.firestore, `reportes/${this.alerta.id}`);
      await updateDoc(alertaDocRef, {
        inspectorAsignado: uidInspector,
        estado: { pendiente: false, enProceso: true, enTerreno: false, resuelto: false } as EstadoAlerta,
      });
      this.alerta.inspectorAsignado = uidInspector;
      alert('✅ Inspector asignado correctamente');
    } catch (err) {
      console.error('❌ Error asignando reporte:', err);
    }
  }

  isCurrentRoute(route: string): boolean {
    return this.router.url.includes(route);
  }

  async eliminarReporte(id: string) {
    if (!id) return;
    if (!this.puedeEliminar()) {
      alert('⚠️ No tienes permiso para eliminar reportes.');
      return;
    }

    if (confirm('¿Eliminar este reporte?')) {
      try {
        if (this.alerta?.inspectorAsignado) {
          await this.liberarInspector(this.alerta.inspectorAsignado);
        }
        const docRef = doc(this.firestore, `reportes/${id}`);
        await deleteDoc(docRef);
        alert('✅ Reporte eliminado correctamente');
        this.router.navigate(['/alertasvecinales']);
      } catch (error) {
        console.error('❌ Error al eliminar reporte:', error);
      }
    }
  }

  puedeEliminar(): boolean {
    return ['admin', 'camaras'].includes(this.usuario?.rango ?? '');
  }

  volver(): void {
    const origen = this.route.snapshot.queryParamMap.get('origen');
    if (origen === 'mapa') {
      this.router.navigate(['/mapa']);
    } else {
      this.router.navigate(['/alertasvecinales']);
    }
  }

  cerrarSesion(): void {
    this.router.navigate(['/login']);
  }

  puedeVer(ruta: string): boolean {
    const usuario = this.usuario;
    if (!usuario) return false;

    const permisos: { [key: string]: string[] } = {
      alertasvecinales: ['admin', 'camaras'],
      camarassolicitadas: ['admin', 'camaras'],
      mapa: ['admin', 'camaras', 'usuario'],
      multas: ['admin'],
      crearusuario: ['admin']
    };

    return permisos[ruta]?.includes(usuario.rango || '');
  }

  cambiarTab(tab: string) {
    this.tabActual = tab;
  }
}