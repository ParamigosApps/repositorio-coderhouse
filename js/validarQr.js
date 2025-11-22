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
      : "ESCÁNER COMPRAS";
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
      // const ticketId = code.data
      //   .replace(/^(Entrada|Compra|Carrito):\s*/, "")
      //   .trim();
      const ticketId = code.data.trim();

      if (!ticketsProcesados.has(ticketId)) {
        ticketsProcesados.add(ticketId);
        validarTicket(ticketId, modo);
        console.log("aca vemos ticket y modo " + ticketId + " " + modo);
      }
    }
  }
  requestAnimationFrame(scanQR);
}

// ---------------- Validar ticket ----------------
async function validarTicket(ticketId, modo = "entradas") {
  console.log("Ticket escaneado:", ticketId);
  console.log("Modo actual:", modo);

  try {
    const coleccionActual = modo; // "entradas" o "compras"
    const coleccionOtra = modo === "entradas" ? "compras" : "entradas";
    console.log("Colección actual:", coleccionActual);
    console.log("Colección otra:", coleccionOtra);

    const refActual = doc(db, coleccionActual, ticketId);
    const refOtra = doc(db, coleccionOtra, ticketId);

    const snapActual = await getDoc(refActual);
    const snapOtra = await getDoc(refOtra);

    console.log("Snap actual existe:", snapActual.exists());
    console.log("Snap otra existe:", snapOtra.exists());

    qrInfo.textContent = "";

    if (snapActual.exists()) {
      const ticketData = snapActual.data();
      console.log("Ticket encontrado en colección actual:", ticketData);

      if (ticketData.usado) {
        qrResultado.textContent =
          modo === "entradas" ? "⚠ Entrada ya usada" : "⚠ Pedido ya entregado";
        qrResultado.className = "qr-resultado used";
      } else {
        // Detalle de productos si es compra
        let detalleHTML = "";
        if (modo === "compras" && ticketData.items?.length) {
          detalleHTML = `<div style="max-height:200px;overflow-y:auto;border:1px solid #ccc;padding:5px;margin-top:5px;">
            <table style="width:100%;border-collapse:collapse;font-size:0.9em">
              <thead>
                <tr>
                  <th style="border-bottom:1px solid #ccc;text-align:left">Producto</th>
                  <th style="border-bottom:1px solid #ccc;text-align:center">Cantidad</th>
                  <th style="border-bottom:1px solid #ccc;text-align:right">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${ticketData.items
                  .map(
                    (p) => `
                  <tr>
                    <td>${p.nombre}</td>
                    <td style="text-align:center">${p.enCarrito}</td>
                    <td style="text-align:right">$${p.precio}</td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>`;
        }

        // Swal para aprobar
        const result = await Swal.fire({
          title: modo === "entradas" ? "Aprobar entrada" : "Confirmar pedido",
          html: `
            <p><strong>${modo === "entradas" ? "Evento" : "Pedido"}:</strong> ${
            ticketData.nombre || "Sin nombre"
          }</p>
            <p><strong>Usuario:</strong> ${
              ticketData.usuarioNombre || "Desconocido"
            }</p>
            <p><strong>Fecha:</strong> ${
              formatearFecha(ticketData.fecha) || "Sin fecha"
            }</p>
            ${detalleHTML}
          `,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Aprobar",
          cancelButtonText: "Cancelar",
          allowOutsideClick: false,
          allowEscapeKey: false,
          width: 500,
        });

        if (!result.isConfirmed) {
          ticketsProcesados.delete(ticketId);
          return;
        }

        // Marcar como usado
        if (modo === "entradas") {
          await updateDoc(refActual, { usado: true });
          qrResultado.textContent = "✅ Entrada válida - Permitido el ingreso";
        } else if (modo === "compras") {
          await updateDoc(refActual, { usado: true, estado: "retirado" });
          qrResultado.textContent = "✅ Pedido válido - Entregar al cliente";
          if (typeof mostrarPedidosConfirmados === "function") {
            mostrarPedidosConfirmados(ticketData.usuarioId);
          }
        }

        qrResultado.className = "qr-resultado valid";
        qrInfo.textContent = `${modo === "entradas" ? "Evento" : "Pedido"}: ${
          ticketData.nombre || "Sin nombre"
        } | Usuario: ${ticketData.usuarioNombre || "Desconocido"}`;
      }
    } else if (snapOtra.exists()) {
      const ticketData = snapOtra.data();
      console.log("Ticket encontrado en otra colección:", ticketData);

      qrResultado.textContent =
        modo === "entradas"
          ? "⚠ Este QR corresponde a un pedido"
          : "⚠ Este QR corresponde a una entrada";
      qrResultado.className = "qr-resultado other";

      await Swal.fire({
        title: "⚠ Ticket de otra colección",
        html: `<p style="color:orange; font-size:0.9em">
                Este QR corresponde a ${
                  modo === "entradas" ? "un pedido" : "una entrada"
                } y no puede ser confirmado en este modo.
              </p>`,
        icon: "info",
        confirmButtonText: "Aceptar",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    } else {
      console.log("Ticket no encontrado en ninguna colección");
      qrResultado.textContent =
        modo === "entradas" ? "❌ Entrada inválida" : "❌ Pedido inválido";
      qrResultado.className = "qr-resultado invalid";
    }

    ticketsProcesados.delete(ticketId);
  } catch (err) {
    console.error("Error validando ticket:", err);
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
