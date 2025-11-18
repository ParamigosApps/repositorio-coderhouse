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
const EntradasVendidas = document.getElementById("containerEntradasVendidas");
const ContenedorEntradasPendientes =
  document.getElementById("EntradasPendientes");
const eventosVigentes = document.getElementById("eventosVigentes");
const formCrearEvento = document.getElementById("form-crear-evento");
let detallesContainers = [];

// Toggle global contenedor
btnEntradasVendidas.addEventListener("click", () => {
  if (!contenedorEntradasVendidas) return;
  contenedorEntradasVendidas.style.display =
    contenedorEntradasVendidas.style.display === "none" ? "block" : "none";

  ContenedorEntradasPendientes.style.display = "none";
  formCrearEvento.style.display = "none";
  eventosVigentes.style.display = "none";

  mostrarEntradasVendidas();
});

// Función principal
export async function mostrarEntradasVendidas() {
  if (!contenedorEntradasVendidas) return;

  try {
    contenedorEntradasVendidas.innerHTML = `<p class="text-center text-secondary mt-2">Cargando entradas vendidas...</p>`;

    // Entradas
    const entradasRef = collection(db, "entradas");
    const q = query(entradasRef, orderBy("fecha"), orderBy("nombre"));
    const snapshot = await getDocs(q);

    const entradas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Traer eventos
    const eventosSnap = await getDocs(collection(db, "eventos"));
    const eventosMap = {};
    eventosSnap.forEach((d) => (eventosMap[d.id] = { ...d.data(), id: d.id }));

    contenedorEntradasVendidas.innerHTML = "";

    const totalVendidas = entradas
      .filter((e) => e.pagado)
      .reduce((acc, e) => acc + e.cantidad, 0);

    // Total general
    const totalHtml = document.createElement("p");
    totalHtml.className = "fw-bold fs-5 mb-2 mt-3";
    totalHtml.textContent = `🎟️ Total de entradas vendidas: ${totalVendidas}`;
    contenedorEntradasVendidas.appendChild(totalHtml);

    // Agrupación por evento
    const entradasPorEvento = {};
    entradas.forEach((e) => {
      const key = `${e.eventoId}`;
      if (!entradasPorEvento[key]) entradasPorEvento[key] = [];
      entradasPorEvento[key].push(e);
    });

    detallesContainers = [];

    for (const eventoId of Object.keys(entradasPorEvento)) {
      const eventoData = eventosMap[eventoId] || {};
      const entradasEvento = entradasPorEvento[eventoId];
      const fecha = formatearFecha(eventoData.fecha);

      const totalEvento = entradasEvento.reduce(
        (acc, e) => acc + e.cantidad,
        0
      );

      // Contenedor del evento
      const eventoContainer = document.createElement("div");
      eventoContainer.className = "mb-2 border rounded shadow-sm p-2";

      const botonEvento = document.createElement("button");
      botonEvento.textContent = `${
        eventoData.nombre || "Sin nombre"
      } - ${fecha} (${totalEvento} entradas)`;
      botonEvento.className =
        "btn btn-outline-dark w-100 text-center py-2 fw-semibold";
      botonEvento.style.fontSize = "0.9rem";

      const detalleContainer = document.createElement("div");
      detalleContainer.style.display = "none";
      detalleContainer.style.padding = "12px";
      detalleContainer.className = "d-flex flex-column gap-2";

      detallesContainers.push(detalleContainer);

      // Info del evento
      const infoEvento = document.createElement("div");
      infoEvento.className = "p-2 rounded border bg-light";
      infoEvento.innerHTML = `
        <strong>Lugar:</strong> ${eventoData.lugar || "-"}<br>
        <strong>Horario:</strong> ${eventoData.horario || "-"}<br>
        <strong>Precio:</strong> ${
          eventoData.precio > 0 ? "$" + eventoData.precio : "Gratis"
        }<br>
        <strong>Descripción:</strong> ${eventoData.descripcion || "-"}
      `;
      detalleContainer.appendChild(infoEvento);

      // Entradas por usuario
      const entradasPorUsuario = {};

      for (const e of entradasEvento) {
        let nombreUsuario = e.usuarioNombre || e.usuarioId;

        if (!e.usuarioNombre && e.usuarioId) {
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

      // Mostrar datos por usuario
      for (const [nombreUsuario, cantidad] of Object.entries(
        entradasPorUsuario
      )) {
        const entradaDiv = document.createElement("div");
        entradaDiv.className = "p-2 rounded";
        entradaDiv.style.backgroundColor = "#d4edda";

        // ⚡ Si fue creada por admin, no mostrar QR ni enlace
        if (entradasEvento.find((x) => x.creadaPorAdmin)) {
          entradaDiv.textContent = `${nombreUsuario} — ${cantidad} ${
            cantidad > 1 ? "entradas" : "entrada"
          } (creada por admin)`;
        } else {
          entradaDiv.textContent = `${nombreUsuario} — ${cantidad} ${
            cantidad > 1 ? "entradas" : "entrada"
          }`;
        }

        detalleContainer.appendChild(entradaDiv);
      }

      // Botón toggle
      botonEvento.addEventListener("click", () => {
        detalleContainer.style.display =
          detalleContainer.style.display === "none" ? "flex" : "none";
      });

      eventoContainer.appendChild(botonEvento);
      eventoContainer.appendChild(detalleContainer);
      contenedorEntradasVendidas.appendChild(eventoContainer);
    }

    entradasCargadas = true;
  } catch (err) {
    console.error("❌ Error al obtener entradas:", err);
    contenedorEntradasVendidas.innerHTML = `<p class="text-danger">Error al cargar las entradas.</p>`;
  }
}
