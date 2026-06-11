import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, getRedirectResult } from "firebase/auth";
import { firebaseConfig, firebaseEnabled } from "./firebaseFlags";

const app = firebaseEnabled ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const googleProvider = app ? new GoogleAuthProvider() : null;

export { auth, googleProvider, signInWithPopup, getRedirectResult };
