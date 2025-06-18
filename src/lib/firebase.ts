
import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// User-provided hardcoded Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyB9L866e5UJlDxW3uwfhfGs1tlQ-MZ0v6I",
  authDomain: "smartorder-ai.firebaseapp.com",
  projectId: "smartorder-ai",
  storageBucket: "smartorder-ai.firebasestorage.app",
  messagingSenderId: "32582129627",
  appId: "1:32582129627:web:96097f9a652bdfc066f9fe"
  // measurementId is not included as it wasn't in the provided config.
};

// Diagnostic log: Print the config to the browser console
// Updated to reflect that this config is now hardcoded in this file.
console.log("Firebase Config Loaded by Client (hardcoded in src/lib/firebase.ts):", firebaseConfig);

// Initialize Firebase
// Using the getApps().length check to prevent re-initialization errors during HMR.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
