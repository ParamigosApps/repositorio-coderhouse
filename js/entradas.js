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
export async function pedirEntrada(eventoId, eventoParam) {
  try {
    console.log("📥 pedirEntrada() evento:", eventoId, eventoParam);

    const usuarioId = localStorage.getItem("usuarioId") || "Invitado";
    const nombreEvento = eventoParam.nombre || "Evento sin nombre";
    const fecha = eventoParam.fecha || null;
    const lugar = eventoParam.lugar || "Lugar a definir";
    const precio = parseFloat(eventoParam.precio) || 0;
    const maxEntradas = eventoParam?.maxEntradasPorUsuario || 2;

    if (precio === 0) {
      const { value: cantidad } = await Swal.fire({
        title: "🎟 Entradas gratuitas",
        text: `Podés obtener hasta ${maxEntradas} entradas.`,
        input: "number",
        inputAttributes: { min: 1, max: maxEntradas, step: 1 },
        inputValue: 1,
        showCancelButton: true,
        confirmButtonText: "Conseguir",
      });

      if (!cantidad) return;

      for (let i = 0; i < cantidad; i++) {
        await crearEntrada(eventoId, {
          usuarioId,
          nombreEvento,
          fecha,
          lugar,
          precio: "Gratis",
          descripcion: eventoParam.descripcion || "",
        });
      }

      Swal.fire("👌 Listo", `Generaste ${cantidad} entrada(s).`, "success");
      return;
    }

    // EVENTO PAGO
    const { value: metodo } = await Swal.fire({
      title: "💳 Evento pago",
      text: `Entrada: $${precio} ARS`,
      icon: "info",
      input: "radio",
      inputOptions: {
        mp: "Mercado Pago (tarjeta, débito, transferencia)",
      },
      inputValidator: (value) => {
        if (!value) return "Selecciona un método para continuar";
      },
      confirmButtonText: "Continuar",
      showCancelButton: true,
      cancelButtonText: "Volver",
    });

    if (!metodo) return;

    if (metodo === "mp") {
      console.log("🟦 Opción MercadoPago seleccionada");
      Swal.fire({
        title: "Conectando con Mercado Pago...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const response = await fetch("/api/crear-preferencia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombreEvento,
            precio,
            cantidad: 1,
          }),
        });

        const data = await response.json();
        console.log("📦 Respuesta crear-preferencia:", data);

        Swal.close();

        if (!data.init_point) {
          Swal.fire("Error", "No se pudo iniciar el pago", "error");
          return;
        }

        console.log("🔗 Redirigiendo a:", data.init_point);
        window.location.href = data.init_point; // ENVÍA A MERCADO PAGO
        return;
      } catch (err) {
        console.error("❌ Error al conectar con MP:", err);
        Swal.fire("Error", "No fue posible conectar con Mercado Pago", "error");
        return;
      }
    }
  } catch (err) {
    console.error("❌ Error al procesar entrada:", err);
    Swal.fire("Error", "No se pudo procesar la entrada.", "error");
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
