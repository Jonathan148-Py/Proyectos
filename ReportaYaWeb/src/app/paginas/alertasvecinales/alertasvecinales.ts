import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Firestore, collection, collectionData, doc, updateDoc, query, orderBy, Timestamp } from '@angular/fire/firestore';
import { Subscription, filter, map } from 'rxjs';
import { UsuarioService, Usuario } from '../../servicios/usuario.service';

@Component({
  selector: 'app-alertasvecinales',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './alertasvecinales.html',
  styleUrls: ['./alertasvecinales.css']
})
export class AlertasVecinales implements OnInit, OnDestroy {

  alertas: any[] = [];
  alertasFiltradas: any[] = [];
  alertasSinCompletarCount = 0;

  filtroCorreo = '';
  filtroDescripcion = '';
  filtroUbicacion = '';
  filtroFecha = '';

  usuario: Usuario | null = null;
  usuarioNombre = '';
  usuarioRango = '';

  vistaActual: 'sin-completar' | 'completadas' = 'sin-completar';

  private alertasSub?: Subscription;
  private routerSub?: Subscription;
  private usuarioSub?: Subscription;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private ngZone: NgZone // 👈 Inyectamos NgZone
  ) {}

  // =====================================================
  // 🔥 INICIALIZACIÓN PRINCIPAL
  // =====================================================
  async ngOnInit() {
    // ✅ Espera a que Firebase termine de verificar la sesión
    await this.usuarioService.esperarInicializacion();

    this.usuarioSub = this.usuarioService.usuario$.subscribe(usuario => {
      this.usuario = usuario;

      if (!usuario) return;

      this.usuarioNombre = usuario.nombre ?? '';
      this.usuarioRango = usuario.rango ?? '';

      if (!['admin', 'camaras'].includes(usuario.rango)) {
        alert('Acceso denegado. No tienes permisos.');
        this.router.navigate(['/menu']);
        return;
      }

      if (!this.routerSub) {
        this.routerSub = this.router.events
          .pipe(filter(event => event instanceof NavigationEnd))
          .subscribe(() => this.actualizarVista());
      }

      this.actualizarVista();
    });
  }

  ngOnDestroy() {
    this.alertasSub?.unsubscribe();
    this.routerSub?.unsubscribe();
    this.usuarioSub?.unsubscribe();
  }

  // =====================================================
  // 🔥 ACTUALIZAR VISTA
  // =====================================================
  private actualizarVista() {
    if (!this.usuario) return;

    this.vistaActual = this.router.url.includes('/completadas')
      ? 'completadas'
      : 'sin-completar';

    this.cargarAlertas();
  }

  // =====================================================
  // 🔥 CARGAR ALERTAS DESDE FIREBASE (CORREGIDO)
  // =====================================================
  private cargarAlertas() {
    const alertasRef = collection(this.firestore, 'reportes');
    const alertasQuery = query(alertasRef, orderBy('fecha', 'asc'));

    this.alertasSub?.unsubscribe();

    // ✅ Ejecutamos dentro de la zona de Angular para evitar el warning
    this.ngZone.run(() => {
      this.alertasSub = collectionData(alertasQuery, { idField: 'id' })
        .pipe(map(data => data || []))
        .subscribe(data => {
          this.alertas = data.map(alerta => {
            if (!alerta['estado'] || alerta['estado']['resultado'] === undefined) {
              alerta['estado'] = { resultado: false };
            }
            return {
              ...alerta,
              fechaString: this.fechaToString(alerta['fecha'])
            };
          });

          this.contarAlertasSinCompletar();
          this.aplicarFiltros();
        });
    });
  }

  // =====================================================
  // 🔥 CONVERTIR FECHA
  // =====================================================
  fechaToString(fecha: any): string {
    if (fecha instanceof Timestamp) return fecha.toDate().toLocaleString('es-ES');
    if (typeof fecha === 'string') return fecha;
    return 'Fecha no disponible';
  }

  // =====================================================
  // 🔥 CONTAR ALERTAS SIN COMPLETAR
  // =====================================================
  private contarAlertasSinCompletar() {
    this.alertasSinCompletarCount =
      this.alertas.filter(a => a['estado']['resultado'] === false).length || 0;
  }

  // =====================================================
  // 🔥 APLICAR FILTROS
  // =====================================================
  aplicarFiltros() {
    let alertasParaFiltrar = this.vistaActual === 'completadas'
      ? this.alertas.filter(a => a['estado']['resultado'] === true)
      : this.alertas.filter(a => a['estado']['resultado'] === false);

    const correoFiltro = this.filtroCorreo.toLowerCase();
    const descFiltro = this.filtroDescripcion.toLowerCase();
    const ubiFiltro = this.filtroUbicacion.toLowerCase();
    const fechaFiltro = this.filtroFecha.toLowerCase();

    this.alertasFiltradas = alertasParaFiltrar.filter(alerta => {
      const correo = (alerta['usuarioEmail'] || '').toLowerCase();
      const descripcion = (alerta['descripcion'] || '').toLowerCase();
      const ubicacion = (alerta['ubicacion'] || '').toLowerCase();
      const fecha = (alerta.fechaString || '').toLowerCase();

      return (
        (!correoFiltro || correo.includes(correoFiltro)) &&
        (!descFiltro || descripcion.includes(descFiltro)) &&
        (!ubiFiltro || ubicacion.includes(ubiFiltro)) &&
        (!fechaFiltro || fecha.includes(fechaFiltro))
      );
    });
  }

  // =====================================================
  // 🔥 PERMISOS DEL MENÚ
  // =====================================================
  puedeVer(ruta: string): boolean {
    if (!this.usuario) return false;

    const rango = this.usuario.rango.toLowerCase().trim();

    const permisos: any = {
      'menu': ['admin', 'camaras', 'multas', 'ciudadano'],
      'alertasvecinales': ['admin', 'camaras'],
      'camarassolicitadas': ['admin', 'camaras'],
      'mapa': ['admin', 'camaras', 'ciudadano'],
      'multas': ['admin', 'multas'],
      'crearusuario': ['admin'],
      'listadeusuarios': ['admin']
    };

    return permisos[ruta]?.includes(rango) ?? false;
  }

  // =====================================================
  // 🔥 DETALLE DE ALERTA
  // =====================================================
  irADetalle(alerta: any) {
    const id = alerta['id']?.toString();
    if (!id) return alert('ID inválido.');
    this.router.navigate(['/alertadetalle', id]);
  }

  // =====================================================
  // 🔥 CAMBIAR PRIORIDAD
  // =====================================================
  async cambiarPrioridad(alerta: any, nuevaPrioridad: string, event: Event) {
    if (!this.usuario || this.usuario.rango !== 'admin') {
      alert('Solo un administrador puede cambiar prioridades.');
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
      const docRef = doc(this.firestore, `reportes/${alerta['id']}`);
      await updateDoc(docRef, { prioridad: nuevaPrioridad });

      const index = this.alertas.findIndex(a => a.id === alerta.id);
      if (index !== -1) {
        this.alertas[index].prioridad = nuevaPrioridad;
      }

      this.aplicarFiltros();
    } catch (error) {
      console.error('❌ Error al actualizar prioridad:', error);
    }
  }

  // =====================================================
  // 🔥 CERRAR SESIÓN
  // =====================================================
  cerrarSesion(): void {
    this.router.navigate(['/login']);
  }
}