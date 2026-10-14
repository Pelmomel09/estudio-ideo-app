import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBHZgmn0ouZuV-mFDX5uVQ3-GD5S0WnMGk",
  authDomain: "app-estudio-ideo.firebaseapp.com",
  projectId: "app-estudio-ideo",
  storageBucket: "app-estudio-ideo.firebasestorage.app",
  messagingSenderId: "295682641533",
  appId: "1:295682641533:web:b8fe6c4a7cf31034996b14",
  measurementId: "G-XNEZTFRDKF"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);