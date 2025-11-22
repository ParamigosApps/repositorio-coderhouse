// validarQr.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

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

const video = document.getElementById("camara");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const qrResultado = document.getElementById("qr-resultado");
const qrInfo = document.getElementById("qr-info-adicional");
const qrTitulo = document.getElementById("qr-titulo");

const ticketsProcesados = new Set();
const DURACION_RESULTADO = 4000;

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

  // Determinar colección según modo
  const coleccion = modo === "caja" ? "compras" : "entradas";

  try {
    const docRef = doc(db, coleccion, ticketId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      qrResultado.textContent = "❌ No encontrado";
      qrResultado.className = "qr-resultado invalid";
      limpiarResultado();
      return;
    }

    const data = docSnap.data();

    if (modo === "entradas") {
      qrResultado.textContent = `✅ Entrada ${data.estado.toUpperCase()}`;
      qrResultado.className = "qr-resultado valid";
      qrInfo.textContent = `Evento: ${data.evento || "Sin nombre"} | Usuario: ${
        data.usuario || "Desconocido"
      }`;
      if (!data.usado) await updateDoc(docRef, { usado: true });
    } else {
      qrResultado.textContent = `✅ Compra ${data.estado.toUpperCase()}`;
      qrResultado.className = "qr-resultado valid";
      const productosTexto = data.items
        .map((i) => `${i.titulo} x${i.cantidad}`)
        .join(", ");
      qrInfo.textContent = `Productos: ${productosTexto} | Total: $${data.total}`;
    }

    mostrarDetalleCompleto(data);
    limpiarResultado(DURACION_RESULTADO);
  } catch (error) {
    console.error(error);
    qrResultado.textContent = "❌ Error al validar";
    qrResultado.className = "qr-resultado invalid";
    limpiarResultado();
  }
}

// ---------------- SWEETALERT ----------------
function mostrarDetalleCompleto(data) {
  if (modo === "entradas") {
    Swal.fire({
      title: `<i class="bi bi-ticket-perforated-fill"></i> Entrada ${data.estado.toUpperCase()}`,
      html: `
        <p><b>Evento:</b> ${data.evento}</p>
        <p><b>Usuario:</b> ${data.usuario}</p>
        <p><b>Fecha:</b> ${
          data.fecha ? new Date(data.fecha).toLocaleString() : "Desconocida"
        }</p>
        <p><b>Estado:</b> ${data.estado.toUpperCase()}</p>
        <p><b>ID Ticket:</b> ${data.id || ""}</p>
      `,
      icon: data.estado === "pagado" ? "success" : "warning",
      showCloseButton: true,
      width: 450,
      confirmButtonText: "Aceptar",
    });
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
    Swal.fire({
      title: `<i class="bi bi-cart-check-fill"></i> Compra ${data.estado.toUpperCase()}`,
      html: `
        <table class="table table-sm table-striped">
          <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
          <tbody>${htmlItems}</tbody>
        </table>
        <p><b>Total:</b> $${data.total}</p>
        <p><b>Usuario:</b> ${data.usuario || "Desconocido"}</p>
        <p><b>Fecha:</b> ${
          data.fecha ? new Date(data.fecha).toLocaleString() : "Desconocida"
        }</p>
        <p><b>ID Compra:</b> ${data.id || ""}</p>
      `,
      icon: data.estado === "pagado" ? "success" : "warning",
      showCloseButton: true,
      width: 550,
      confirmButtonText: "Aceptar",
    });
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

// ---------------- INICIO ----------------
navigator.mediaDevices
  .getUserMedia({ video: { facingMode: "environment" } })
  .then((stream) => {
    video.srcObject = stream;
    scanQR();
  })
  .catch((err) => {
    console.error(err);
    qrResultado.textContent = "❌ No se pudo acceder a la cámara";
    qrResultado.className = "qr-resultado invalid";
  });
