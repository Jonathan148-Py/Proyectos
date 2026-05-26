import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, signOut } from '@angular/fire/auth';

/* 📊 Para los gráficos */
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css']
})
export class Menu implements OnInit, AfterViewInit {

  // ✅ USAMOS ESTAS DOS PROPIEDADES (NO usuarioActual)
  usuarioNombre: string | null = null;
  usuarioRango: string | null = null;
  cargando = true;

  // 📊 Datos para los gráficos
  alertasPorDia: any = {};
  alertasPorTipo: any = {}; // ⚠️ Eliminado alertasPorSector

  // Estadísticas generales
  totalUsuarios: number = 0;
  totalReportes: number = 0;
  totalMultas: number = 0;

  // Instancias de gráficos
  private graficoDiaInstance: any = null;
  private graficoTipoInstance: any = null; // ⚠️ Eliminado graficoSectorInstance

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
    if (!this.cargando) {
      await this.cargarEstadisticas();
      await this.cargarDatosGraficos();
      this.renderizarGraficos();
    }
  }

  ngAfterViewInit() {}

  private async cargarUsuario() {
    const usuarioGuardado = localStorage.getItem('usuario');

    if (usuarioGuardado) {
      const u = JSON.parse(usuarioGuardado);
      this.usuarioNombre = u.nombre;
      this.usuarioRango = u.rango;
      this.cargando = false;
      return;
    }

    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        try {
          const usuariosRef = collection(this.firestore, 'users');
          const q = query(usuariosRef, where('correo', '==', user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const userData = doc.data();

            this.usuarioNombre = userData['nombre'];
            this.usuarioRango = userData['rango'];

            localStorage.setItem('usuario', JSON.stringify({
              nombre: this.usuarioNombre,
              correo: user.email,
              rango: this.usuarioRango,
              uid: user.uid
            }));
          } else {
            console.error('❌ Usuario autenticado pero no encontrado en "users".');
            this.router.navigate(['/']);
          }
        } catch (error) {
          console.error('Error al cargar usuario:', error);
          this.router.navigate(['/']);
        }
      } else {
        this.router.navigate(['/']);
      }
      this.cargando = false;
    });
  }

  private async cargarEstadisticas() {
    try {
      const usuariosSnapshot = await getDocs(collection(this.firestore, 'users'));
      const reportesSnapshot = await getDocs(collection(this.firestore, 'reportes'));
      const partesSnapshot = await getDocs(collection(this.firestore, 'partes'));

      this.totalUsuarios = usuariosSnapshot.size;
      this.totalReportes = reportesSnapshot.size;
      this.totalMultas = partesSnapshot.size;
    } catch (e) {
      console.error("❌ Error cargando estadísticas:", e);
    }
  }

  async cargarDatosGraficos() {
    try {
      const reportesRef = collection(this.firestore, 'reportes');
      const snapshot = await getDocs(reportesRef);

      const diasTemp: Record<string, number> = {};
      const tiposTemp: Record<string, number> = {};

      for (const doc of snapshot.docs) {
        const data = doc.data() as any;

        // Por día
        if (data.fecha) {
          let fechaStr: string;
          if (typeof data.fecha === 'string') {
            fechaStr = data.fecha.split(' ')[0];
          } else if (data.fecha?.toDate) {
            fechaStr = data.fecha.toDate().toISOString().split('T')[0];
          } else {
            continue;
          }
          diasTemp[fechaStr] = (diasTemp[fechaStr] || 0) + 1;
        }

        // Por tipo
        const tipo = data.subcategoria || data.categoria;
        if (tipo) {
          tiposTemp[tipo] = (tiposTemp[tipo] || 0) + 1;
        }
      }

      this.alertasPorDia = diasTemp;
      this.alertasPorTipo = tiposTemp;
    } catch (e) {
      console.error("❌ Error cargando datos para gráficos:", e);
    }
  }

  private renderizarGraficos() {
    // Gráfico de barras: Reportes por Día
    const ctxDia = document.getElementById('graficoDia') as HTMLCanvasElement;
    if (ctxDia && Object.keys(this.alertasPorDia).length > 0) {
      if (this.graficoDiaInstance) this.graficoDiaInstance.destroy();
      this.graficoDiaInstance = new Chart(ctxDia, {
        type: 'bar',
        data: {
          labels: Object.keys(this.alertasPorDia),
          datasets: [{
            label: 'Reportes por Día',
            data: Object.values(this.alertasPorDia),
            backgroundColor: '#0057A3',
            borderColor: '#00417a',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    // Gráfico de anillo: Reportes por Tipo
    const ctxTipo = document.getElementById('graficoTipo') as HTMLCanvasElement;
    if (ctxTipo && Object.keys(this.alertasPorTipo).length > 0) {
      if (this.graficoTipoInstance) this.graficoTipoInstance.destroy();
      this.graficoTipoInstance = new Chart(ctxTipo, {
        type: 'doughnut',
        data: {
          labels: Object.keys(this.alertasPorTipo),
          datasets: [{
            label: 'Reportes por Tipo',
            data: Object.values(this.alertasPorTipo),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  }

  puedeVer(ruta: string): boolean {
    if (this.usuarioRango === 'admin') return true;
    const permisos: Record<string, string[]> = {
      'camaras': ['alertasvecinales', 'camarassolicitadas', 'mapa'],
      'multas': ['multas']
    };
    return permisos[this.usuarioRango!]?.includes(ruta) ?? false;
  }

  cerrarSesion() {
    signOut(this.auth);
    localStorage.removeItem('usuario');
    this.router.navigate(['/']);
  }
}