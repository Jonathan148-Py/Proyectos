// src/app/paginas/alertasvecinales/alertas.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, query, orderBy, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlertasService {
  constructor(private firestore: Firestore) {}

  getAlertasSinCompletar(): Observable<any[]> {
    const ref = collection(this.firestore, 'reportes');
    const qry = query(ref, where('estado.resultado', '==', false), orderBy('fecha', 'asc'));
    return collectionData(qry, { idField: 'id' });
  }

  getAlertasCompletadas(): Observable<any[]> {
    const ref = collection(this.firestore, 'reportes');
    const qry = query(ref, where('estado.resultado', '==', true), orderBy('fecha', 'asc'));
    return collectionData(qry, { idField: 'id' });
  }

  async marcarComoCompletado(id: string): Promise<void> {
    const docRef = doc(this.firestore, `reportes/${id}`);
    await updateDoc(docRef, { 
      'estado.resultado': true 
    });
  }

  getContadorSinCompletar(): Observable<number> {
    const ref = collection(this.firestore, 'reportes');
    const qry = query(ref, where('estado.resultado', '==', false));
    return collectionData(qry, { idField: 'id' }).pipe(
      map(data => data?.length || 0)
    );
  }
}