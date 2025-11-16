// eventos.js
import { escapeHtml } from "./utils.js";
import { pedirEntrada } from "/js/entradas.js";
import { db } from "./firebase.js";
import { formatearFecha } from "./utils.js";
import {
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

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

      console.log("Evento Firestore:", id, e);

      const div = document.createElement("div");
      div.className = "card mb-3 p-3 shadow-sm";

      div.innerHTML = `
        ${
          e.flyer ? `<img src="${e.flyer}" class="img-fluid rounded mb-2">` : ""
        }
        
        <h5 class="fw-bold mb-1">${
          escapeHtml(e.nombre) || "Evento sin nombre"
        }</h5>

        <p class="mb-0">📅 ${
          escapeHtml(formatearFecha(e.fecha)) || "Sin fecha"
        } ${e.hora ? `- ${escapeHtml(e.hora)}` : ""}</p>

        <p class="mb-0">📍 ${escapeHtml(e.lugar) || "Lugar a definir"}</p>

        <p class="mb-0">💲 ${
          e.precio === 0 || e.precio == null
            ? "Entrada gratuita"
            : `$ ${e.precio}`
        }</p>

        ${
          e.descripcion
            ? `<p class="mb-0 text-secondary">${escapeHtml(e.descripcion)}</p>`
            : ""
        }

        <button class="btn btn-dark w-100 mt-2 btn-pedir-entrada" data-id="${id}">
          Conseguir entrada
        </button>
      `;

      contenedor.appendChild(div);

      // Acción del botón
      div.querySelector(".btn-pedir-entrada").addEventListener("click", () => {
        pedirEntrada(id, e);
      });
    });
  } catch (err) {
    console.error("Error al cargar eventos:", err);
    contenedor.innerHTML = `<p class="text-danger text-center mt-3">Error al cargar eventos.</p>`;
  }
}
