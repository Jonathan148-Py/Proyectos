import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterCamaras'
})
export class FilterCamarasPipe implements PipeTransform {
  transform(camaras: any[], nombre: string, apellido: string, telefono: string, rut: string, calle: string, motivo: string, fecha: string): any[] {
    if (!camaras) return [];
    return camaras.filter(c => 
      (!nombre || c.nombre.toLowerCase().includes(nombre.toLowerCase())) &&
      (!apellido || c.apellido.toLowerCase().includes(apellido.toLowerCase())) &&
      (!telefono || c.telefono.includes(telefono)) &&
      (!rut || c.rut.includes(rut)) &&
      (!calle || c.calle.toLowerCase().includes(calle.toLowerCase())) &&
      (!motivo || c.motivo.toLowerCase().includes(motivo.toLowerCase())) &&
      (!fecha || c.fecha.includes(fecha))
    );
  }
}

