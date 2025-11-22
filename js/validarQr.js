// validarQr.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

// ---------------- FIREBASE ----------------
const firebaseConfig = {
  apiKey: "AIzaSyDkQEN7UMAVQQvOmWZjABmVYgVMMC4g9g0",
  authDomain: "appbar-24e02.firebaseapp.com",
  projectId: "appbar-24e02",
  storageBucket: "appbar-24e02.appspot.com",
  messagingSenderId: "339569084121",
  appId: "1:339569084121:web:be83a06de71c21f5bea0c8",
  measurementId: "G-GMHEKEPVJC",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------------- ELEMENTOS ----------------
const video = document.getElementById("camara");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const qrResultado = document.getElementById("qr-resultado");
const qrInfo = document.getElementById("qr-info-adicional");
const qrTitulo = document.getElementById("qr-titulo");

const ticketsProcesados = new Set();
const DURACION_RESULTADO = 4000;

// ---------------- MODO ----------------
const params = new URLSearchParams(window.location.search);
const modo = params.get("modo"); // "caja" o "entradas"
qrTitulo.textContent =
  modo === "caja" ? "Validación de Compras - Caja" : "Validación de Entradas";

// ---------------- ESCANEAR QR ----------------
function scanQR() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      const ticketId = code.data;
      if (!ticketsProcesados.has(ticketId)) {
        ticketsProcesados.add(ticketId);
        validarQr(ticketId);
      }
    }
  }
  requestAnimationFrame(scanQR);
}

// ---------------- VALIDAR QR ----------------
async function validarQr(ticketId) {
  if (!ticketId) return;

  try {
    const coleccionPrincipal = modo === "entradas" ? "entradas" : "compras";
    const coleccionSecundaria = modo === "entradas" ? "compras" : "entradas";

    let docRef = doc(db, coleccionPrincipal, ticketId);
    let docSnap = await getDoc(docRef);
    let tipo = coleccionPrincipal;

    if (!docSnap.exists()) {
      docRef = doc(db, coleccionSecundaria, ticketId);
      docSnap = await getDoc(docRef);
      tipo = coleccionSecundaria;

      if (!docSnap.exists()) {
        qrResultado.textContent = "❌ Ticket no encontrado";
        qrResultado.className = "qr-resultado invalid";
        limpiarResultado();
        return;
      }

      qrResultado.textContent = `❌ QR inválido: es un ${tipo}`;
      qrResultado.className = "qr-resultado invalid";
      limpiarResultado();
      return;
    }

    const data = docSnap.data();

    // ---------------- SWEETALERT ----------------
    if (tipo === "entradas") {
      const result = await Swal.fire({
        title: `<i class="bi bi-ticket-perforated-fill"></i> Entrada ${data.estado.toUpperCase()}`,
        html: `
          <p><b>Evento:</b> ${data.nombre}</p>
          <p><b>Usuario:</b> ${data.usuarioNombre}</p>
          <p><b>Fecha:</b> ${data.fecha || "Desconocida"}</p>
          <p><b>Estado:</b> ${data.estado.toUpperCase()}</p>
          <p><b>ID Ticket:</b> ${data.id || ticketId}</p>
        `,
        icon: data.estado === "aprobada" ? "success" : "warning",
        showCloseButton: true,
        showCancelButton: true,
        confirmButtonText: "Aprobar",
        cancelButtonText: "Cancelar",
        width: 450,
      });

      if (result.isConfirmed && !data.usado) {
        await updateDoc(docRef, { usado: true });
        qrResultado.textContent = `✅ Entrada Aprobada`;
        qrResultado.className = "qr-resultado valid";
      } else {
        qrResultado.textContent = `⏸ Entrada pendiente`;
        qrResultado.className = "qr-resultado invalid";
      }
    } else {
      const htmlItems = data.items
        .map(
          (i) => `<tr>
                    <td>${i.titulo}</td>
                    <td>${i.cantidad}</td>
                    <td>$${i.precio}</td>
                    <td>$${i.cantidad * i.precio}</td>
                  </tr>`
        )
        .join("");

      const result = await Swal.fire({
        title: `<i class="bi bi-cart-check-fill"></i> Compra ${data.estado.toUpperCase()}`,
        html: `
          <table class="table table-sm table-striped">
            <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
            <tbody>${htmlItems}</tbody>
          </table>
          <p><b>Total:</b> $${data.total}</p>
          <p><b>Usuario:</b> ${data.usuarioNombre || "Desconocido"}</p>
          <p><b>Fecha:</b> ${data.fecha || "Desconocida"}</p>
          <p><b>ID Compra:</b> ${data.id || ticketId}</p>
        `,
        icon: data.estado === "aprobada" ? "success" : "warning",
        showCloseButton: true,
        showCancelButton: true,
        confirmButtonText: "Aprobar",
        cancelButtonText: "Cancelar",
        width: 550,
      });

      if (result.isConfirmed) {
        qrResultado.textContent = `✅ Compra Aprobada`;
        qrResultado.className = "qr-resultado valid";
      } else {
        qrResultado.textContent = `⏸ Compra pendiente`;
        qrResultado.className = "qr-resultado invalid";
      }
    }

    limpiarResultado(DURACION_RESULTADO);
  } catch (error) {
    console.error(error);
    qrResultado.textContent = "❌ Error al validar";
    qrResultado.className = "qr-resultado invalid";
    limpiarResultado();
  }
}

// ---------------- LIMPIAR RESULTADO ----------------
function limpiarResultado(tiempo = 2000) {
  setTimeout(() => {
    qrResultado.textContent = "Esperando QR...";
    qrResultado.className = "qr-resultado";
    qrInfo.textContent = "";
    ticketsProcesados.clear();
  }, tiempo);
}

// ---------------- INICIO DE CÁMARA ----------------
async function iniciarCamara() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });

    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      scanQR();
    };
  } catch (err) {
    console.error("Error al iniciar la cámara:", err);
    qrResultado.textContent =
      "❌ No se pudo acceder a la cámara. Revisa permisos y navegador";
    qrResultado.className = "qr-resultado invalid";

    // Botón de reintento
    const recargarBtn = document.createElement("button");
    recargarBtn.textContent = "Reintentar cámara";
    recargarBtn.className = "btn btn-warning mt-2";
    recargarBtn.onclick = () => {
      iniciarCamara();
      recargarBtn.remove();
    };
    qrResultado.parentNode.appendChild(recargarBtn);
  }
}

iniciarCamara();
