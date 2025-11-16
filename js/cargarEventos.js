// cargarEventos.js
import { db } from "/js/firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

export async function cargarEventos() {
  console.log("📥 Iniciando carga de eventos...");

  const listaEventos = document.getElementById("listaEventos");
  if (!listaEventos) {
    console.error("❌ listaEventos no encontrado en el DOM");
    return;
  }

  listaEventos.innerHTML = `<p class="text-center text-secondary mt-3">Cargando eventos...</p>`;

  try {
    console.log("🔎 Consultando Firestore: colección 'eventos'");
    const snapshot = await getDocs(collection(db, "eventos"));

    listaEventos.innerHTML = "";

    if (snapshot.empty) {
      console.warn("⚠ No hay eventos cargados en Firestore.");
      listaEventos.innerHTML = `<p class="text-center text-secondary mt-3">No hay eventos disponibles.</p>`;
      return;
    }

    console.log(`📦 Eventos encontrados: ${snapshot.size}`);

    snapshot.forEach((docSnap) => {
      const e = docSnap.data();
      const id = docSnap.id;

      console.log(`📍 Procesando evento ID: ${id}`, e);

      const div = document.createElement("div");
      div.className = "card mb-3 shadow-sm p-3";

      div.innerHTML = `
        <h4 class="fw-bold">${e.nombre || "Sin nombre"}</h4>
        <p class="mb-0">📅 <strong>${
          e.fecha || "Fecha a confirmar"
        }</strong></p>
        <p class="mb-0">📍 ${e.lugar || "Sin lugar"}</p>
        <p class="mb-0">🎟 Máx por usuario: ${e.entradasPorUsuario ?? "-"}</p>
        <p class="mb-0">💲 ${e.precio || "Gratis"}</p>
        <p class="mt-2">${e.descripcion || ""}</p>

        ${
          e.imagen
            ? `<img src="${e.imagen}" class="img-fluid rounded mt-2" style="max-height:180px;object-fit:cover;">`
            : ""
        }

        <button class="btn btn-dark w-100 mt-3 btnComprar" data-eventoid="${id}">
          Conseguir entrada
        </button>
      `;

      listaEventos.appendChild(div);

      // CLICK DEL BOTÓN COMPRAR
      div.querySelector(".btnComprar").addEventListener("click", () => {
        console.log(`🛒 Botón comprar presionado — Evento ID: ${id}`);
        console.log("📦 Datos del evento usado en pedirEntrada:", e);

        import("/js/entradas.js")
          .then((module) => {
            console.log("📥 Archivo entradas.js importado:", module);

            if (typeof module.pedirEntrada === "function") {
              console.log("🚀 Ejecutando pedirEntrada()");
              module.pedirEntrada(id, e);
            } else {
              console.error(
                "❌ ERROR: pedirEntrada no está exportada correctamente en entradas.js"
              );
            }
          })
          .catch((err) => {
            console.error("❌ Error importando entradas.js:", err);
          });
      });
    });
  } catch (error) {
    console.error("❌ Error al cargar eventos:", error);
    listaEventos.innerHTML = `<p class="text-danger text-center mt-3">Error al cargar eventos.</p>`;
  }
}
