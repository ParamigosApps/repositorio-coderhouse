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
    // Modal por defecto (individual = false)
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

      new QRCode(qrDiv, {
        text: ticketId, // Solo ID
        width: 240, // 20% más grande
        height: 240,
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

    // QR individual (para listado de entradas)
    if (!qrContainer)
      throw new Error("qrContainer es requerido para individual = true");

    qrContainer.innerHTML = ""; // limpiar QR anterior

    new QRCode(qrContainer, {
      text: ticketId, // Solo ID
      width: 180, // 20% más grande
      height: 180,
      correctLevel: QRCode.CorrectLevel.H,
    });

    // Link de descarga si existe
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
