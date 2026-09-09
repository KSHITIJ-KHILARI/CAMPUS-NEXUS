import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate that a real API key is provided — never use a fake fallback
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "fake-api-key") {
  console.error(
    "NEXT_PUBLIC_FIREBASE_API_KEY is missing or invalid. " +
    "Set it in frontend/.env.local (development) or in your deployment platform (production)."
  );
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Emulator connection — ONLY when explicitly enabled AND in development
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
const isLocal = process.env.NODE_ENV === "development";

if (useEmulators && isLocal) {
  const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099";
  const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "localhost:8080";
  const storageHost = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST || "localhost:9199";

  try {
    connectAuthEmulator(auth, `http://${authHost}`);
  } catch (e) {}
  
  try {
    connectFirestoreEmulator(db, firestoreHost.split(':')[0], parseInt(firestoreHost.split(':')[1]));
  } catch (e) {}

  try {
    connectStorageEmulator(storage, storageHost.split(':')[0], parseInt(storageHost.split(':')[1]));
  } catch (e) {}
}

export { app, auth, db, storage };
