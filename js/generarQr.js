import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

// 🔹 Genera el QR y lo muestra en popup
export async function generarQr(
  entradaId,
  nombreEvento,
  usuarioId = "Invitado",
  fecha = "Fecha no disponible",
  lugar = "Lugar a definir"
) {
  try {
    // Crear contenedor temporal
    const tempDiv = document.createElement("div");
    const qrContainer = document.createElement("div");
    qrContainer.id = "qrcode";
    qrContainer.className = "d-flex justify-content-center my-3";

    // Info visible en el popup
    const info = document.createElement("div");
    info.innerHTML = `
      <h5 class="fw-semibold mb-2">🎟️ ${nombreEvento}</h5>
      <p><strong>Código:</strong> ${entradaId}</p>
      <p><strong>Usuario:</strong> ${usuarioId}</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Lugar:</strong> ${lugar}</p>
    `;

    const downloadLink = document.createElement("a");
    downloadLink.id = "downloadQr";
    downloadLink.className = "btn btn-dark mt-3";
    downloadLink.style.display = "none";
    downloadLink.textContent = "Descargar QR";

    tempDiv.appendChild(info);
    tempDiv.appendChild(qrContainer);
    tempDiv.appendChild(downloadLink);

    // 🔹 Datos incluidos en el QR
    const qrData = `
      Evento: ${nombreEvento}
      Usuario: ${usuarioId}
      Fecha: ${fecha}
      Lugar: ${lugar}
      ID: ${entradaId}
    `;

    new QRCode(qrContainer, {
      text: qrData.trim(),
      width: 200,
      height: 200,
    });

    // 🔹 Enlace de descarga
    setTimeout(() => {
      const canvas = qrContainer.querySelector("canvas");
      if (canvas) {
        const imgData = canvas.toDataURL("image/png");
        downloadLink.href = imgData;
        downloadLink.download = `entrada_${entradaId}.png`;
        downloadLink.style.display = "inline-block";
      }
    }, 400);

    // 🔹 Mostrar popup con QR
    Swal.fire({
      title: "Tu entrada 🎫",
      html: tempDiv,
      showConfirmButton: false,
      showCloseButton: true,
      width: 420,
      didOpen: () => {
        Swal.getHtmlContainer().appendChild(tempDiv);
      },
    });
  } catch (err) {
    console.error("Error al generar QR:", err);
    Swal.fire("Error", "No se pudo generar el código QR.", "error");
  }
}
