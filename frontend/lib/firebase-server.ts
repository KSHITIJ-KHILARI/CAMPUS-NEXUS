import { initializeApp, getApps, getApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App;
let serverDb: Firestore;
let serverAuth: Auth;

// Only configure emulators when EXPLICITLY opted-in
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

if (useEmulators) {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  }
}

if (!process.env.GCLOUD_PROJECT) {
  process.env.GCLOUD_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "campus-nexus-v2";
}

try {
  if (getApps().length > 0) {
    adminApp = getApp();
  } else {
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "campus-nexus-v2",
    });
  }

  serverDb = getFirestore(adminApp);
  serverAuth = getAuth(adminApp);
} catch (err) {
  console.warn("Firebase Admin initialization warning:", err);
  serverDb = {} as Firestore;
  serverAuth = {} as Auth;
}

export { adminApp, serverDb, serverAuth };
