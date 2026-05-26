import { Component, AfterViewInit, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { UsuarioService, Usuario } from '../../servicios/usuario.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mapa.html',
  styleUrls: ['./mapa.css']
})
export class Mapa implements AfterViewInit {
  map: any;
  alertas$: Observable<any[]> | undefined;
  isBrowser: boolean;
  marcadores = new Map<string, any>();
  usuario: Usuario | null = null;

  readonly CENTRO_SAN_BERNARDO: [number, number] = [-33.594849, -70.698075];

  // Guardamos la referencia a Leaflet para usarla en crearMarcador
  private leafletRef: any = null;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private zone: NgZone,
    private usuarioService: UsuarioService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.usuario = this.usuarioService.usuario;

    if (this.isBrowser) {
      const reportesRef = collection(this.firestore, 'reportes');
      this.alertas$ = collectionData(reportesRef, { idField: 'id' });
    }
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;

    const L = await import('leaflet');
    this.leafletRef = L; // Guardamos la referencia

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png'
    });

    await this.inicializarMapa(L);
    await this.cargarGeoJSON(L);

    // ✅ Suscribirse a los cambios de las alertas
    this.alertas$?.subscribe((alertas) => {
      if (!this.map) return;

      this.zone.runOutsideAngular(() => {
        const idsActuales = new Set(alertas.map(a => a.id));

        // 🧹 Eliminar marcadores que ya no existen
        this.marcadores.forEach((marker, id) => {
          if (!idsActuales.has(id)) {
            this.map.removeLayer(marker);
            this.marcadores.delete(id);
          }
        });

        // ➕ Agregar o actualizar
        alertas.forEach((alerta) => {
          if (!alerta.coordenadas?.lat || !alerta.coordenadas?.lng) return;

          const existente = this.marcadores.get(alerta.id);
          if (existente) {
            existente.setLatLng([alerta.coordenadas.lat, alerta.coordenadas.lng]);
          } else {
            const nuevo = this.crearMarcador(alerta);
            this.marcadores.set(alerta.id, nuevo);
          }
        });
      });
    });
  }

  async inicializarMapa(L: typeof import('leaflet')): Promise<void> {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    if (this.map) this.map.remove();

    this.map = L.map(mapContainer, {
      center: this.CENTRO_SAN_BERNARDO,
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
      minZoom: 11,
      maxZoom: 18
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.map.whenReady(() => {
      setTimeout(() => this.map.invalidateSize(), 300);
    });
  }

  async cargarGeoJSON(L: typeof import('leaflet')): Promise<void> {
    if (!this.isBrowser || !this.map) return;

    try {
      const response = await fetch('assets/PRC_San_Bernardo.geojson');
      const geojsonData = await response.json();

      const todosAnillos: [number, number][][] = [];

      for (const feature of geojsonData.features) {
        const geometry = feature.geometry;
        if (geometry.type === 'Polygon') {
          for (const ring of geometry.coordinates) {
            const leafletRing = ring.map((coord: [number, number]) => {
              const [lng, lat] = coord;
              return [lat, lng] as [number, number];
            });
            todosAnillos.push(leafletRing);
          }
        } else if (geometry.type === 'MultiPolygon') {
          for (const polygon of geometry.coordinates) {
            for (const ring of polygon) {
              const leafletRing = ring.map((coord: [number, number]) => {
                const [lng, lat] = coord;
                return [lat, lng] as [number, number];
              });
              todosAnillos.push(leafletRing);
            }
          }
        }
      }

      const mundo: [number, number][] = [
        [-90, -180],
        [-90, 180],
        [90, 180],
        [90, -180],
        [-90, -180]
      ];

      const mascara = L.polygon([mundo, ...todosAnillos], {
        color: 'transparent',
        fillColor: 'rgba(128, 128, 128, 0.5)',
        fillOpacity: 0.5,
        stroke: false
      }).addTo(this.map);

      mascara.bringToBack();

    } catch (error) {
      console.error('❌ Error al cargar el archivo GeoJSON:', error);
    }
  }

  // ✅ Ahora `crearMarcador` usa `this.leafletRef`
  crearMarcador(alerta: any) {
    const L = this.leafletRef;
    const iconoAlerta = L.icon({
      iconUrl: 'assets/icono-alerta.png',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });

    const marker = L.marker(
      [alerta.coordenadas.lat, alerta.coordenadas.lng],
      { icon: iconoAlerta }
    ).addTo(this.map);

    const estado =
      alerta.estado?.pendiente
        ? 'Pendiente'
        : alerta.estado?.enProceso
        ? 'En proceso'
        : 'Resuelto';

    marker.bindPopup(`
      <b>${alerta.categoria || 'Sin categoría'}</b><br>
      ${alerta.subcategoria || ''}<br>
      Estado: ${estado}
    `);

    marker.on('click', () =>
      this.router.navigate(['/alertadetalle', alerta.id], { queryParams: { origen: 'mapa' } })
    );

    return marker;
  }

  centrarEnSanBernardo() {
    if (this.map) {
      this.map.setView(this.CENTRO_SAN_BERNARDO, 13);
    }
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

  isCurrentRoute(route: string): boolean {
    return this.router.url === route;
  }

  cerrarSesion(): void {
    this.router.navigate(['/login']);
  }
}