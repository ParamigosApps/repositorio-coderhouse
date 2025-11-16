// js/admin.js
import { db } from "./firebase.js";
import { formatearFecha } from "./utils.js";
import {
  addDoc,
  getDocs,
  deleteDoc,
  collection,
  doc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

// Si querés activar modo admin manualmente en localStorage:
// localStorage.setItem('esAdmin', 'true')
const esAdmin = localStorage.getItem("esAdmin") === "true";

// -----------------------------
// DOM Ready
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  const btnCrearEvento = document.getElementById("btnCrearEvento");
  const formCrearEvento = document.getElementById("form-crear-evento");
  const btnGuardarEvento = document.getElementById("btnGuardarEvento");
  const btnMostrarEventos = document.getElementById("btnMostrarEventos");
  const eventosVigentes = document.getElementById("eventosVigentes");
  const entradasPorUsuario = document.getElementById(
    "entradasPorUsuarioEvento"
  );
  const mensajeError = document.getElementById("mensajeError");
  if (!btnCrearEvento || !formCrearEvento || !btnGuardarEvento) {
    console.error("Faltan elementos clave del DOM.");
    return;
  }

  btnCrearEvento.addEventListener("click", () => {
    formCrearEvento.style.display =
      formCrearEvento.style.display === "none" ? "block" : "none";
  });

  // Mostrar u ocultar lista de eventos
  btnMostrarEventos.addEventListener("click", () => {
    eventosVigentes.style.display =
      eventosVigentes.style.display === "none" ? "block" : "none";
  });

  // Guardar evento
  btnGuardarEvento.addEventListener("click", async () => {
    const nombre = document.getElementById("nombreEvento").value.trim();
    const fecha = document.getElementById("fechaEvento").value;
    const lugar = document.getElementById("lugarEvento").value.trim();
    const precio = document.getElementById("precioEvento").value.trim();
    const descripcion = document
      .getElementById("descripcionEvento")
      .value.trim();
    const entradasPorUsuarioInput = document.getElementById(
      "entradasPorUsuarioEvento"
    );
    const entradasPorUsuario =
      parseInt(entradasPorUsuarioInput.value.trim()) || 4;

    // 🔍 Validación
    mensajeError.style.display = "none";

    if (!nombre || !fecha || !lugar || !descripcion) {
      mensajeError.textContent =
        "⚠️ Por favor completá todos los campos obligatorios.";
      mensajeError.style.display = "block";
      return;
    }

    if (descripcion.length > 180) {
      mensajeError.textContent =
        "⚠️ La descripción no puede superar los 120 caracteres.";
      mensajeError.style.display = "block";
      return;
    }

    if (
      isNaN(entradasPorUsuario) ||
      entradasPorUsuario < 1 ||
      entradasPorUsuario > 8
    ) {
      mensajeError.textContent =
        "⚠️ La cantidad de entradas debe ser entre 1 y 8.";
      mensajeError.style.display = "block";
      return;
    }

    // ✅ Si pasa la validación, guardar en Firestore
    try {
      await addDoc(collection(db, "eventos"), {
        nombre,
        fecha,
        lugar,
        precio: precio || "Entrada gratuita",
        descripcion,
        entradasPorUsuario,
        creadoEn: new Date().toISOString(),
      });

      Swal.fire(
        "✅ Evento creado",
        `El evento "${nombre}" fue creado de manera exitosa.`,
        "success"
      );

      formCrearEvento.reset();
      await cargarEventos();
    } catch (error) {
      console.error("Error al guardar evento:", error);
      Swal.fire("Error", "No se pudo guardar el evento.", "error");
    }
  });

  cargarEventos();
});

// -----------------------------
// Función: cargarEventos
// -----------------------------
async function cargarEventos() {
  const listaEventos = document.getElementById("listaEventos");
  if (!listaEventos) return;

  listaEventos.innerHTML = `<p class="text-center text-secondary mt-3">Cargando eventos...</p>`;

  try {
    const querySnapshot = await getDocs(collection(db, "eventos"));

    if (querySnapshot.empty) {
      listaEventos.innerHTML = `<p class="text-center text-secondary">No hay eventos guardados.</p>`;
      return;
    }

    listaEventos.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      const card = document.createElement("div");
      card.className = "card mb-2 p-3 shadow-sm";
      card.style.maxWidth = "540px";

      const eliminarBtnHtml = esAdmin
        ? `<button class="btn btn-sm btn-danger eliminar-evento" data-id="${id}">🗑️</button>`
        : "";

      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">${escapeHtml(data.nombre)}</h5>
            <small class="text-muted">${formatearFecha(
              data.fecha
            )} • ${escapeHtml(data.lugar || "Sin Lugar")}</small>
          </div>
          ${eliminarBtnHtml}
        </div>
        <p class="mt-2 mb-0">${escapeHtml(
          data.descripcion || "Sin descripción"
        )}</p>
        <button class="btn btn-dark w-100 btn-pedir-entrada mt-2" data-id="${id}" data-nombre="${escapeHtml(
        data.nombre
      )}">Conseguir entrada</button>
      `;
      console.log("Fecha recibida de Firestore:", data.fecha);
      listaEventos.appendChild(card);

      // Listener para generar QR
      card
        .querySelector(".btn-pedir-entrada")
        .addEventListener("click", (e) => {
          const btn = e.currentTarget;
          const eventoId = btn.dataset.id;
          const eventoNombre = btn.dataset.nombre;
          console.log("Voy a pedir entrada:", eventoId, eventoParam);
          pedirEntrada(eventoId, eventoNombre);
        });
    });

    // Botones eliminar (solo admin)
    if (esAdmin) {
      listaEventos.querySelectorAll(".eliminar-evento").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const confirm = await Swal.fire({
            title: "¿Eliminar evento?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
          });

          if (confirm.isConfirmed) {
            await deleteDoc(doc(db, "eventos", id));
            Swal.fire("Eliminado", "El evento fue borrado.", "success");
            await cargarEventos();
          }
        });
      });
    }
  } catch (error) {
    console.error("Error al cargar eventos:", error);
    listaEventos.innerHTML = `<p class="text-danger text-center mt-3">Error al cargar eventos.</p>`;
  }
}

// -----------------------------
// Protección básica XSS
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

//------------------------------ QR para eventos ------------------------------

// Función para pedir una entrada (llamar desde el botón 'Pedir entrada')
async function pedirEntrada(eventoId, eventoNombre) {
  try {
    // Crear documento de ticket en Firestore
    const docRef = await addDoc(collection(db, "eventos"), {
      eventoId: eventoId,
      eventoNombre: eventoNombre || null,
      creado: new Date().toISOString(),
      usado: false,
    });

    const ticketId = docRef.id;
    const validationUrl = `${window.location.origin}/validar?ticket=${ticketId}`;

    // Mostrar modal con QR
    showQrModal(validationUrl, ticketId, eventoNombre);
  } catch (err) {
    console.error("Error al crear entrada:", err);
    Swal.fire(
      "Error",
      "No se pudo generar la entrada. Intentá nuevamente.",
      "error"
    );
  }
}

// Genera el QR y abre modal
function showQrModal(qrData, ticketId, eventoNombre) {
  const qrcodeContainer = document.getElementById("qrcode");
  qrcodeContainer.innerHTML = "";

  const qrcode = new QRCode(qrcodeContainer, {
    text: qrData,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });

  const infoEl = document.getElementById("ticketInfo");
  infoEl.textContent = `Ticket: ${ticketId}${
    eventoNombre ? " · " + eventoNombre : ""
  }`;

  const downloadLink = document.getElementById("downloadQr");
  setTimeout(() => {
    const img = qrcodeContainer.querySelector("img");
    const canvas = qrcodeContainer.querySelector("canvas");
    let dataUrl = null;
    if (img) {
      dataUrl = img.src;
    } else if (canvas) {
      dataUrl = canvas.toDataURL("image/png");
    }
    if (dataUrl) {
      downloadLink.href = dataUrl;
      downloadLink.style.display = "inline-block";
    } else {
      downloadLink.style.display = "none";
    }
  }, 200);

  const qrModalEl = document.getElementById("qrModal");
  const modal = new bootstrap.Modal(qrModalEl);
  modal.show();
}

//------------------------------ Fin QR para eventos ------------------------------
