// cargarCatalogo.js
import { Producto } from "./productos.js";
import { vincularClickProducto } from "./utils.js";

const catalogoContainer = document.getElementById("catalogoContainer");
const btnMostrarTodo =
  document.getElementById("btnCatalogoCompleto") ||
  document.getElementById("btnVerTodoCatalogo");
const botonesCategoria = document.querySelectorAll(".btn-categoria");

let productos = [];

// Iconos por categoría
const iconosCategorias = {
  Tragos: "🥃",
  Botellas: "🍾",
  Combos: "🎉",
  Promos: "🏷️",
  Accesorios: "🧋",
};

export async function cargarCatalogoJSON() {
  try {
    const res = await fetch("/json/catalogo.json");
    const data = await res.json();

    productos = data.map(
      (p) =>
        new Producto(
          p.id,
          p.imgSrc,
          p.titulo,
          p.descripcion,
          p.precio,
          p.categoria,
          p.destacado
        )
    );

    // Por defecto no mostramos productos hasta que el usuario haga click en "Ver catálogo completo" o seleccione una categoría
    if (catalogoContainer)
      catalogoContainer.innerHTML = `<p class="text-center text-secondary">Seleccione "Ver catálogo completo" o una categoría para ver los productos.</p>`;
  } catch (error) {
    console.error("Error cargando el catálogo:", error);
    if (catalogoContainer)
      catalogoContainer.innerHTML =
        "<p class='text-center text-danger'>Error al cargar el catálogo.</p>";
  }
}

export function renderizarCatalogo(filtro = null) {
  if (!catalogoContainer) return;
  catalogoContainer.innerHTML = "";

  let listaFiltrada = productos;
  if (filtro) listaFiltrada = productos.filter((p) => p.categoria === filtro);

  if (listaFiltrada.length === 0) {
    catalogoContainer.innerHTML = `<p class="text-center text-secondary">No hay productos${
      filtro ? " en la categoría " + filtro : ""
    }.</p>`;
    return;
  }

  const categorias = {};
  listaFiltrada.forEach((p) => {
    if (!categorias[p.categoria]) categorias[p.categoria] = [];
    categorias[p.categoria].push(p);
  });

  Object.keys(categorias).forEach((cat) => {
    const section = document.createElement("section");
    section.className = "categoria-section";

    const icono = iconosCategorias[cat] || "";

    section.innerHTML = `
      <hr class="my-4" />
      <h5 class="fw-semibold mb-3">${icono} ${cat}</h5>
    `;

    const grid = document.createElement("div");
    grid.className = "productos-grid d-grid gap-3";

    categorias[cat].forEach((producto) => {
      const card = producto.render();
      grid.appendChild(card);
      vincularClickProducto(producto, card);
    });

    section.appendChild(grid);
    catalogoContainer.appendChild(section);
  });
}

// Eventos botones
btnMostrarTodo?.addEventListener("click", () => {
  renderizarCatalogo();
});

botonesCategoria.forEach((btn) => {
  btn.addEventListener("click", () => {
    const cat = btn.dataset.categoria;
    renderizarCatalogo(cat);
    if (catalogoContainer) catalogoContainer.style.display = "block";
  });
});

// iniciar carga
document.addEventListener("DOMContentLoaded", () => {
  cargarCatalogoJSON();
});
