import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import baseConfig from '../../firebase-applet-config.json';

// Support both firebase-applet-config.json and optional Vercel/Vite environment variables
const env = (import.meta as any).env || {};
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || baseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || baseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || baseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || baseConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || baseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || baseConfig.appId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || (baseConfig as any).measurementId || '',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;


