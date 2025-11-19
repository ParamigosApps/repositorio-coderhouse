import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { formatearFecha } from "./utils.js";

export async function generarQr({
  ticketId,
  nombreEvento,
  usuario = "Invitado",
  fecha = "Fecha no disponible",
  lugar = "Lugar a definir",
  precio = 0,
  qrContainer = null,
  downloadLink = null,
  modoAdmin = false, // ⚡ true = no mostrar modal
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

    if (qrContainer) {
      // ⚡ Siempre genera en el contenedor, no abre modal
      crearQr(qrContainer, ticketId, tamaño);

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

      // ⚡ Solo mostrar modal si NO es modoAdmin
      if (modoAdmin) {
        console.log("MODO ADMIN ACTIVADO");
        return;
      } else console.log("MODO ADMIN DESACTIVADO");
    }

    // Modal para cliente solo si no se pasó qrContainer o modoAdmin = false
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
      crearQr(qrDiv, ticketId, tamaño);

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

export async function generarTicketQr({
  carrito,
  usuarioId,
  nombreUsuario = "Invitado",
  lugar = "Tienda",
  total,
}) {
  const ticketId = `TCK-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  const fecha = new Date().toLocaleString();

  // Texto real almacenado dentro del QR
  const contenidoQr = `
TICKET: ${ticketId}
CLIENTE: ${nombreUsuario}
USUARIO_ID: ${usuarioId}
LUGAR: ${lugar}
TOTAL: $${total}
FECHA: ${fecha}

PRODUCTOS:
${carrito.map((p) => `- ${p.nombre} x${p.enCarrito} ($${p.precio})`).join("\n")}
`;

  // Mostrar modal antes del QR
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
      await generarQr({
        ticketId,
        contenidoQr,
        tamaño: 220,
        qrContainer,
      });
    },
    confirmButtonText: "Cerrar",
    customClass: {
      confirmButton: "btn btn-dark",
    },
    buttonsStyling: false,
  });
}
