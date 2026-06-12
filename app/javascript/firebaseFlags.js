import { runtimeOrBuildValue } from "./config/runtime";

export const firebaseConfig = {
  apiKey: runtimeOrBuildValue("nexus-firebase-api-key", import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: runtimeOrBuildValue(
    "nexus-firebase-auth-domain",
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  ),
  projectId: runtimeOrBuildValue(
    "nexus-firebase-project-id",
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  ),
  storageBucket: runtimeOrBuildValue(
    "nexus-firebase-storage-bucket",
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  ),
  messagingSenderId: runtimeOrBuildValue(
    "nexus-firebase-messaging-sender-id",
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  ),
  appId: runtimeOrBuildValue("nexus-firebase-app-id", import.meta.env.VITE_FIREBASE_APP_ID),
  measurementId: runtimeOrBuildValue(
    "nexus-firebase-measurement-id",
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  ),
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);
