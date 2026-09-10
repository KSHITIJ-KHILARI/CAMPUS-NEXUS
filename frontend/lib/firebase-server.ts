import { initializeApp, getApps, getApp, App, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let serverDb: Firestore | null = null;
let serverAuth: Auth | null = null;

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

// Check if we have credentials available (service account or ADC)
const hasServiceAccount = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
const hasADC = !!process.env.GOOGLE_CLOUD_PROJECT || !!process.env.GCLOUD_PROJECT;

try {
  if (getApps().length > 0) {
    adminApp = getApp();
  } else {
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "campus-nexus-v2",
    });
  }

  // Only initialize Firestore if running in emulators or if we have service account credentials.
  // Without proper ADC, the Firestore gRPC client will produce unhandled rejections.
  if (useEmulators || hasServiceAccount) {
    serverDb = getFirestore(adminApp);
    serverAuth = getAuth(adminApp);
  } else {
    console.warn("Firebase Admin: No service account or emulators configured. Firestore tools will use fallback data.");
    serverDb = null;
    serverAuth = null;
  }
} catch (err) {
  console.warn("Firebase Admin initialization warning:", err);
  serverDb = null;
  serverAuth = null;
}

export { adminApp, serverDb, serverAuth };

