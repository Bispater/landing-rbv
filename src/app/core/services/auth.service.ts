import { Injectable, signal } from '@angular/core';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User,
} from 'firebase/auth';
import { auth } from '../../firebase.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);
  isLoggedIn = signal(false);

  private resolveReady!: (v: boolean) => void;
  readonly authReady: Promise<boolean> = new Promise(r => { this.resolveReady = r; });

  constructor() {
    setPersistence(auth, browserLocalPersistence);
    let firstEmit = true;
    onAuthStateChanged(auth, (user) => {
      this.currentUser.set(user);
      this.isLoggedIn.set(!!user);
      if (firstEmit) { this.resolveReady(!!user); firstEmit = false; }
    });
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }
}
