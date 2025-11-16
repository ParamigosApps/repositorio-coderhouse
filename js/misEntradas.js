// /js/misEntradas.js
import { db } from "/js/firebase.js";
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

  contenedor.innerHTML = `<p class="text-center text-secondary mt-3">Cargando entradas...</p>`;

  try {
    const usuarioId = localStorage.getItem("usuarioId") || "Invitado";
    console.log("👤 usuarioId:", usuarioId);

    const q = query(
      collection(db, "entradas"),
      where("usuarioId", "==", usuarioId)
    );
    const snapshot = await getDocs(q);

    console.log("📦 Entradas encontradas:", snapshot.size);

    snapshot.forEach((docSnap) =>
      console.log("🧾 Entrada:", docSnap.id, docSnap.data())
    );

    contenedor.innerHTML = "";

    if (snapshot.empty) {
      return (contenedor.innerHTML = `<p class="text-center text-secondary">Todavía no generaste entradas.</p>`);
    }

    snapshot.forEach((docSnap) => {
      const entrada = docSnap.data();
      const ticketId = docSnap.id;

      const div = document.createElement("div");
      div.className = "card mb-2 p-3 shadow-sm";

      div.innerHTML = `
        <h5 class="mb-1">${entrada.nombreEvento}</h5>
        <p class="mb-0">📅 ${formatearFecha(entrada.fecha) || "Sin fecha"}</p>
        <p class="mb-0">📍 ${entrada.lugar}</p>
        <p class="mb-0">💲 ${entrada.precio}</p><br>
        <button class="btn btn-dark w-75 d-block mx-auto btn-ver-qr"
          data-id="${ticketId}">
          Ver QR
        </button>
      `;

      contenedor.appendChild(div);

      div.querySelector(".btn-ver-qr").addEventListener("click", () => {
        console.log("📲 Ver QR:", ticketId);

        import("/js/entradas.js").then((m) => {
          m.generarQr(ticketId, entrada);
        });
      });
    });
  } catch (err) {
    console.error("❌ Error en cargarEntradas():", err);
    contenedor.innerHTML = `<p class="text-danger text-center mt-3">Error al cargar entradas.</p>`;
  }
}
