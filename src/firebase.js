// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
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
const db = getFirestore(app);
const auth = getAuth(app);

// FORZAR INICIO DE SESIÓN AUTOMÁTICO EN EL MÓVIL
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Sesión automática activada correctamente.");
  })
  .catch((error) => {
    console.error("Error al configurar la persistencia de sesión:", error);
  });

export { db, auth };