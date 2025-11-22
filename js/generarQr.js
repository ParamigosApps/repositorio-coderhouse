import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { formatearFecha } from "./utils.js";

const tamañoQR = 220;

export async function generarEntradaQr({
  ticketId,
  contenido = null, // ⚡ nuevo parámetro
  nombreEvento,
  usuario = "Invitado",
  fecha = "Fecha no disponible",
  lugar = "Lugar a definir",
  precio = 0,
  qrContainer = null,
  downloadLink = null,
  modoAdmin = false,
  tamaño = 220,
}) {
  try {
    if (!ticketId) throw new Error("TicketID es requerido para generar QR.");

    const crearQr = (contenedor, texto, size = 220) => {
      contenedor.innerHTML = "";
      contenedor.style.display = "flex";
      contenedor.style.justifyContent = "center";
      contenedor.style.alignItems = "center";
      contenedor.style.margin = "10px 0";

      new QRCode(contenedor, {
        text: texto.toString(),
        width: size,
        height: size,
        correctLevel: QRCode.CorrectLevel.H,
      });
    };

    const textoQr = contenido || ticketId; // ⚡ si hay contenido, lo usa

    if (qrContainer) {
      crearQr(qrContainer, textoQr, tamaño);

      if (downloadLink) {
        setTimeout(() => {
          const img =
            qrContainer.querySelector("img") ||
            qrContainer.querySelector("canvas");
          if (img) {
            const src =
              img.tagName === "IMG" ? img.src : img.toDataURL("image/png");
            downloadLink.href = src;
            downloadLink.download = `entrada_${ticketId}.png`;
            downloadLink.style.display = "inline-block";
          }
        }, 500);
      }

      if (modoAdmin) return;
    }

    if (!modoAdmin && !qrContainer) {
      const tempDiv = document.createElement("div");
      tempDiv.style.textAlign = "center";

      const info = document.createElement("div");
      const displayPrecio = !precio || precio < 1 ? "Gratis" : `$${precio}`;
      info.innerHTML = `
        <h5>🎟 ${nombreEvento}</h5>
        <p><strong>ID:</strong> ${ticketId}</p>
        <p><strong>Usuario:</strong> ${usuario}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Lugar:</strong> ${lugar}</p>
        <p><strong>Precio:</strong> ${displayPrecio}</p>
      `;
      tempDiv.appendChild(info);

      const qrDiv = document.createElement("div");
      tempDiv.appendChild(qrDiv);
      crearQr(qrDiv, textoQr, tamaño);

      Swal.fire({
        title: "Tu entrada 🎫",
        html: tempDiv,
        showConfirmButton: true,
        confirmButtonText: "Cerrar",
        width: 500,
      });
    }
  } catch (err) {
    console.error("Error generando QR:", err);
    if (!modoAdmin) Swal.fire("Error", "No se pudo generar el QR.", "error");
  }
}

export async function generarCompraQr({
  carrito,
  usuarioId,
  nombreUsuario = "Invitado",
  lugar = "Tienda",
  total,
}) {
  const ticketId = `${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  const fecha = new Date().toLocaleString();

  // Texto para el QR: solo el ticketId
  const contenidoQr = ticketId;

  // Mostrar modal con info del ticket
  await Swal.fire({
    title: `🧾 Ticket generado`,
    html: `
      <p><strong>Ticket:</strong> ${ticketId}</p>
      <p><strong>Cliente:</strong> ${nombreUsuario}</p>
      <p><strong>Lugar:</strong> ${lugar}</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Total:</strong> $${total}</p>
      <hr>
      <div id="qrContainer" style="display:flex;justify-content:center;"></div>
    `,
    didOpen: async () => {
      const qrContainer = document.getElementById("qrContainer");
      await generarEntradaQr({
        ticketId,
        contenido: contenidoQr,
        tamaño: tamañoQR,
        qrContainer,
      });
    },
    confirmButtonText: "Cerrar",
    customClass: { confirmButton: "btn btn-dark" },
    buttonsStyling: false,
  });

  return ticketId; // Devuelve ticketId para guardar en la base
}
