// firebase.js
import {
  initializeApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDkQEN7UMAVQQvOmWZjABmVYgVMMC4g9g0",
  authDomain: "appbar-24e02.firebaseapp.com",
  projectId: "appbar-24e02",
  storageBucket: "appbar-24e02.appspot.com",
  messagingSenderId: "339569084121",
  appId: "1:339569084121:web:be83a06de71c21f5bea0c8",
  measurementId: "G-GMHEKEPVJC",
};

// Inicializar Firebase solo si no hay apps existentes
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app); // <-- NUEVO

export { app, db, auth };
export const storage = getStorage(app);
