// js/cargarEventos.js
import { db } from "./firebase.js";
import {
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { pedirEntrada } from "/js/entradas.js";

document.addEventListener("DOMContentLoaded", () => {
  const btnEventos = document.getElementById("btnProximosEventos");
  const containerEventos = document.getElementById("containerEventos");

  btnEventos?.addEventListener("click", async () => {
    if (
      containerEventos.style.display === "none" ||
      !containerEventos.style.display
    ) {
      containerEventos.style.display = "block"; // mostrar
    } else {
      containerEventos.style.display = "none"; // ocultar
    }
    await cargarEventos();
  });
});

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
        <h6 class="mb-1">${e.nombre}</h6>
        <p class="mb-0">📅 ${e.fecha || "Sin fecha"}</p>
        <p class="mb-0">📍 ${e.lugar || "Sin lugar"}</p>
        <p class="mb-0">💲 ${
          e.precio != null ? e.precio : "Entrada gratuita"
        }</p>
        <p class="mb-0">📋 ${e.descripcion || "Sin descripción"}</p>
        <button class="btn btn-dark w-100 mt-2 btn-pedir-entrada" data-id="${id}" data-nombre="${
        e.nombre
      }">
          Conseguir entrada
        </button>
      `;
      contenedor.appendChild(div);

      // Botón para pedir entrada y generar QR
      const boton = div.querySelector(".btn-pedir-entrada");
      boton.addEventListener("click", () => {
        pedirEntrada(id, e.nombre);
      });
    });
  } catch (err) {
    console.error("Error al cargar eventos:", err);
    contenedor.innerHTML = `<p class="text-danger text-center mt-3">Error al cargar eventos.</p>`;
  }
}
