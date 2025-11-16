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

// =======================================================
// GENERADOR DE QR - EXPORTADO
// =======================================================
export function generarQr(ticketId, entradaData) {
  console.log("🟦 generarQr() ejecutado con:", ticketId, entradaData);

  const qrcodeContainer = document.getElementById("qrcode");
  const ticketInfo = document.getElementById("ticketInfo");
  const downloadLink = document.getElementById("downloadQr");
  const qrModalEl = document.getElementById("qrModal");

  if (!qrcodeContainer || !ticketInfo || !downloadLink || !qrModalEl) {
    return console.warn("⚠ Faltan elementos del DOM para mostrar el QR");
  }

  qrcodeContainer.innerHTML = "";

  ticketInfo.innerHTML = `
    🧾 Ticket: ${ticketId}<br>
    🎟 Evento: ${entradaData.nombreEvento}<br>
    📅 Fecha: ${
      entradaData.fecha ? formatearFecha(entradaData.fecha) : "Sin fecha"
    }<br>
    📍 Lugar: ${entradaData.lugar}<br>
    💲 Precio: ${entradaData.precio}
  `;

  new QRCode(qrcodeContainer, {
    text: ticketId,
    width: 200,
    height: 200,
    correctLevel: QRCode.CorrectLevel.H,
  });

  setTimeout(() => {
    const img = qrcodeContainer.querySelector("img");
    if (!img) return console.warn("⚠ No se encontró imagen QR aún");

    downloadLink.href = img.src;
    downloadLink.download = `entrada_${ticketId}.png`;
    downloadLink.style.display = "inline-block";
  }, 600);

  new bootstrap.Modal(qrModalEl).show();
}

// =======================================================
// PEDIR ENTRADA
// =======================================================
export async function pedirEntrada(eventoId, e) {
  console.log("🎟 Iniciando pedido de entrada para:", eventoId, e);

  const payload = {
    nombreEvento: e.nombre,
    precio: e.precio,
    cantidad: 1,
  };

  console.log("📦 Enviando payload a crear-preferencia:", payload);

  try {
    const resp = await fetch("http://127.0.0.1:5503/api/crear-preferencia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("📡 Respuesta de MP:", resp.status, resp.statusText);

    const text = await resp.text();
    console.log("📨 Raw respuesta:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("❌ No se pudo parsear JSON correctamente:", err);
      return Swal.fire("Error", "Respuesta inválida del servidor.", "error");
    }

    console.log("📄 JSON parseado correctamente:", data);

    if (!data.init_point) {
      console.error("❌ No vino init_point en la respuesta:", data);
      return Swal.fire(
        "Error",
        "MercadoPago no devolvió un link de pago.",
        "error"
      );
    }

    console.log("🔗 Abriendo link de pago:", data.init_point);
    window.open(data.init_point, "_blank");
  } catch (error) {
    console.error("💥 Error general al procesar pedido:", error);
    Swal.fire("Error", "Error de conexión con MercadoPago", "error");
  }
}

// =======================================================
// CREAR ENTRADA + MOSTRAR QR
// =======================================================
async function crearEntrada(eventoId, entradaData) {
  console.log("🟨 crearEntrada() ejecutado:", eventoId, entradaData);

  const docRef = await addDoc(collection(db, "entradas"), {
    eventoId,
    ...entradaData,
    creadaEn: new Date().toISOString(),
    usado: false,
  });

  console.log("🧾 Entrada creada con ID:", docRef.id);

  generarQr(docRef.id, entradaData);
}
