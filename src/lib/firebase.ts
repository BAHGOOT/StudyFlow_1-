import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyDhvJ4P5sQj4Hpoafkth0bLlekOJus1lgc",
  authDomain: "studyflow-50ffd.firebaseapp.com",
  projectId: "studyflow-50ffd",
  storageBucket: "studyflow-50ffd.firebasestorage.app",
  messagingSenderId: "181840277686",
  appId: "1:181840277686:web:08c76966dcc944173ff617",
  measurementId: "G-50B8C5ZMH4"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;


