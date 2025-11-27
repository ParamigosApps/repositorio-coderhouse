// /js/lector-qr.js  (o como se llame tu archivo)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { formatearFecha } from "./utils.js";

// ======================================================
// 🔥 FIREBASE
// ======================================================
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

// ======================================================
// 🎥 ELEMENTOS DOM / ESTADO
// ======================================================
const video = document.getElementById("camara");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const qrResultado = document.getElementById("qr-resultado");
const qrInfo = document.getElementById("qr-info-adicional");
const qrTitulo = document.querySelector(".qr-title");
const ticketsProcesados = new Set();

// Entrada manual
const manualQrInput = document.getElementById("manualQrInput");
const manualQrBtn = document.getElementById("manualQrBtn");

// Botón salir
const exitQrBtn = document.getElementById("exitQrBtn");

// ======================================================
// 🔁 MODO LECTOR (entradas / compras)
// ======================================================
const urlParams = new URLSearchParams(window.location.search);
let modo = urlParams.get("modo") || "entradas";

// Normalizo por si algún día usás "entrada"/"compra"
if (modo === "entrada") modo = "entradas";
if (modo === "compra") modo = "compras";

setTituloModo(modo);

function setTituloModo(modoActual = "entradas") {
  qrTitulo.textContent =
    modoActual === "entradas" ? "ESCÁNER ENTRADAS" : "ESCÁNER COMPRAS";
}

// ======================================================
// 🧷 BOTÓN MANUAL
// ======================================================
manualQrBtn.addEventListener("click", () => {
  const ticketId = manualQrInput.value.trim();
  if (!ticketId) return;

  if (!ticketsProcesados.has(ticketId)) {
    ticketsProcesados.add(ticketId);
    validarTicket(ticketId, modo);
    manualQrInput.value = "";
  }
});

manualQrInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") manualQrBtn.click();
});

// ======================================================
// 🚪 BOTÓN SALIR
// ======================================================
exitQrBtn.addEventListener("click", () => {
  const stream = video.srcObject;
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
  window.location.href = "/admin.html";
});

// ======================================================
// 📷 INICIAR CÁMARA
// ======================================================
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

// ======================================================
// 🔎 ESCANEAR QR LOOP
// ======================================================
function scanQR() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      const ticketId = code.data
        .replace(/^(Entrada|Compra|Carrito):\s*/i, "")
        .trim();

      if (!ticketsProcesados.has(ticketId)) {
        ticketsProcesados.add(ticketId);
        validarTicket(ticketId, modo);
        console.log("Escaneado → ticketId:", ticketId, " | modo:", modo);
      }
    }
  }
  requestAnimationFrame(scanQR);
}

// ======================================================
// ✅ VALIDAR TICKET
// ======================================================
async function validarTicket(ticketId, modoActual = "entradas") {
  console.log("Ticket escaneado:", ticketId);
  console.log("Modo actual:", modoActual);

  try {
    const coleccionActual = modoActual === "compras" ? "compras" : "entradas";
    const coleccionOtra =
      coleccionActual === "entradas" ? "compras" : "entradas";

    const refActual = doc(db, coleccionActual, ticketId);
    const refOtra = doc(db, coleccionOtra, ticketId);

    const snapActual = await getDoc(refActual);
    const snapOtra = await getDoc(refOtra);

    qrInfo.textContent = "";

    // --------------------------------------------------
    // 1) ENCONTRADO EN COLECCIÓN CORRECTA
    // --------------------------------------------------
    if (snapActual.exists()) {
      const ticketData = snapActual.data();
      console.log("Ticket en colección actual:", coleccionActual, ticketData);

      // Fecha segura (Timestamp o Date)
      let fechaFormateada = "Sin fecha";
      if (ticketData.fecha) {
        const fechaRaw = ticketData.fecha.toDate
          ? ticketData.fecha.toDate()
          : ticketData.fecha;
        fechaFormateada = formatearFecha(fechaRaw);
      }

      // Si ya fue usado
      if (ticketData.usado) {
        qrResultado.textContent =
          modoActual === "entradas"
            ? "⚠ Entrada ya usada"
            : "⚠ Pedido ya entregado";
        qrResultado.className = "qr-resultado used";

        qrInfo.textContent =
          modoActual === "entradas"
            ? `Evento: ${
                ticketData.nombreEvento || ticketData.nombre || "Sin nombre"
              }`
            : `Pedido #${ticketData.numeroPedido || ticketId}`;
        ticketsProcesados.delete(ticketId);
        resetMensajesLuego();
        return;
      }

      // ------------------------------------------------
      // DETALLE DE PRODUCTOS (solo compras)
      // ------------------------------------------------
      let detalleHTML = "";
      if (modoActual === "compras" && ticketData.items?.length) {
        detalleHTML = `
          <div style="max-height:200px;overflow-y:auto;border:1px solid #ccc;padding:5px;margin-top:5px;">
            <table style="width:100%;border-collapse:collapse;font-size:0.9em">
              <thead>
                <tr>
                  <th style="border-bottom:1px solid #ccc;text-align:left">Producto</th>
                  <th style="border-bottom:1px solid #ccc;text-align:center">Cant.</th>
                  <th style="border-bottom:1px solid #ccc;text-align:right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${ticketData.items
                  .map(
                    (p) => `
                      <tr>
                        <td>${p.nombre}</td>
                        <td style="text-align:center">${p.enCarrito}</td>
                        <td style="text-align:right">$${
                          p.precio * p.enCarrito
                        }</td>
                      </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>`;
      }

      // ------------------------------------------------
      // DATOS PARA SWAL
      // ------------------------------------------------
      const tituloSwal =
        modoActual === "entradas" ? "Aprobar entrada" : "Confirmar pedido";

      const lineaPrincipal =
        modoActual === "entradas"
          ? `<p><strong>Evento:</strong> ${
              ticketData.nombreEvento || ticketData.nombre || "Sin nombre"
            }</p>`
          : `<p><strong>Pedido:</strong> #${
              ticketData.numeroPedido || ticketId
            }</p>`;

      const usuarioLinea = `<p><strong>Usuario:</strong> ${
        ticketData.usuarioNombre || ticketData.usuario || "Desconocido"
      }</p>`;

      const extraCompras =
        modoActual === "compras"
          ? `<p><strong>Total:</strong> $${ticketData.total || 0}</p>`
          : "";

      const htmlSwal = `
        ${lineaPrincipal}
        ${usuarioLinea}
        <p><strong>Fecha:</strong> ${fechaFormateada}</p>
        ${extraCompras}
        ${detalleHTML}
      `;

      const result = await Swal.fire({
        title: tituloSwal,
        html: htmlSwal,
        icon: "question",
        showCancelButton: true,
        confirmButtonText:
          modoActual === "entradas" ? "Permitir ingreso" : "Confirmar retiro",
        cancelButtonText: "Cancelar",
        allowOutsideClick: false,
        allowEscapeKey: false,
        width: 520,
      });

      if (!result.isConfirmed) {
        ticketsProcesados.delete(ticketId);
        return resetMensajesLuego();
      }

      // ------------------------------------------------
      // MARCAR COMO USADO
      // ------------------------------------------------
      if (modoActual === "entradas") {
        await updateDoc(refActual, { usado: true });
        qrResultado.textContent = "✅ Entrada válida - Permitido el ingreso";
        qrInfo.textContent = `Evento: ${
          ticketData.nombreEvento || ticketData.nombre || "Sin nombre"
        } | Usuario: ${
          ticketData.usuarioNombre || ticketData.usuario || "Desconocido"
        }`;
      } else {
        await updateDoc(refActual, {
          usado: true,
          estado: "retirado",
        });
        qrResultado.textContent = "✅ Pedido válido - Entregar al cliente";
        qrInfo.textContent = `Pedido #${
          ticketData.numeroPedido || ticketId
        } | Usuario: ${
          ticketData.usuarioNombre || ticketData.usuario || "Desconocido"
        } | Total: $${ticketData.total || 0}`;

        // Si tenés una función global para refrescar la lista de pedidos:
        if (typeof mostrarPedidosConfirmados === "function") {
          mostrarPedidosConfirmados(ticketData.usuarioId);
        }
      }

      qrResultado.className = "qr-resultado valid";
    }

    // --------------------------------------------------
    // 2) NO ENCONTRADO EN COLECCIÓN ACTUAL PERO SÍ EN LA OTRA
    // --------------------------------------------------
    else if (snapOtra.exists()) {
      const ticketData = snapOtra.data();
      console.log("Ticket en la otra colección:", coleccionOtra, ticketData);

      qrResultado.textContent =
        modoActual === "entradas"
          ? "⚠ Este QR corresponde a un pedido"
          : "⚠ Este QR corresponde a una entrada";
      qrResultado.className = "qr-resultado other";

      await Swal.fire({
        title:
          modoActual === "entradas"
            ? "QR inválido en este modo"
            : "QR inválido en este modo",
        html: `<p style="color:orange; font-size:0.9em">
                Este QR corresponde a la colección <b>${coleccionOtra}</b> y no puede ser confirmado en el modo actual.
              </p>`,
        icon: "info",
        confirmButtonText: "Aceptar",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    }

    // --------------------------------------------------
    // 3) NO EXISTE EN NINGUNA COLECCIÓN
    // --------------------------------------------------
    else {
      console.log("Ticket no encontrado en ninguna colección");
      qrResultado.textContent =
        modoActual === "entradas"
          ? "❌ Entrada inválida"
          : "❌ Pedido inválido";
      qrResultado.className = "qr-resultado invalid";
    }
  } catch (err) {
    console.error("Error validando ticket:", err);
    qrResultado.textContent = "Error validando ticket";
    qrResultado.className = "qr-resultado invalid";
  } finally {
    ticketsProcesados.delete(ticketId);
    resetMensajesLuego();
  }
}

// ======================================================
// 🕒 RESET MENSAJES
// ======================================================
function resetMensajesLuego() {
  setTimeout(() => {
    qrResultado.textContent = "Esperando QR...";
    qrResultado.className = "qr-resultado";
    qrInfo.textContent = "";
  }, 3000);
}
