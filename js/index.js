import { cargarEventos } from "/js/cargarEventos.js";
import { cargarEntradas } from "/js/entradas.js";
import { renderizarCatalogo } from "./cargarCatalogo.js";
import { actualizarContadorMisEntradas } from "./entradas.js";

const listaEventos = document.getElementById("listaEventos");
const listaEntradas = document.getElementById("listaEntradas");
const userId = localStorage.getItem("userId");

// Carga inicial
cargarEventos(listaEventos);
cargarEntradas(listaEntradas, userId);
actualizarContadorMisEntradas(userId);

document.addEventListener("DOMContentLoaded", () => {
  // ------------ CATALOGO ---------------
  const btnCatalogoCompleto = document.getElementById("btnCatalogoCompleto");
  const btnCategorias = document.querySelectorAll(".btn-categoria");
  const catalogoContainer = document.getElementById("catalogoContainer");

  btnCategorias.forEach((btn) =>
    btn.addEventListener("click", () => {
      catalogoContainer?.classList.remove("d-none");
    })
  );

  if (btnCatalogoCompleto) {
    btnCatalogoCompleto.addEventListener("click", () => {
      catalogoContainer.classList.toggle("collapse");
      if (!catalogoContainer.classList.contains("collapse")) {
        //initAdminProductos();
        renderizarCatalogo();
      }
    });
  }

  // ------------ EVENTOS & ENTRADAS ---------------

  const btnProximosEventos = document.getElementById("btnProximosEventos");
  const btnMisEntradas = document.getElementById("btnMisEntradas");

  const containerEventos = document.getElementById("containerEventos");
  const containerEntradas = document.getElementById("containerEntradas");

  // Instancias Bootstrap
  const bsEventos = bootstrap.Collapse.getOrCreateInstance(containerEventos, {
    toggle: false,
  });
  const bsEntradas = bootstrap.Collapse.getOrCreateInstance(containerEntradas, {
    toggle: false,
  });

  // Abrir eventos → cerrar entradas
  btnProximosEventos?.addEventListener("click", () => {
    bsEntradas.hide();
    bsEventos.toggle();
  });

  // Abrir entradas → cerrar eventos
  btnMisEntradas?.addEventListener("click", () => {
    bsEventos.hide();
    bsEntradas.toggle();
  });

  // Cargar datos al abrir
  containerEventos.addEventListener("shown.bs.collapse", () => {
    cargarEventos(listaEventos);
  });

  containerEntradas.addEventListener("shown.bs.collapse", () => {
    cargarEntradas(listaEntradas, userId);
  });
});
