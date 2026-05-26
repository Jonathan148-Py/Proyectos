import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterAlertas', standalone: true })
export class FilterAlertasPipe implements PipeTransform {
  transform(
    alertas: any[],
    filtroCorreo: string,
    filtroDescripcion: string,
    filtroUbicacion: string,
    filtroFecha: string
  ) {
    if (!alertas) return [];

    const correoFiltro = filtroCorreo?.toLowerCase() || '';
    const descFiltro = filtroDescripcion?.toLowerCase() || '';
    const ubiFiltro = filtroUbicacion?.toLowerCase() || '';
    const fechaFiltro = filtroFecha?.toLowerCase() || '';

    return alertas.filter(alerta => {
      // Intenta obtener el correo desde distintos posibles campos
      const correo =
        (alerta.correo ||
         alerta.email ||
         alerta.usuarioEmail ||
         alerta.usuario?.correo ||
         alerta.usuario?.email ||
         '')?.toLowerCase();

      const descripcion = (alerta.descripcion || '').toLowerCase();
      const ubicacion = (alerta.ubicacion || '').toLowerCase();
      const fecha = (alerta.fecha?.toString() || '').toLowerCase();

      return (
        (!correoFiltro || correo.includes(correoFiltro)) &&
        (!descFiltro || descripcion.includes(descFiltro)) &&
        (!ubiFiltro || ubicacion.includes(ubiFiltro)) &&
        (!fechaFiltro || fecha.includes(fechaFiltro))
      );
    });
  }
}
