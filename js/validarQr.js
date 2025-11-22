import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { formatearFecha } from "./utils.js";

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
const qrTitulo = document.querySelector(".qr-title");
const ticketsProcesados = new Set();

// ---------------- Botón validar manual ----------------
const manualQrInput = document.getElementById("manualQrInput");
const manualQrBtn = document.getElementById("manualQrBtn");

manualQrBtn.addEventListener("click", () => {
  const ticketId = manualQrInput.value.trim();
  if (!ticketId) return;

  if (!ticketsProcesados.has(ticketId)) {
    ticketsProcesados.add(ticketId);
    validarTicket(ticketId, modo);
    manualQrInput.value = ""; // limpiar input después de validar
  }
});

// Permitir validar presionando Enter
manualQrInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    manualQrBtn.click();
  }
});

// ---------------- Botón salir ----------------
const exitQrBtn = document.getElementById("exitQrBtn");

exitQrBtn.addEventListener("click", () => {
  // Detener la cámara
  const stream = video.srcObject;
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
  // Redirigir o cerrar modal
  window.location.href = "/admin.html"; // ejemplo: volver al inicio
});

// ---------------- Cámara ----------------
navigator.mediaDevices
  .getUserMedia({ video: { facingMode: "environment" } })
  .then((stream) => {
    video.srcObject = stream;
    requestAnimationFrame(scanQR);
  })
  .catch((err) => {
    console.error("Error cámara:", err);
    qrResultado.textContent = "No se pudo acceder a la cámara.";
    qrResultado.className = "qr-resultado invalid";
  });

// ---------------- Modo ----------------
const urlParams = new URLSearchParams(window.location.search);
let modo = urlParams.get("modo") || "entradas"; // "entrada", "compra" o "carrito"
setTituloModo(modo);

function setTituloModo(modo = "entradas") {
  qrTitulo.textContent =
    modo === "entradas"
      ? "ESCÁNER ENTRADAS"
      : modo === "compras"
      ? "ESCÁNER COMPRAS"
      : "ESCÁNER CARRITOS";
}

// ---------------- Escanear QR ----------------
function scanQR() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      const ticketId = code.data
        .replace(/^(Entrada|Compra|Carrito):\s*/, "")
        .trim();
      if (!ticketsProcesados.has(ticketId)) {
        ticketsProcesados.add(ticketId);
        validarTicket(ticketId, modo);
      }
    }
  }
  requestAnimationFrame(scanQR);
}

// ---------------- Validar ticket ----------------
async function validarTicket(ticketId, modo = "entrada") {
  try {
    const coleccionActual = modo === "entrada" ? "entradas" : "compras";
    const coleccionOtra = modo === "entrada" ? "compras" : "entradas";

    const refActual = doc(db, coleccionActual, ticketId);
    const refOtra = doc(db, coleccionOtra, ticketId);

    const snapActual = await getDoc(refActual);
    const snapOtra = await getDoc(refOtra);

    qrInfo.textContent = "";

    if (snapActual.exists()) {
      // ✅ Ticket válido para este modo
      const ticketData = snapActual.data();

      let detalle = "";
      if ((modo === "compra" || modo === "carrito") && ticketData.items) {
        detalle = ticketData.items
          .map((p) => `- ${p.nombre} x${p.enCarrito} ($${p.precio})`)
          .join("<br>");
      }

      const result = await Swal.fire({
        title: modo === "entrada" ? "Aprobar entrada" : "Confirmar pedido",
        html: `
          <p><strong>${modo === "entrada" ? "Evento" : "Pedido"}:</strong> ${
          ticketData.nombre || "Sin nombre"
        }</p>
          <p><strong>Usuario:</strong> ${
            ticketData.usuarioNombre || "Desconocido"
          }</p>
          <p><strong>Fecha:</strong> ${
            formatearFecha(ticketData.fecha) || "Sin fecha"
          }</p>
          ${
            detalle
              ? `<hr><p><strong>Productos:</strong><br>${detalle}</p>`
              : ""
          }`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Aprobar",
        cancelButtonText: "Cancelar",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      if (!result.isConfirmed) {
        ticketsProcesados.delete(ticketId);
        return;
      }

      if (ticketData.usado) {
        qrResultado.textContent =
          modo === "entrada" ? "⚠ Entrada ya usada" : "⚠ Pedido ya entregado";
        qrResultado.className = "qr-resultado used";
      } else {
        qrResultado.textContent =
          modo === "entrada"
            ? "✅ Entrada válida - Permitido el ingreso"
            : "✅ Pedido válido - Entregar al cliente";
        qrResultado.className = "qr-resultado valid";
        await updateDoc(refActual, { usado: true });
      }

      qrInfo.textContent = `${modo === "entrada" ? "Evento" : "Pedido"}: ${
        ticketData.nombre || "Sin nombre"
      } | Usuario: ${ticketData.usuarioNombre || "Desconocido"}`;
    } else if (snapOtra.exists()) {
      // ❌ Ticket válido, pero para la otra colección
      await Swal.fire({
        title: "❌ Ticket inválido para este modo",
        html: `<p style="color:red; font-size:0.9em">
                Este ticket es ${
                  modo === "entrada" ? "una compra" : "una entrada"
                } 
                y no puede ser usado aquí.
              </p>`,
        icon: "error",
        confirmButtonText: "Aceptar",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    } else {
      // ❌ Ticket no encontrado en ninguna colección
      qrResultado.textContent =
        modo === "entrada" ? "❌ Entrada inválida" : "❌ Pedido inválido";
      qrResultado.className = "qr-resultado invalid";
    }

    ticketsProcesados.delete(ticketId);
  } catch (err) {
    console.error(err);
    qrResultado.textContent = "Error validando ticket";
    qrResultado.className = "qr-resultado invalid";
    ticketsProcesados.delete(ticketId);
  }

  setTimeout(() => {
    qrResultado.textContent = "Esperando QR...";
    qrResultado.className = "qr-resultado";
    qrInfo.textContent = "";
  }, 3000);
}
