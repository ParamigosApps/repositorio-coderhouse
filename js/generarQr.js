import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

const tamañoQR = 220;

export async function generarQr({
  ticketId,
  nombreEvento = "Evento",
  tipo = "Entrada",
  usuario = "Invitado",
  fecha = "Fecha no disponible",
  lugar = "Lugar a definir",
  precio = 0,
  qrContainer = null,
  downloadLink = null,
  modoAdmin = false,
  tamaño = tamañoQR,
}) {
  try {
    if (!ticketId) throw new Error("TicketID es requerido para generar QR.");

    const crearQr = (contenedor, texto, size = tamañoQR) => {
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

    const contenidoQr = `${tipo}: ${ticketId}`;

    if (qrContainer) {
      crearQr(qrContainer, contenidoQr, tamaño);

      if (downloadLink) {
        setTimeout(() => {
          const img =
            qrContainer.querySelector("img") ||
            qrContainer.querySelector("canvas");
          if (img) {
            const src =
              img.tagName === "IMG" ? img.src : img.toDataURL("image/png");
            downloadLink.href = src;
            downloadLink.download = `${tipo.toLowerCase()}_${ticketId}.png`;
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
      crearQr(qrDiv, contenidoQr, tamaño);

      Swal.fire({
        title: `Tu ${tipo.toLowerCase()} 🎫`,
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

// Función para generar tickets de compra
export async function generarTicketQr({
  carrito = [],
  usuarioId,
  nombreUsuario = "Invitado",
  lugar = "Tienda",
  total = 0,
}) {
  const ticketId = `TCK-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  const fecha = new Date().toLocaleString();

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
        nombreEvento: "Compra",
        tipo: "Compra",
        usuario: nombreUsuario,
        fecha,
        lugar,
        precio: total,
        qrContainer,
      });
    },
    confirmButtonText: "Cerrar",
    customClass: { confirmButton: "btn btn-dark" },
    buttonsStyling: false,
  });
}
