import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDhvJ4P5sQj4Hpoafkth0bLlekOJus1lgc",
  authDomain: "studyflow-50ffd.firebaseapp.com",
  projectId: "studyflow-50ffd",
  storageBucket: "studyflow-50ffd.firebasestorage.app",
  messagingSenderId: "181840277686",
  appId: "1:181840277686:web:08c76966dcc944173ff617",
  measurementId: "G-50B8C5ZMH4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analyticsInstance = null;
if (typeof window !== "undefined") {
  try {
    analyticsInstance = getAnalytics(app);
  } catch (err) {
    console.warn("Analytics initialization skipped in current environment:", err);
  }
}
export const analytics = analyticsInstance;

// Export Auth utilities for Google Sign-In
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
