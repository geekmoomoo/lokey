import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Always use production Firebase (no emulator connection)
// Commented out emulator connection for production usage
// if (import.meta.env.DEV) {
//   console.log('🔧 Connecting to Firebase emulators in development mode');
//   connectFirestoreEmulator(db, '127.0.0.1', 8080);
// }

export default app;