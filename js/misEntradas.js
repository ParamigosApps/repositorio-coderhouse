import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { db, auth } from "/js/firebase.js";
import { formatearFecha } from "./utils.js";
import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

export async function cargarEntradas() {
  const contenedor = document.getElementById("listaEntradas");
  if (!contenedor) return console.warn("⚠ listaEntradas no encontrado");

  contenedor.innerHTML = `<p class="text-secondary mt-3 text-center">Cargando entradas...</p>`;

  try {
    const usuarioId = auth.currentUser?.uid;
    if (!usuarioId) {
      contenedor.innerHTML = `<p class="text-danger mt-3 text-center">Debes iniciar sesión para ver tus entradas.</p>`;
      return;
    }

    const q = query(
      collection(db, "entradas"),
      where("usuarioId", "==", usuarioId)
    );
    const snapshot = await getDocs(q);

    contenedor.innerHTML = "";

    if (snapshot.empty) {
      contenedor.innerHTML = `<p class="text-secondary text-center">Todavía no generaste entradas.</p>`;
      return;
    }

    // Agrupar entradas por evento
    const entradasMap = {};
    snapshot.forEach((docSnap) => {
      const entrada = docSnap.data();
      const ticketId = docSnap.id;
      const key = entrada.eventoId || ticketId;

      if (!entradasMap[key]) {
        entradasMap[key] = { ...entrada, tickets: [ticketId] };
      } else {
        entradasMap[key].tickets.push(ticketId);
      }
    });

    // Renderizar entradas agrupadas
    Object.values(entradasMap).forEach((entrada) => {
      const div = document.createElement("div");
      div.className = "card mb-3 p-3 shadow-sm";

      div.innerHTML = `
        <h5 class="mb-1">${entrada.nombre || "Evento sin nombre"}</h5>
        <p class="mb-0">📅 ${formatearFecha(entrada.fecha) || "Sin fecha"}</p>
        <p class="mb-0">📍 ${entrada.lugar || "Lugar a definir"}</p>
        <p class="mb-0">💲 ${
          entrada.precio === 0 || entrada.precio == null
            ? "Entrada gratuita"
            : `$${entrada.precio}`
        }</p>
        <p class="mb-0">🎫 Cantidad de entradas: ${entrada.tickets.length}</p>
        <button class="btn btn-dark mt-3 btn-ver-qr mx-auto d-block w-50">Ver QR</button>
      `;

      contenedor.appendChild(div);

      const btnVerQr = div.querySelector(".btn-ver-qr");

      btnVerQr.addEventListener("click", async () => {
        const tempDiv = document.createElement("div");
        tempDiv.style.textAlign = "left"; // Info alineada a la izquierda

        // Info del evento
        const info = document.createElement("div");
        info.innerHTML = `
          <h5>🎟 ${entrada.nombre || "Evento sin nombre"}</h5>
          <p><strong>Fecha:</strong> ${
            formatearFecha(entrada.fecha) || "Sin fecha"
          }</p>
          <p><strong>Lugar:</strong> ${entrada.lugar || "Lugar a definir"}</p>
          <p><strong>Precio:</strong> ${
            entrada.precio === 0 || entrada.precio == null
              ? "Entrada gratuita"
              : `$${entrada.precio}`
          }</p>
          <p><strong>Cantidad de entradas:</strong> ${
            entrada.tickets.length
          }</p>
          <hr>
        `;
        tempDiv.appendChild(info);

        // Contenedor de QR (centrados)
        const qrSection = document.createElement("div");
        qrSection.style.display = "flex";
        qrSection.style.flexDirection = "column";
        qrSection.style.alignItems = "center"; // Solo QR centrados
        qrSection.style.gap = "20px";

        for (let i = 0; i < entrada.tickets.length; i++) {
          const ticketId = entrada.tickets[i];
          const ticketDiv = document.createElement("div");
          ticketDiv.style.textAlign = "center";

          // Separador grande, excepto para el primer QR
          if (i > 0) {
            const separator = document.createElement("hr");
            separator.style.width = "80%";
            separator.style.border = "2px solid #333";
            separator.style.margin = "15px auto";
            ticketDiv.appendChild(separator);
          }

          // Título del QR
          const qrTitle = document.createElement("p");
          qrTitle.textContent = `Entrada ${i + 1}`;
          qrTitle.style.fontWeight = "bold";
          qrTitle.style.marginBottom = "12px";
          qrTitle.style.fontSize = "2rem";

          // Contenedor del QR (20% más grande)
          const qrContainer = document.createElement("div");
          qrContainer.id = `qrcode_${ticketId}`;
          qrContainer.style.transformOrigin = "top center";
          qrContainer.style.marginBottom = "0 auto 20px auto";

          const downloadLink = document.createElement("a");
          downloadLink.textContent = `Descargar QR`;
          downloadLink.className = "btn btn-dark btn-sm";
          downloadLink.style.display = "none";
          downloadLink.style.margin = "12px 0 4px 0";

          ticketDiv.appendChild(qrTitle);
          ticketDiv.appendChild(qrContainer);
          ticketDiv.appendChild(downloadLink);
          qrSection.appendChild(ticketDiv);

          // Importar y generar QR
          const { generarQr } = await import("/js/generarQr.js");
          generarQr({
            ticketId,
            nombreEvento: entrada.nombre,
            usuario: auth.currentUser.displayName || "Usuario",
            fecha: entrada.fecha,
            lugar: entrada.lugar,
            precio: entrada.precio ?? 0,
            qrContainer,
            downloadLink,
            individual: true,
          });
        }

        tempDiv.appendChild(qrSection);

        Swal.fire({
          title: "Tus entradas 🎫",
          html: tempDiv,
          showConfirmButton: true,
          confirmButtonText: "Cerrar",
          width: 500,
        });
      });
    });
  } catch (err) {
    console.error("❌ Error en cargarEntradas():", err);
    contenedor.innerHTML = `<p class="text-danger text-center mt-3">Error al cargar entradas.</p>`;
  }
}
