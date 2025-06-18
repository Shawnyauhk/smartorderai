
import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// User-provided hardcoded Firebase configuration (as per user request to ensure specific keys are used)
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyB9L866e5UJlDxW3uwfhfGs1tlQ-MZ0v6I",
  authDomain: "smartorder-ai.firebaseapp.com",
  projectId: "smartorder-ai",
  storageBucket: "smartorder-ai.firebasestorage.app",
  messagingSenderId: "32582129627",
  appId: "1:32582129627:web:96097f9a652bdfc066f9fe"
};

// Diagnostic log: Print the config to the browser console
console.log("Firebase Config Loaded by Client (hardcoded in src/lib/firebase.ts):", firebaseConfig);

// Initialize Firebase
// Using the getApps().length check to prevent re-initialization errors during HMR.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };

/*
用戶提供的 Firebase Authentication 雜湊設定 (通常用於 Identity Platform 或 Admin SDK 使用者匯入):
This configuration is NOT for client-side initialization but is related to
Firebase Authentication's password hashing, typically for Identity Platform
or when importing users with externally hashed passwords using the Admin SDK.

hash_config {
  algorithm: SCRYPT,
  base64_signer_key: C3/cJpwua+/ak7lZ9q53NUVVOPaheUYuhyKXNGqaZVQcpf93i8CTzWAbZHow8rjiYTkxktmJ37JfY7/TLsienw==,
  base64_salt_separator: Bw==,
  rounds: 8,
  mem_cost: 14,
}

This information might be found in your Firebase project settings if you've upgraded to
Identity Platform, or it's something you'd configure when using the Firebase Admin SDK
for user import operations. It does not directly affect the client-side API key issue
we are troubleshooting for Firebase SDK initialization.
*/
