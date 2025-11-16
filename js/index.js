//index.js
import { cargarEventos } from "/js/cargarEventos.js";
import { cargarEntradas } from "/js/misEntradas.js";

const listaEventos = document.getElementById("listaEventos");
const listaEntradas = document.getElementById("listaEntradas");
const userId = localStorage.getItem("userId");

// Cargar secciones
cargarEventos(listaEventos);
cargarEntradas(listaEntradas, userId);

document.addEventListener("DOMContentLoaded", () => {
  // Botones y contenedores
  const btnProximosEventos = document.getElementById("btnProximosEventos");
  const btnMisEntradas = document.getElementById("btnMisEntradas");
  const btnCatalogoCompleto = document.getElementById("btnCatalogoCompleto");
  const btnCategorias = document.querySelectorAll(".btn-categoria");

  const containerEventos = document.getElementById("containerEventos");
  const containerEntradas = document.getElementById("containerEntradas");
  const catalogoContainer = document.getElementById("catalogoContainer");

  // -----------------------------
  // Mostrar catálogo al tocar categoría
  // -----------------------------
  btnCategorias.forEach((btn) =>
    btn.addEventListener("click", () => {
      if (catalogoContainer) catalogoContainer.classList.remove("d-none");
    })
  );

  // -----------------------------
  // Toggle catálogo completo
  // -----------------------------
  if (btnCatalogoCompleto) {
    btnCatalogoCompleto.addEventListener("click", () => {
      if (!catalogoContainer) return;
      catalogoContainer.classList.toggle("d-none");
      if (!catalogoContainer.classList.contains("d-none")) {
        renderizarCatalogo();
      }
    });
  }

  // -----------------------------
  // Toggle "Mis Entradas"
  // -----------------------------
  if (btnMisEntradas && containerEntradas) {
    btnMisEntradas.addEventListener("click", () => {
      containerEntradas.classList.toggle("d-none");
      //CARGAR ENTRADAS
      cargarEntradas();
    });
  }

  // -----------------------------
  // Toggle "Próximos Eventos"
  // -----------------------------
  if (btnProximosEventos && containerEventos) {
    btnProximosEventos.addEventListener("click", () => {
      containerEventos.classList.toggle("d-none");
      cargarEventos();
    });
  }

  // -----------------------------
  // Carga inicial de eventos
  // -----------------------------
  cargarEventos();
});
