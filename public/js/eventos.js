// eventos.js
import { escapeHtml } from "./utils.js";
import { pedirEntrada } from "/entradas.js";
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

      const div = document.createElement("div");
      div.className = "card mb-2 p-3 shadow-sm";
      div.innerHTML = `
        <h6 class="mb-1">${escapeHtml(e.nombre) || "Evento sin nombre"}</h6>
        <p class="mb-0">📅 ${
          escapeHtml(formatearFecha(e.fecha)) || "Sin fecha"
        }</p>
        <p class="mb-0">📍 ${escapeHtml(e.lugar) || "Sin lugar"}</p>
        <p class="mb-0">💲caca ${
          e.precio === 0 || e.precio == null
            ? "Entrada gratuita"
            : `$ ${e.precio}`
        }</p>
        <p class="mb-0">📋 ${escapeHtml(e.descripcion) || "Sin descripción"}</p>
        <button class="btn btn-dark w-100 mt-2 btn-pedir-entrada" data-id="${id}">Conseguir entrada</button>
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
