import { auth, db } from "./firebase.js";
import { cargarEntradas } from "./entradas.js";

import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const esAdminPage = window.location.pathname.includes("admin.html");

// =====================================================
//      📌 CARGAR CONFIGURACIÓN DE LOGIN DESDE FIRESTORE
// =====================================================
export async function cargarLoginSettings() {
  try {
    const docSnap = await getDoc(doc(db, "configuracion", "loginMetodos"));
    if (!docSnap.exists()) return;

    const loginSettings = docSnap.data();

    // ❗ Actualiza UI solo si NO es admin.html
    if (!esAdminPage) {
      actualizarInterfazSegunLoginMetodos(loginSettings);
    }
  } catch (e) {
    console.error("Error cargando login settings:", e);
  }
}

// =====================================================
//      📌 MOSTRAR / OCULTAR BOTONES DE LOGIN EN INDEX
// =====================================================
export function actualizarInterfazSegunLoginMetodos(settings) {
  if (!settings) return;
  if (esAdminPage) return; // 🔥 Importante

  const btnGoogle = document.getElementById("btnGoogle");
  const btnFacebook = document.getElementById("btnFacebook");
  const divider = document.querySelector(".login-divider");

  const phoneButtons = document.querySelectorAll(
    "#btnTelefonoLogin, .btnTelefonoLogin"
  );

  // GOOGLE
  if (btnGoogle)
    settings.google
      ? btnGoogle.classList.remove("d-none")
      : btnGoogle.classList.add("d-none");

  // FACEBOOK
  if (btnFacebook)
    settings.facebook
      ? btnFacebook.classList.remove("d-none")
      : btnFacebook.classList.add("d-none");

  // TELÉFONO
  phoneButtons.forEach((btn) => {
    settings.phone
      ? btn.classList.remove("d-none")
      : btn.classList.add("d-none");
  });

  // Divider
  if (divider)
    settings.phone
      ? divider.classList.remove("d-none")
      : divider.classList.add("d-none");
}

// =====================================================
//      📌 MOSTRAR USUARIO
// =====================================================
function mostrarUsuario(nombre) {
  const noUser = document.getElementById("noUser");
  const userInfo = document.getElementById("userInfo");
  const userGreeting = document.getElementById("userGreeting");

  if (nombre) {
    if (userGreeting) userGreeting.textContent = `Hola, ${nombre}`;
    noUser?.classList.add("d-none");
    userInfo?.classList.remove("d-none");
  } else {
    noUser?.classList.remove("d-none");
    userInfo?.classList.add("d-none");
    if (userGreeting) userGreeting.textContent = "";
  }
}

// =====================================================
//      📌 LOGIN CON GOOGLE
// =====================================================
const btnGoogle = document.getElementById("btnGoogle");

async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    const user = result.user;
    const nombre = user.displayName || user.email;

    await setDoc(doc(db, "usuarios", user.uid), {
      nombre,
      email: user.email,
      uid: user.uid,
      creadoEn: serverTimestamp(),
    });

    localStorage.setItem("userName", nombre);
    mostrarUsuario(nombre);
    cargarEntradas();
  } catch (err) {
    if (
      err.code === "auth/popup-closed-by-user" ||
      err.code === "auth/cancelled-popup-request"
    )
      return;

    Swal.fire("Error", err.message, "error");
  }
}

btnGoogle?.addEventListener("click", loginWithGoogle);

// =====================================================
//      📌 LOGIN CON FACEBOOK
// =====================================================
const btnFacebook = document.getElementById("btnFacebook");

async function loginWithFacebook() {
  const provider = new FacebookAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const nombre = user.displayName;

    await setDoc(doc(db, "usuarios", user.uid), {
      nombre,
      email: user.email || "",
      uid: user.uid,
      provider: "facebook",
      creadoEn: serverTimestamp(),
    });

    localStorage.setItem("userName", nombre);
    mostrarUsuario(nombre);
    cargarEntradas();
  } catch (err) {
    if (
      err.code === "auth/cancelled-popup-request" ||
      err.code === "auth/popup-closed-by-user"
    )
      return;

    Swal.fire("Error", err.message, "error");
  }
}

btnFacebook?.addEventListener("click", loginWithFacebook);

// =====================================================
//      📌 LOGIN POR TELÉFONO
// =====================================================
function inicializarRecaptcha() {
  try {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      { size: "invisible" }
    );
  } catch (e) {}
}

inicializarRecaptcha();

let confirmationResult;

document
  .getElementById("btnEnviarCodigo")
  ?.addEventListener("click", async () => {
    const phoneInput = document.getElementById("phoneInput")?.value.trim();
    if (!phoneInput.startsWith("+54")) {
      return Swal.fire("Error", "El número debe comenzar con +54", "error");
    }

    try {
      confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneInput,
        window.recaptchaVerifier
      );

      Swal.fire("Código enviado", "Revisa tu SMS", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  });

document
  .getElementById("btnValidarCodigo")
  ?.addEventListener("click", async () => {
    const code = document.getElementById("codeInput")?.value.trim();
    if (!code) return Swal.fire("Error", "Ingresá el código", "error");

    try {
      const result = await confirmationResult.confirm(code);
      const user = result.user;

      // Pedir nombre
      const { value: nombre } = await Swal.fire({
        title: "Ingresá tu nombre",
        input: "text",
        inputValidator: (v) => (!v ? "Ingresá un nombre" : null),
      });

      await setDoc(doc(db, "usuarios", user.uid), {
        nombre,
        telefono: user.phoneNumber,
        uid: user.uid,
        creadoEn: serverTimestamp(),
      });

      localStorage.setItem("userName", nombre);
      localStorage.setItem("userPhone", user.phoneNumber);

      mostrarUsuario(nombre);
      cargarEntradas();
    } catch {
      Swal.fire("Error", "Código inválido", "error");
    }
  });

// =====================================================
//      📌 LOGOUT
// =====================================================
async function logout() {
  await signOut(auth);
  localStorage.removeItem("userName");
  localStorage.removeItem("userPhone");
  mostrarUsuario(null);
}

document.getElementById("btnLogoutGoogle")?.addEventListener("click", logout);
document.getElementById("btnLogoutPhone")?.addEventListener("click", logout);

// =====================================================
//      📌 OBSERVAR SESIÓN
// =====================================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    mostrarUsuario(user.displayName || user.email || user.phoneNumber);

    document.getElementById("userInfo")?.classList.remove("d-none");
    document.getElementById("noUser")?.classList.add("d-none");

    // ================================
    // 🔥 MOSTRAR CORRECTO BOTÓN LOGOUT
    // ================================
    const prov = user.providerData[0]?.providerId;

    const btnLogoutGoogle = document.getElementById("btnLogoutGoogle");
    const btnLogoutPhone = document.getElementById("btnLogoutPhone");

    // Ocultar ambos primero
    btnLogoutGoogle?.classList.add("d-none");
    btnLogoutPhone?.classList.add("d-none");

    if (prov === "google.com" || prov === "facebook.com") {
      // Login con Google o Facebook → botón con icono
      btnLogoutGoogle?.classList.remove("d-none");
    } else if (prov === "phone") {
      // Login con teléfono → botón simple
      btnLogoutPhone?.classList.remove("d-none");
    }
  } else {
    mostrarUsuario(null);
    document.getElementById("userInfo")?.classList.add("d-none");
    document.getElementById("noUser")?.classList.remove("d-none");

    // 🔥 Reset botones
    document.getElementById("btnLogoutGoogle")?.classList.add("d-none");
    document.getElementById("btnLogoutPhone")?.classList.add("d-none");

    await cargarLoginSettings();
  }
});

// Primera carga de configuración
await cargarLoginSettings();
