// /js/entradas.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { db } from "/js/firebase.js";
import { formatearFecha } from "./utils.js";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// -----------------------------
// Cargar eventos
// -----------------------------
export async function cargarEventos() {
  const contenedor = document.getElementById("listaEventos");
  if (!contenedor) return;

  contenedor.innerHTML = `<p class="text-center text-secondary mt-3">Cargando eventos...</p>`;

  try {
    const snapshot = await getDocs(collection(db, "eventos"));
    contenedor.innerHTML = "";

    if (snapshot.empty) {
      contenedor.innerHTML = `<p class="text-center text-secondary">No hay eventos disponibles.</p>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const e = docSnap.data();
      const id = docSnap.id;

      const htmlNombre = escapeHtml(e.nombre) || "Evento sin nombre";
      const htmlFecha = escapeHtml(e.fecha) || "Sin fecha";
      const htmlLugar = escapeHtml(e.lugar) || "Sin lugar";
      const htmlDesc = escapeHtml(e.descripcion) || "Sin descripción";

      const displayPrecio =
        e.precio === 0 || e.precio === null || e.precio === undefined
          ? "Entrada gratuita"
          : `$${escapeHtml(String(e.precio))}`;

      const div = document.createElement("div");
      div.className = "card mb-2 p-3 shadow-sm";

      div.innerHTML = `
        <h5 class="mb-1">${htmlNombre}</h5>
        <p class="mb-0">📅 Fecha: ${formatearFecha(htmlFecha)}</p>
        <p class="mb-0">📍 Lugar: ${htmlLugar}</p>
        <p class="mb-0">💲 Precio: ${displayPrecio}</p>
        <p class="mb-0">📋 Descripción: ${htmlDesc}</p>
        <br>
        <button class="btn btn-dark w-75 d-block mx-auto mb-1 btn-pedir-entrada"
          data-id="${id}" data-nombre="${htmlNombre}">
          Conseguir entrada
        </button>
      `;

      contenedor.appendChild(div);

      div.querySelector(".btn-pedir-entrada").addEventListener("click", () => {
        pedirEntrada(id, e);
      });
    });
  } catch (err) {
    console.error("Error al cargar eventos:", err);
    contenedor.innerHTML = `<p class="text-danger text-center mt-3">Error al cargar eventos.</p>`;
  }
}

// -----------------------------
// Pedir entrada (Mercado Pago o Gratis)
// -----------------------------
export async function pedirEntrada(eventoId, eventoParam) {
  try {
    const usuarioId = localStorage.getItem("usuarioId") || "Invitado";

    const nombreEvento = eventoParam.nombre || "Evento sin nombre";
    const fecha = eventoParam.fecha || null;
    const lugar = eventoParam.lugar || "Lugar a definir";
    const precio = parseFloat(eventoParam.precio) || 0;
    const maxEntradas = eventoParam?.maxEntradasPorUsuario || 2;

    // 🎟️ Evento gratuito
    if (precio === 0) {
      const { value: cantidad } = await Swal.fire({
        title: "Entradas gratuitas 🎟️",
        text: `Podés obtener hasta ${maxEntradas} entradas.`,
        input: "number",
        inputAttributes: { min: 1, max: maxEntradas, step: 1 },
        inputValue: 1,
        confirmButtonText: "Conseguir",
        showCancelButton: true,
      });

      if (!cantidad) return;

      for (let i = 0; i < cantidad; i++) {
        await crearEntrada(eventoId, {
          usuarioId,
          nombreEvento,
          fecha,
          lugar,
          precio: "Entrada gratuita",
          descripcion: eventoParam.descripcion || "Sin descripción",
        });
      }

      Swal.fire("✅ Listo", `Generaste ${cantidad} entrada(s).`, "success");
      return;
    }

    // 💳 Evento pago
    const { value: metodo } = await Swal.fire({
      title: "Seleccioná método de pago 💳",
      input: "radio",
      inputOptions: {
        mp: "Mercado Pago",
        transf: "Transferencia bancaria",
      },
      inputValidator: (v) => !v && "Elegí un método de pago",
      confirmButtonText: "Continuar",
      showCancelButton: true,
    });

    if (!metodo) return;

    if (metodo === "mp") {
      const cantidad = 1;

      const response = await fetch("/api/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreEvento, precio, cantidad }),
      });

      if (!response.ok) {
        throw new Error("No se pudo obtener preferencia Mercado Pago");
      }

      const data = await response.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        Swal.fire("Error", "No se pudo generar el link de pago.", "error");
      }

      return;
    }

    // 💸 Transferencia
    Swal.fire(
      "💰 Transferencia",
      "Alias: eventoshoy.mp<br>CBU: 1234567890123456789012<br>Enviá el comprobante al organizador.",
      "info"
    );
  } catch (err) {
    console.error("❌ Error al procesar entrada:", err);
    Swal.fire("Error", "No se pudo procesar la entrada.", "error");
  }
}

async function crearEntrada(eventoId, entradaData) {
  const docRef = await addDoc(collection(db, "entradas"), {
    eventoId,
    ...entradaData,
    creadaEn: new Date().toISOString(),
    usado: false,
  });
  generarQr(docRef.id, entradaData);
}

// -----------------------------
// Generador QR
// -----------------------------
export function generarQr(ticketId, entradaData) {
  const qrcodeContainer = document.getElementById("qrcode");
  const ticketInfo = document.getElementById("ticketInfo");
  const downloadLink = document.getElementById("downloadQr");
  const qrModalEl = document.getElementById("qrModal");

  if (!qrcodeContainer || !ticketInfo || !downloadLink || !qrModalEl) {
    return console.warn("Faltan elementos del DOM para QR");
  }

  qrcodeContainer.innerHTML = "";

  ticketInfo.innerHTML = `
    Ticket: ${ticketId}<br>
    Evento: ${entradaData.nombreEvento}<br>
    📅 Fecha: ${formatearFecha(entradaData.fecha)}<br>
    📍 Lugar: ${entradaData.lugar}
  `;

  new QRCode(qrcodeContainer, {
    text: ticketId,
    width: 200,
    height: 200,
    correctLevel: QRCode.CorrectLevel.H,
  });

  setTimeout(() => {
    const img = qrcodeContainer.querySelector("img");
    downloadLink.href = img.src;
    downloadLink.download = `entrada_${ticketId}.png`;
    downloadLink.style.display = "inline-block";
  }, 500);

  new bootstrap.Modal(qrModalEl).show();
}

// Helper
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
