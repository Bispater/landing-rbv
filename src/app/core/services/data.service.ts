import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ref, set, push, remove, update, onValue, DatabaseReference } from 'firebase/database';
import { db } from '../../firebase.config';

export interface Evento {
  id?: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora?: string;
  lugar?: string;
  imagen?: string;
  tipo: 'evento' | 'presentacion' | 'ensayo';
}

export interface Miembro {
  id?: string;
  nombre: string;
  rol: string;
  cargo?: string;
  foto?: string;
  comision: string;
}

export interface Comision {
  id?: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  miembros: Miembro[];
}

export interface Cancion {
  id?: string;
  titulo: string;
  artista: string;
  genero: string;
  youtubeId?: string;
  duracion?: string;
  descripcion?: string;
}

export interface Tutorial {
  id?: string;
  titulo: string;
  descripcion: string;
  youtubeId: string;
  nivel: 'principiante' | 'intermedio' | 'avanzado';
  duracion?: string;
  instructor?: string;
}

export interface Foto {
  id?: string;
  url: string;
  titulo: string;
  descripcion?: string;
  fecha?: string;
  categoria: string;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private http: HttpClient) {}

  getJsonData<T>(path: string): Observable<T> {
    return this.http.get<T>(`assets/data/${path}`);
  }

  listenToRef<T>(path: string, callback: (data: T) => void): void {
    const dbRef: DatabaseReference = ref(db, path);
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
  }

  async addItem(path: string, data: object): Promise<void> {
    const dbRef = ref(db, path);
    await push(dbRef, data);
  }

  async setItem(path: string, data: object): Promise<void> {
    const dbRef = ref(db, path);
    await set(dbRef, data);
  }

  async updateItem(path: string, data: object): Promise<void> {
    const dbRef = ref(db, path);
    await update(dbRef, data);
  }

  async deleteItem(path: string): Promise<void> {
    const dbRef = ref(db, path);
    await remove(dbRef);
  }
}
