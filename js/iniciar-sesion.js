import { auth, db } from "./firebase.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const btnGoogle = document.getElementById("btnGoogle");
const noUser = document.getElementById("noUser");
const userInfo = document.getElementById("userInfo");
const userGreeting = document.getElementById("userGreeting");
const btnLogout = document.getElementById("btnLogout");

// Función para mostrar usuario logueado
function mostrarUsuario(nombre) {
  if (nombre) {
    userGreeting.textContent = `Hola, ${nombre}`;
    noUser.classList.add("d-none");
    userInfo.classList.remove("d-none");
  } else {
    noUser.classList.remove("d-none");
    userInfo.classList.add("d-none");
    userGreeting.textContent = "";
  }
}

// Carga inicial desde localStorage
mostrarUsuario(localStorage.getItem("userName"));

// Función de login
async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Guardar en Firestore si no existe
    const userDocRef = doc(db, "usuarios", user.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      await setDoc(userDocRef, {
        nombre: user.displayName || "Sin nombre",
        email: user.email,
        uid: user.uid,
        creadoEn: new Date().toISOString(),
      });
    }

    // Guardar en localStorage y mostrar usuario
    localStorage.setItem("userName", user.displayName || user.email);
    mostrarUsuario(user.displayName || user.email);

    Swal.fire(
      "Bienvenido",
      `Hola ${user.displayName || user.email}`,
      "success"
    );
  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.message, "error");
    // No cambiar nada en la UI
  }
}

// Función de logout
async function logout() {
  try {
    await signOut(auth);
    localStorage.removeItem("userName");
    mostrarUsuario(null);
    Swal.fire("Sesión cerrada", "Has cerrado sesión correctamente", "info");
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo cerrar sesión", "error");
  }
}

// Asignar eventos
btnGoogle?.addEventListener("click", loginWithGoogle);
btnLogout?.addEventListener("click", logout);

// Firebase: detectar cambios de sesión
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Usuario activo, actualizar UI
    const nombre = user.displayName || user.email;
    localStorage.setItem("userName", nombre);
    mostrarUsuario(nombre);
  } else {
    mostrarUsuario(null);
  }
});
