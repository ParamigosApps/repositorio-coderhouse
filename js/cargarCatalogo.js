// cargarCatalogo.js
/*
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import {
  agregarProductoCarrito,
  mostrarCarrito,
  actualizarCarritoVisual,
} from "./carrito.js";

const catalogoContainer = document.getElementById("catalogoContainer");
let productos = [];
let cartelEnCurso = false;

// ------------------------------ CLASE PRODUCTO ------------------------------ //
class Producto {
  constructor(
    id,
    imgSrc,
    nombre,
    descripcion,
    precio,
    categoria,
    destacado = false,
    stock
  ) {
    this.id = id;
    this.imgSrc = imgSrc;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.categoria = categoria;
    this.destacado = destacado;
    this.enCarrito = 1;

    const stockGuardado = JSON.parse(localStorage.getItem(`stock-${this.id}`));
    this.stock = stockGuardado ?? stock ?? 0;
    localStorage.setItem(`stock-${this.id}`, JSON.stringify(this.stock));
  }

  renderCard() {
    const div = document.createElement("div");
    div.className = "product-card";

    const sinStock = this.stock <= 0;
    div.innerHTML = `
      <div class="product-info">
        <h3 class="product-description-title">${this.nombre}</h3>
        <p class="product-description">${this.descripcion}</p>
        <h5 class="product-price">$${this.precio}</h5>
      </div>
      <div class="product-image">
        <img src="${this.imgSrc}" alt="${this.nombre}" />
      </div>
      <button class="btn-agregar">${sinStock ? "X" : "Agregar"}</button>
    `;

    if (sinStock) {
      div.style.backgroundColor = "#d3d3d3";
      div.style.pointerEvents = "none";
      div.style.opacity = "0.7";
    } else {
      const btnAgregar = div.querySelector(".btn-agregar");
      btnAgregar.addEventListener("click", (e) => {
        e.stopPropagation();
        agregarProductoCarrito(this);
      });
    }

    return div;
  }
}

// ------------------------------ CARGAR PRODUCTOS ------------------------------ //
export async function cargarCatalogo() {
  if (!catalogoContainer) return;
  catalogoContainer.innerHTML = "<p>Cargando productos...</p>";

  try {
    const snapshot = await getDocs(collection(db, "productos"));
    productos = snapshot.docs.map((doc) => {
      const data = doc.data();
      return new Producto(
        doc.id,
        data.imagen || "/img/default-product.png",
        data.nombre || "Sin título",
        data.descripcion || "Sin descripción",
        data.precio || 0,
        data.categoria || "Sin categoría",
        data.destacado || false,
        data.stock ?? 0
      );
    });

    catalogoContainer.classList.remove("d-none");
    renderizarCatalogo("Todos");

    // Mensaje de filtrado
    const mensaje = document.getElementById("mensajeFiltro");
    const botonesCategorias = document.querySelectorAll(".btnCategorias");
    botonesCategorias.forEach((btn) => {
      btn.addEventListener("click", () => {
        const categoria = btn.dataset.categoria;
        renderizarCatalogo(categoria);
        mensaje.innerHTML = `🔎 Filtrado por: <strong>${categoria}</strong>`;
      });
    });

    const btnCatalogoCompleto = document.getElementById("btnCatalogoCompleto");
    if (btnCatalogoCompleto) {
      btnCatalogoCompleto.addEventListener("click", () => {
        renderizarCatalogo("Todos");
        mensaje.innerHTML = `🔎 Mostrando: <strong>Catálogo completo</strong>`;
      });
    }
  } catch (error) {
    console.error("Error cargando el catálogo:", error);
    catalogoContainer.innerHTML =
      "<p class='text-center text-danger'>Error al cargar el catálogo.</p>";
  }
}

// ------------------------------ RENDER CATALOGO ------------------------------ //
function renderizarCatalogo(filtro = "Todos") {
  catalogoContainer.innerHTML = "";

  const categorias = {};
  productos.forEach((p) => {
    if (!categorias[p.categoria]) categorias[p.categoria] = [];
    categorias[p.categoria].push(p);
  });

  const esAdmin = window.location.pathname.includes("admin.html");

  Object.keys(categorias).forEach((cat) => {
    if (filtro !== "Todos" && cat !== filtro) return;

    const section = document.createElement("section");
    section.className = "categoria-section";

    const titulo = document.createElement("h2");
    titulo.className = "categoria-titulo text-center mb-4";
    titulo.textContent = cat;

    const grid = document.createElement("div");
    grid.className = "productos-grid";

    categorias[cat].forEach((producto) => {
      const card = producto.renderCard();
      grid.appendChild(card);

      if (esAdmin) {
        // Opciones admin
        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.className = "btn-editar";
        btnEditar.addEventListener("click", () => editarProducto(producto));

        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "Eliminar";
        btnEliminar.className = "btn-eliminar";
        btnEliminar.addEventListener("click", () => eliminarProducto(producto));

        card.appendChild(btnEditar);
        card.appendChild(btnEliminar);
      }
    });

    section.appendChild(titulo);
    section.appendChild(grid);
    catalogoContainer.appendChild(section);
  });
}

// ------------------------------ FUNCIONES ADMIN ------------------------------ //
function editarProducto(producto) {
  console.log("Editar producto:", producto.id);
}
function eliminarProducto(producto) {
  console.log("Eliminar producto:", producto.id);
}

// ------------------------------ INICIO ------------------------------ //
document.addEventListener("DOMContentLoaded", () => {
  cargarCatalogo();
});
*/
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import {
  agregarProducto,
  mostrarCarrito,
  actualizarCarritoVisual,
} from "./carrito.js";

const catalogoContainer = document.getElementById("catalogoContainer");
let productos = []; // para el filtrado

class Producto {
  constructor(
    id,
    imgSrc,
    nombre,
    descripcion,
    precio,
    categoria,
    destacado = false,
    stock
  ) {
    this.id = id;
    this.imgSrc = imgSrc;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.categoria = categoria;
    this.destacado = destacado;
    this.enCarrito = 1;

    const stockGuardado = JSON.parse(localStorage.getItem(`stock-${this.id}`));
    this.stock = stockGuardado ?? stock ?? 0;
    localStorage.setItem(`stock-${this.id}`, JSON.stringify(this.stock));
  }

  renderCard() {
    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
    <div class="product-info">
      <h3 class="product-description-title">${this.nombre}</h3>
      <p class="product-description">${this.descripcion}</p>
      <h5 class="product-price">$${this.precio}</h5>
    </div>
    <div class="product-image">
      <img src="${this.imgSrc}" alt="${this.nombre}" />
    </div>
  `;

    if (this.stock <= 0) {
      div.style.backgroundColor = "#d3d3d3";
      div.style.pointerEvents = "none";
      div.style.opacity = "0.7";
    } else {
      div.style.cursor = "pointer";
    }

    div.addEventListener("click", () => {
      if (this.stock <= 0) return;

      Swal.fire({
        title: this.nombre,
        html: `
        <img src="${this.imgSrc}" alt="${this.nombre}" style="width:150px;margin-bottom:10px;" />
        <p>${this.descripcion}</p>
        <h5>Precio: $${this.precio}</h5>
        <div style="display:flex; justify-content:center; align-items:center; gap:10px;">
          <button id="menos" class="swal2-confirm swal2-styled">-</button>
          <input type="number" id="cantidad" class="swal2-input" value="1" min="1" max="${this.stock}" style="width:60px; text-align:center;">
          <button id="mas" class="swal2-confirm swal2-styled">+</button>
        </div>
      `,
        showCancelButton: true,
        confirmButtonText: "Agregar al carrito",
        cancelButtonText: "Cancelar",
        didOpen: () => {
          const input = Swal.getPopup().querySelector("#cantidad");
          const btnMas = Swal.getPopup().querySelector("#mas");
          const btnMenos = Swal.getPopup().querySelector("#menos");

          btnMas.addEventListener("click", () => {
            if (Number(input.value) < this.stock)
              input.value = Number(input.value) + 1;
          });
          btnMenos.addEventListener("click", () => {
            if (Number(input.value) > 1) input.value = Number(input.value) - 1;
          });
        },
        preConfirm: () => {
          const cant = Number(document.getElementById("cantidad").value);
          if (!cant || cant < 1)
            Swal.showValidationMessage("Ingresa una cantidad válida");
          if (cant > this.stock)
            Swal.showValidationMessage("No hay suficiente stock");
          return cant;
        },
      }).then((result) => {
        if (result.isConfirmed) {
          this.enCarrito = result.value; // cantidad seleccionada
          agregarProducto(this);
          mostrarCarrito();
          actualizarCarritoVisual();
          Swal.fire(
            "¡Añadido!",
            `${this.nombre} x${this.enCarrito} agregado al carrito`,
            "success"
          );
        }
      });
    });

    return div;
  }
}

// ------------------------------ RENDER CATALOGO ------------------------------ //
function renderizarCatalogo(filtro = "Todos") {
  catalogoContainer.innerHTML = "";

  const categorias = {};
  productos.forEach((p) => {
    if (!categorias[p.categoria]) categorias[p.categoria] = [];
    categorias[p.categoria].push(p);
  });

  Object.keys(categorias).forEach((cat) => {
    if (filtro !== "Todos" && cat !== filtro) return;

    const section = document.createElement("section");
    section.className = "categoria-section";

    const titulo = document.createElement("h2");
    titulo.className = "categoria-titulo text-center mb-4";
    titulo.textContent = cat;

    const grid = document.createElement("div");
    grid.className = "productos-grid";

    categorias[cat].forEach((producto) => {
      grid.appendChild(producto.renderCard());
    });

    section.appendChild(titulo);
    section.appendChild(grid);
    catalogoContainer.appendChild(section);
  });
}

// ------------------------------ CARGAR CATALOGO ------------------------------ //
export async function cargarCatalogo() {
  if (!catalogoContainer) return;
  catalogoContainer.innerHTML = "<p>Cargando productos...</p>";

  try {
    const snapshot = await getDocs(collection(db, "productos"));
    productos = snapshot.docs.map((doc) => {
      const data = doc.data();
      return new Producto(
        doc.id,
        data.imagen || "/img/default-product.png",
        data.nombre || "Sin título",
        data.descripcion || "Sin descripción",
        data.precio || 0,
        data.categoria || "Sin categoría",
        data.destacado || false,
        data.stock ?? 0
      );
    });

    catalogoContainer.classList.remove("d-none");
    renderizarCatalogo("Todos");

    // Mensaje de filtrado
    const mensaje = document.getElementById("mensajeFiltro");
    const botonesCategorias = document.querySelectorAll(".btnCategorias");
    botonesCategorias.forEach((btn) => {
      btn.addEventListener("click", () => {
        const categoria = btn.dataset.categoria;
        renderizarCatalogo(categoria);
        if (mensaje)
          mensaje.innerHTML = `🔎 Filtrado por: <strong>${categoria}</strong>`;
      });
    });

    const btnCatalogoCompleto = document.getElementById("btnCatalogoCompleto");
    if (btnCatalogoCompleto) {
      btnCatalogoCompleto.addEventListener("click", () => {
        renderizarCatalogo("Todos");
        if (mensaje)
          mensaje.innerHTML = `🔎 Mostrando: <strong>Catálogo completo</strong>`;
      });
    }
  } catch (error) {
    console.error("Error cargando el catálogo:", error);
    catalogoContainer.innerHTML =
      "<p class='text-center text-danger'>Error al cargar el catálogo.</p>";
  }
}

// ------------------------------ INICIO ------------------------------ //
document.addEventListener("DOMContentLoaded", () => cargarCatalogo());
