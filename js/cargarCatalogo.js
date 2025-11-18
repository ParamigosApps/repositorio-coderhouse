// cargarCatalogo.js
/*
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
*/

// /js/cargarCatalogo.js
import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

const contenedorCatalogo = document.getElementById("contenedorCatalogo");

export function iniciarCatalogo() {
  const q = collection(db, "productos");

  onSnapshot(q, (snapshot) => {
    contenedorCatalogo.innerHTML = "";

    if (snapshot.empty) {
      contenedorCatalogo.innerHTML = `<p class="text-center text-secondary mt-3">No hay productos cargados.</p>`;
      return;
    }

    snapshot.forEach((docu) => {
      const producto = { id: docu.id, ...docu.data() };
      const card = crearCardProducto(producto);
      contenedorCatalogo.appendChild(card);
    });
  });
}

function crearCardProducto(producto) {
  const urlImagen = producto.imagenURL || "../Assets/img/placeholder.png"; // fallback

  const card = document.createElement("div");
  card.className = "card shadow-sm rounded-4 p-2 mb-3";

  card.innerHTML = `
    <img src="${urlImagen}" class="card-img-top rounded-3" style="height:150px;object-fit:cover">
    <div class="card-body p-2">
      <h6 class="fw-bold mb-1">${producto.nombre}</h6>
      <p class="small text-secondary mb-1">Categoría: ${producto.categoria}</p>
      <p class="fw-semibold mb-1">$${producto.precio}</p>
      <p class="small">Stock: ${producto.stock}</p>
    </div>

    <div class="d-flex gap-2 p-2">
      <button class="btn btn-sm btn-dark w-50" data-id="${producto.id}" data-action="editar">Editar</button>
      <button class="btn btn-sm btn-outline-danger w-50" data-id="${producto.id}" data-action="eliminar">Eliminar</button>
    </div>
  `;

  card.addEventListener("click", (e) => {
    const accion = e.target.dataset.action;
    const id = e.target.dataset.id;

    if (accion === "eliminar") eliminarProducto(id);
    if (accion === "editar") editarProducto(producto);
  });

  return card;
}

async function eliminarProducto(id) {
  const confirm = await Swal.fire({
    title: "Eliminar producto",
    text: "¿Seguro que deseas eliminar este producto?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
  });

  if (confirm.isConfirmed) {
    await deleteDoc(doc(db, "productos", id));
    Swal.fire("Eliminado", "Producto eliminado con éxito", "success");
  }
}

function editarProducto(producto) {
  Swal.fire({
    title: "Editar producto",
    html: `
      <input id="editNombre" class="swal2-input" value="${producto.nombre}">
      <input id="editPrecio" class="swal2-input" type="number" value="${producto.precio}">
      <input id="editStock" class="swal2-input" type="number" value="${producto.stock}">
    `,
    confirmButtonText: "Guardar cambios",
    showCancelButton: true,
  }).then((res) => {
    if (res.isConfirmed) {
      updateDoc(doc(db, "productos", producto.id), {
        nombre: document.getElementById("editNombre").value,
        precio: Number(document.getElementById("editPrecio").value),
        stock: Number(document.getElementById("editStock").value),
      });
    }
  });
}

// Iniciar automáticamente
document.addEventListener("DOMContentLoaded", iniciarCatalogo);
