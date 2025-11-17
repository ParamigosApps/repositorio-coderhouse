import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { formatearFecha } from "./utils.js";

export async function generarQr({
  ticketId,
  nombreEvento,
  usuario = "Invitado",
  fecha = "Fecha no disponible",
  lugar = "Lugar a definir",
  precio = 0,
  qrContainer = null, // contenedor para QR individual
  downloadLink = null, // link de descarga
  individual = false, // si es true, no se abre Swal
}) {
  try {
    console.log(
      "TicketID recibido para QR:",
      ticketId,
      typeof ticketId,
      ticketId.length
    );

    // MODO MODAL
    if (!individual) {
      const tempDiv = document.createElement("div");
      tempDiv.style.textAlign = "center";

      const info = document.createElement("div");
      info.innerHTML = `
        <h5>🎟 ${nombreEvento}</h5>
        <p><strong>ID:</strong> ${ticketId}</p>
        <p><strong>Usuario:</strong> ${usuario}</p>
        <p><strong>Fecha:</strong> ${
          fecha ? formatearFecha(fecha) : "Sin fecha"
        }</p>
        <p><strong>Lugar:</strong> ${lugar}</p>
        <p><strong>Precio:</strong> $${precio}</p>
      `;

      tempDiv.appendChild(info);

      const qrDiv = document.createElement("div");
      qrDiv.id = "qrcode";
      qrDiv.style.margin = "0 auto 10px";
      tempDiv.appendChild(qrDiv);

      qrDiv.innerHTML = ""; // LIMPIAR ANTES DE GENERAR

      console.log("🔍 Generando QR con texto:", ticketId);

      new QRCode(qrDiv, {
        text: ticketId.toString(),
        width: 220,
        height: 220,
        correctLevel: QRCode.CorrectLevel.H,
      });

      Swal.fire({
        title: "Tu entrada 🎫",
        html: tempDiv,
        showConfirmButton: true,
        confirmButtonText: "Cerrar",
        width: 500,
      });

      return;
    }

    // MODO INDIVIDUAL (lista mis entradas)
    if (!qrContainer)
      throw new Error("qrContainer es requerido para individual = true");

    qrContainer.innerHTML = ""; // LIMPIAR

    new QRCode(qrContainer, {
      text: ticketId.toString(),
      width: 180,
      height: 180,
      correctLevel: QRCode.CorrectLevel.H,
    });

    // Descarga de imagen si existe link
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
  } catch (err) {
    console.error("Error generando QR:", err);
    if (!individual) Swal.fire("Error", "No se pudo generar el QR.", "error");
  }
}
