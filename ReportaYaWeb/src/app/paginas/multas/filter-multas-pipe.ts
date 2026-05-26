import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterMultas'
})
export class FilterMultasPipe implements PipeTransform {

  transform(
    multas: any[],
    filtroFecha: string,
    filtroInfraccion: string,
    filtroComentarios: string,
    filtroUbicacion: string,
    filtroPatente: string
  ): any[] {
    if (!multas) return [];

    // Normaliza los filtros a minúsculas para evitar errores
    const fFecha = filtroFecha?.toLowerCase() || '';
    const fInfraccion = filtroInfraccion?.toLowerCase() || '';
    const fComentarios = filtroComentarios?.toLowerCase() || '';
    const fUbicacion = filtroUbicacion?.toLowerCase() || '';
    const fPatente = filtroPatente?.toLowerCase() || '';

    return multas.filter(multa => {
      // 🔹 Normalizar valores para evitar errores de tipo
      const fechaStr = multa.fecha?.toDate
        ? multa.fecha.toDate().toLocaleDateString() // Timestamp → string
        : (multa.fecha?.toString?.() ?? '');

      const infraccionStr = multa.infraccion?.toString().toLowerCase() || '';
      const comentariosStr = multa.comentarios?.toString().toLowerCase() || '';
      const ubicacionStr = multa.ubicacion?.toString().toLowerCase() || '';
      const patenteStr = multa.patente?.toString().toLowerCase() || '';

      // 🔹 Filtrado (case-insensitive)
      const coincideFecha = fechaStr.toLowerCase().includes(fFecha);
      const coincideInfraccion = infraccionStr.includes(fInfraccion);
      const coincideComentarios = comentariosStr.includes(fComentarios);
      const coincideUbicacion = ubicacionStr.includes(fUbicacion);
      const coincidePatente = patenteStr.includes(fPatente);

      return coincideFecha && coincideInfraccion && coincideComentarios && coincideUbicacion && coincidePatente;
    });
  }
}
