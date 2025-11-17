import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { formatearFecha } from "./utils.js";

const btnEntradasVendidas = document.getElementById("btnEntradasVendidas");
const contenedorEntradasVendidas = document.getElementById(
  "containerEntradasVendidas"
);
const contenedorEntradasPendientes = document.getElementById(
  "contenedorEntradasPendientes"
);
const eventosVigentes = document.getElementById("eventosVigentes");
const formCrearEvento = document.getElementById("form-crear-evento");
let entradasCargadas = false;
let detallesContainers = []; // Array para manejar todos los detalles

// Toggle global contenedor completo
btnEntradasVendidas.addEventListener("click", () => {
  if (!contenedorEntradasVendidas) return;
  contenedorEntradasVendidas.style.display =
    contenedorEntradasVendidas.style.display === "none" ? "block" : "none";
  contenedorEntradasPendientes.style.display = "none";
  formCrearEvento.style.display = "none";
  eventosVigentes.style.display = "none";
});

// Función principal
export async function mostrarEntradasVendidas() {
  if (!contenedorEntradasVendidas) return;

  try {
    // 🔹 Mostrar mensaje de carga
    contenedorEntradasVendidas.innerHTML = `<p class="text-center text-secondary mt-2">Cargando entradas vendidas...</p>`;

    const entradasRef = collection(db, "entradas");
    const q = query(entradasRef, orderBy("fecha"), orderBy("nombre"));
    const snapshot = await getDocs(q);

    const entradas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (!entradasCargadas) {
      const totalVendidas = entradas
        .filter((e) => e.pagado)
        .reduce((acc, e) => acc + e.cantidad, 0);

      contenedorEntradasVendidas.innerHTML = "";

      const totalHtml = document.createElement("p");
      totalHtml.className = "fw-bold fs-5 mb-3";
      totalHtml.textContent = `🎟️ Total de entradas vendidas: ${totalVendidas}`;
      contenedorEntradasVendidas.appendChild(totalHtml);

      const entradasPorEvento = {};
      entradas.forEach((e) => {
        const key = `${e.nombre}__${e.fecha}`;
        if (!entradasPorEvento[key]) entradasPorEvento[key] = [];
        entradasPorEvento[key].push(e);
      });

      detallesContainers = [];

      for (const key of Object.keys(entradasPorEvento)) {
        const [nombreEvento, fechaRaw] = key.split("__");
        const entradasEvento = entradasPorEvento[key];
        const fecha = formatearFecha(fechaRaw);

        const totalEvento = entradasEvento.reduce(
          (acc, e) => acc + e.cantidad,
          0
        );

        const eventoContainer = document.createElement("div");
        eventoContainer.className = "mb-2 border rounded shadow-sm";

        const botonEvento = document.createElement("button");
        botonEvento.textContent = `${nombreEvento} - ${fecha} (${totalEvento} entradas)`;
        botonEvento.className =
          "btn btn-outline-dark w-100 text-center py-2 fw-semibold";
        botonEvento.style.cursor = "pointer";
        botonEvento.style.fontSize = "0.9rem";

        const detalleContainer = document.createElement("div");
        detalleContainer.style.display = "none";
        detalleContainer.style.padding = "10px";
        detalleContainer.className = "d-flex flex-column gap-2";

        detallesContainers.push(detalleContainer);

        const entradasPorUsuario = {};
        for (const e of entradasEvento) {
          let nombreUsuario = e.usuarioNombre || e.usuarioId;
          if (!e.usuarioNombre) {
            try {
              const usuarioRef = doc(db, "users", e.usuarioId);
              const usuarioSnap = await getDoc(usuarioRef);
              if (usuarioSnap.exists()) {
                nombreUsuario = usuarioSnap.data().displayName || e.usuarioId;
              }
            } catch (err) {
              console.warn("No se pudo obtener el nombre del usuario:", err);
            }
          }
          if (!entradasPorUsuario[nombreUsuario])
            entradasPorUsuario[nombreUsuario] = 0;
          entradasPorUsuario[nombreUsuario] += e.cantidad;
        }

        for (const [nombreUsuario, cantidad] of Object.entries(
          entradasPorUsuario
        )) {
          const entradaDiv = document.createElement("div");
          entradaDiv.textContent = `${nombreUsuario} - ${cantidad} ${
            cantidad > 1 ? "entradas" : "entrada"
          }`;
          entradaDiv.style.padding = "6px 10px";
          entradaDiv.style.borderRadius = "6px";
          entradaDiv.style.backgroundColor = "#d4edda";
          entradaDiv.style.fontSize = "0.9rem";
          detalleContainer.appendChild(entradaDiv);
        }

        // Toggle individual
        botonEvento.addEventListener("click", () => {
          detalleContainer.style.display =
            detalleContainer.style.display === "none" ? "flex" : "none";
        });

        eventoContainer.appendChild(botonEvento);
        eventoContainer.appendChild(detalleContainer);
        contenedorEntradasVendidas.appendChild(eventoContainer);
      }

      entradasCargadas = true;
    }

    // Toggle global al clickear "Ver entradas vendidas"
    const anyVisible = detallesContainers.some(
      (d) => d.style.display === "flex"
    );
    detallesContainers.forEach((d) => {
      d.style.display = anyVisible ? "none" : "flex";
    });
  } catch (err) {
    console.error("❌ Error al obtener entradas:", err);
    contenedorEntradasVendidas.innerHTML = `<p class="text-danger">Error al cargar las entradas.</p>`;
  }
}

if (btnEntradasVendidas) {
  btnEntradasVendidas.addEventListener("click", mostrarEntradasVendidas);
}
