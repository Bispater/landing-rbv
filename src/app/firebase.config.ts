import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
  apiKey: 'AIzaSyAA2C5uTKXbiPRWSfC8xMaLfwe-k6pJ6xI',
  authDomain: 'wimbly25.firebaseapp.com',
  databaseURL: 'https://wimbly25-default-rtdb.firebaseio.com',
  projectId: 'wimbly25',
  storageBucket: 'wimbly25.firebasestorage.app',
  messagingSenderId: '166339252917',
  appId: '1:166339252917:web:52464b492b43552fdfe4fc',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
