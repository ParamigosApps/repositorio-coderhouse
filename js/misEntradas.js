import { generarQr } from "./generarQr.js";
import { mostrarMensaje } from "/js/utils.js";
import { db } from "/js/firebase.js";
import {
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const btnMisEntradas = document.getElementById("btnMisEntradas");
const containerEntradas = document.getElementById("containerEntradas");
const listaEntradas = document.getElementById("listaEntradas");
const qrModal = new bootstrap.Modal(document.getElementById("qrModal"));

btnMisEntradas?.addEventListener("click", async () => {
  containerEntradas.style.display = "block";
  listaEntradas.innerHTML = `<p class="text-center text-muted">Cargando tus entradas...</p>`;

  try {
    const snapshot = await getDocs(collection(db, "entradas"));
    listaEntradas.innerHTML = "";

    if (snapshot.empty) {
      listaEntradas.innerHTML = `<p class="text-center text-muted">Aún no tenés entradas registradas.</p>`;
      return;
    }

    snapshot.forEach((doc) => {
      const entrada = doc.data();

      const card = document.createElement("div");
      card.classList.add("card", "shadow-sm", "mb-3", "p-3", "border-0");

      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="fw-bold mb-1">${entrada.evento}</h5>
            <p class="text-muted mb-1">${entrada.fecha}</p>
            <p class="text-muted mb-2"><i class="bi bi-geo-alt"></i> ${
              entrada.lugar
            }</p>
            ${entrada.precio ? `<p class="mb-1">💲 $${entrada.precio}</p>` : ""}
            ${
              entrada.descripcion ? `<small>${entrada.descripcion}</small>` : ""
            }
            <br>
            <small class="text-secondary">Código: ${entrada.codigo}</small>
          </div>
          <button class="btn btn-outline-dark btn-sm ver-qr">Ver QR</button>
        </div>
      `;

      card.querySelector(".ver-qr").addEventListener("click", () => {
        generarQr(
          entrada.codigo,
          entrada.evento,
          entrada.usuario || "Invitado",
          entrada.fecha,
          entrada.lugar
        );
      });

      listaEntradas.appendChild(card);
    });
  } catch (err) {
    console.error("Error cargando entradas:", err);
    mostrarMensaje("Error al cargar las entradas", "error");
  }
});
