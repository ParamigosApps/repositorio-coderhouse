// cargarEventos.js
import { escapeHtml, formatearFecha } from "./utils.js";
import { db, auth } from "/js/firebase.js";

import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

let cantidadEventosCargados = null;

export async function cargarEventos() {
  const listaEventos = document.getElementById("listaEventos");

  if (!listaEventos) {
    console.error("❌ listaEventos no encontrado en el DOM");
    return;
  }

  try {
    const snapshot = await getDocs(collection(db, "eventos"));

    // 🛑 VERIFICAR SI LA CANTIDAD DE EVENTOS YA ES LA MISMA
    if (cantidadEventosCargados === snapshot.size) {
      console.log("✔ No hubo cambios en los eventos. No se recarga.");
      return; // 🔥 No volvemos a renderizar
    }

    // Actualizar valor almacenado
    cantidadEventosCargados = snapshot.size;

    listaEventos.innerHTML = `
      <p class="text-center text-secondary mt-3">Cargando eventos...</p>
    `;

    if (snapshot.empty) {
      listaEventos.innerHTML = `
        <p class="text-center text-secondary mt-3">No hay eventos disponibles.</p>
      `;
      return;
    }

    // ACTUALIZAR CONTADOR
    let contadorEventosDisponibles = document.getElementById(
      "contadorEventosDisponibles"
    );
    contadorEventosDisponibles.textContent = snapshot.size;

    // LIMPIAR Y RENDERIZAR
    listaEventos.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const e = docSnap.data();
      const id = docSnap.id;

      const div = document.createElement("div");
      div.className = "event-card shadow-sm";

      const esGratis = !e.precio || e.precio < 1;
      const valorEntrada = esGratis ? "Entrada gratis" : `$${e.precio}`;

      div.innerHTML = `
  ${
    e.imagen
      ? `
      <div class="ev-img-wrap">
        <img src="${e.imagen}" class="ev-img" alt="Imagen del evento ${e.nombre}">
      </div>
    `
      : ""
  }

  <div class="ev-body">
    <h3 class="ev-title">${e.nombre || "Evento sin nombre"}</h3>

    <div class="ev-row">
      <span class="ev-icon">📅</span>
      <strong>${escapeHtml(formatearFecha(e.fecha))}</strong>
    </div>

    <div class="ev-row">
      <span class="ev-icon">📍</span>
      <span>${e.lugar || "Sin lugar"}</span>
    </div>

    <div class="ev-row">
      <span class="ev-icon">⏰</span>
      <span>${e.horario || "Sin horario definido"}</span>
    </div>

    ${
      !e.precio || e.precio < 1
        ? `<div class="ev-badge green">🟢 Entrada gratis</div>`
        : `<div class="ev-row"><span class="ev-icon">💲</span> $${e.precio}</div>`
    }

    <div class="ev-row">
      <span class="ev-icon">🎟</span>
      <span>Máx. por usuario: ${e.entradasPorUsuario ?? "-"}</span>
    </div>

    <p class="ev-desc">${e.descripcion || "Sin descripción"}</p>

    <button class="btn btn-dark w-100 ev-btn mt-3 btnComprar" data-eventoid="${id}">
      Conseguir entrada
    </button>
  </div>
`;

      listaEventos.appendChild(div);

      // CLICK COMPRAR
      div.querySelector(".btnComprar").addEventListener("click", () => {
        import("/js/entradas.js")
          .then((module) => {
            if (typeof module.pedirEntrada === "function") {
              module.pedirEntrada(id, e);
            } else {
              console.error(
                "❌ ERROR: pedirEntrada no está exportada correctamente en entradas.js"
              );
            }
          })
          .catch((err) =>
            console.error("❌ Error importando entradas.js:", err)
          );
      });
    });
  } catch (error) {
    console.error("❌ Error cargando eventos:", error);
    listaEventos.innerHTML = `<p class="text-danger text-center mt-3">Error al cargar eventos.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarEventos();
});
