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
// Cargar eventos (lista principal)
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

      // mostramos con los campos esperados (nombre, fecha, lugar)
      const htmlNombre = escapeHtml(e.nombre) || "Evento sin nombre";
      const htmlFecha = escapeHtml(e.fecha) || "Sin fecha";
      const htmlLugar = escapeHtml(e.lugar) || "Sin lugar";
      let htmlPrecio = e.precio;
      const htmlDesc = escapeHtml(e.descripcion) || "Sin descripción";

      htmlPrecio = htmlPrecio === 0 ? "Entrada gratuita" : `$${htmlPrecio}`;
      const div = document.createElement("div");
      div.className = "card mb-2 p-3 shadow-sm";

      const displayPrecio =
        e.precio === 0 || e.precio === null || e.precio === undefined
          ? "Entrada gratuita"
          : `$${escapeHtml(String(e.precio))}`;

      div.innerHTML = `
        <h5 class="mb-1">${htmlNombre}</h5>
        <p class="mb-0">📅 Fecha: ${formatearFecha(htmlFecha)}</p>
        <p class="mb-0">📍 Lugar: ${htmlLugar}</p>
        
        <p class="mb-0">💲 Precio: ${displayPrecio}</p>
        <p class="mb-0">📋 Descripción: ${htmlDesc}</p>
        <br>
        <button class="btn btn-dark w-75 d-block mx-auto mb-1 btn-pedir-entrada" data-id="${id}" data-nombre="${escapeHtml(
        e.nombre || ""
      )}">
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
import { pagarEntrada } from "./pagarEntrada.js";

document.getElementById("btnPagar").addEventListener("click", () => {
  const nombre = "Concierto";
  const precio = 1000;
  const cantidad = 2;
  pagarEntrada(nombre, precio, cantidad);
});

// -----------------------------
// Pedir entrada
// -----------------------------
export async function pedirEntrada(eventoId, eventoParam) {
  try {
    const usuarioId = localStorage.getItem("usuarioId") || "Invitado";
    const esObjeto = eventoParam && typeof eventoParam === "object";

    const nombreEvento = esObjeto
      ? eventoParam.nombre || "Evento sin nombre"
      : eventoParam;
    const fecha = esObjeto ? eventoParam.fecha || null : null;
    const lugar = esObjeto
      ? eventoParam.lugar || "Lugar a definir"
      : "Lugar a definir";
    const precio = parseFloat(eventoParam?.precio) || 0;
    const maxEntradas = eventoParam?.maxEntradasPorUsuario || 2;

    // ⚙️ 1️⃣ Si el evento es gratuito
    if (precio === 0) {
      const { value: cantidad } = await Swal.fire({
        title: "Entradas gratuitas 🎟️",
        text: `Podés obtener hasta ${maxEntradas} entradas.`,
        input: "number",
        inputAttributes: {
          min: 1,
          max: maxEntradas,
          step: 1,
        },
        inputValue: 1,
        confirmButtonText: "Conseguir",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
      });

      if (!cantidad) return;

      for (let i = 0; i < cantidad; i++) {
        await crearEntrada(eventoId, {
          usuarioId,
          nombreEvento,
          fecha,
          lugar,
          precio: "Entrada gratuita",
          descripcion: eventoParam?.descripcion || "Sin descripción disponible",
        });
      }

      Swal.fire("✅ Listo", `Generaste ${cantidad} entrada(s).`, "success");
      return;
    }

    // ⚙️ 2️⃣ Si el evento es pago
    const { value: metodo } = await Swal.fire({
      title: "Seleccioná método de pago 💳",
      input: "radio",
      inputOptions: {
        mp: "Mercado Pago",
        transf: "Transferencia bancaria",
      },
      inputValidator: (value) => !value && "Elegí un método para continuar",
      confirmButtonText: "Continuar",
      showCancelButton: true,
    });

    if (!metodo) return;

    if (metodo === "mp") {
      Swal.fire(
        "🔗 Mercado Pago",
        "Serás redirigido a Mercado Pago para completar el pago.",
        "info"
      );
      // acá podrías abrir un link real de pago con MP (por ejemplo usando una preferencia)
      window.open("https://www.mercadopago.com.ar/", "_blank");
    } else {
      Swal.fire(
        "💰 Transferencia",
        "Datos bancarios:<br>Alias: eventoshoy.mp<br>CBU: 1234567890123456789012<br>Enviá el comprobante al organizador.",
        "info"
      );
    }
  } catch (err) {
    console.error("Error al procesar entrada:", err);
    Swal.fire("Error", "No se pudo procesar la entrada.", "error");
  }
}

// 🔹 helper para crear la entrada y generar el QR
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
// Generar QR y mostrar modal
// -----------------------------
export function generarQr(ticketId, entradaData) {
  const qrcodeContainer = document.getElementById("qrcode");
  const ticketInfo = document.getElementById("ticketInfo");
  const downloadLink = document.getElementById("downloadQr");
  const qrModalEl = document.getElementById("qrModal");

  if (!qrcodeContainer || !ticketInfo || !downloadLink || !qrModalEl) {
    console.warn("Faltan elementos del DOM para mostrar QR modal.");
    return;
  }

  qrcodeContainer.innerHTML = "";

  ticketInfo.innerHTML = `Ticket: ${ticketId}<br>Evento: ${
    entradaData.nombreEvento
  }<br>
📅 Fecha: ${formatearFecha(entradaData.fecha)}<br>
📍 Lugar: ${entradaData.lugar}`;

  const qrData = ticketId; // solo ID para evitar overflow
  new QRCode(qrcodeContainer, {
    text: qrData,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });

  setTimeout(() => {
    const img = qrcodeContainer.querySelector("img");
    const canvas = qrcodeContainer.querySelector("canvas");
    let dataUrl = null;

    if (img) dataUrl = img.src;
    else if (canvas) dataUrl = canvas.toDataURL("image/png");

    if (dataUrl) {
      downloadLink.href = dataUrl;
      downloadLink.download = `entrada_${ticketId}.png`;
      downloadLink.style.display = "inline-block";
    } else {
      downloadLink.style.display = "none";
    }
  }, 500);

  new bootstrap.Modal(qrModalEl).show();
}

// -----------------------------
// Mostrar "Mis entradas"
// -----------------------------
export async function cargarMisEntradas() {
  const contenedor = document.getElementById("listaEntradas");
  if (!contenedor) return;

  contenedor.innerHTML = `<p class="text-center text-secondary mt-3">Cargando tus entradas...</p>`;

  try {
    const usuarioId = localStorage.getItem("usuarioId") || "Invitado";
    const q = query(
      collection(db, "entradas"),
      where("usuarioId", "==", usuarioId)
    );
    const snapshot = await getDocs(q);
    contenedor.innerHTML = "";

    if (snapshot.empty) {
      contenedor.innerHTML = `<p class="text-center text-secondary">No tenés entradas todavía.</p>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const e = docSnap.data();
      const id = docSnap.id;

      const nombre =
        e.nombreEvento ||
        e.eventoNombre ||
        "No se encontro el nombre del evento";
      const fechaCarta = e.fecha || "📅 Fecha no disponible";
      const lugarCarta = e.lugar || "📍 Lugar a definir";
      const descripcionCarta = e.descripcion || "📋 Sin descripción disponible";

      const div = document.createElement("div");
      div.className = "card mb-2 p-3 shadow-sm";
      div.innerHTML = `
        <h5 class="fw-semibold">   ${escapeHtml(nombre)}</h5>
        <p class="mb-0"><strong>📅 Fecha:</strong> ${escapeHtml(
          formatearFecha(fechaCarta)
        )}</p>
        <p class="mb-0"><strong>📍 Lugar:</strong> ${escapeHtml(lugarCarta)}</p>
        <p class="mb-0"><strong>📋 Descripción:</strong> ${escapeHtml(
          descripcionCarta
        )}</p>
        <p class="mb-0"><strong>🎫 Código ID:</strong> ${id}</p>
        <button class="btn btn-outline-dark w-50 mt-3 btn-ver-qr d-block mx-auto">Ver código QR</button>

      `;
      contenedor.appendChild(div);

      div.querySelector(".btn-ver-qr").addEventListener("click", () => {
        const entradaParaQr = {
          nombreEvento: nombre,
          usuarioId: e.usuarioId || "Invitado",
          fecha: formatearFecha(fechaCarta),
          lugar: lugarCarta,
          precio: e.precio || "Entrada gratuita",
          descripcion: e.descripcion || "Sin descripción disponible",
        };
        generarQr(id, entradaParaQr);
      });
    });
  } catch (err) {
    console.error("Error al cargar tus entradas:", err);
    contenedor.innerHTML = `<p class="text-danger text-center mt-3">Error al cargar tus entradas.</p>`;
  }
}

// -----------------------------
// Helpers
// -----------------------------
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
