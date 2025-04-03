import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, getRedirectResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCdIQvjnYhS11XT5NFzbL1r85tkg76qfo0",
  authDomain: "temppdfmodifier.firebaseapp.com",
  projectId: "temppdfmodifier",
  storageBucket: "temppdfmodifier.firebasestorage.app",
  messagingSenderId: "172114462194",
  appId: "1:172114462194:web:a2075ae69f495840e9976b",
  measurementId: "G-NC2VLQL02W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, getRedirectResult };
