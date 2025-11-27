// cargarCatalogo.js

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
let catalogoVisible = false; // 🔥 NUEVO — controla visibilidad

// ======================================================
// 🛒 PRODUCTO — stock REAL desde Firebase (colección: productos)
// ======================================================
class Producto {
  constructor(id, data) {
    this.id = id;
    this.imgSrc = data.imagen || "/img/default-product.png";
    this.nombre = data.nombre || "Sin título";
    this.descripcion = data.descripcion || "Sin descripción";
    this.precio = data.precio || 0;
    this.categoria = data.categoria || "Sin categoría";
    this.destacado = data.destacado || false;

    this.stock = data.stock ?? 0; // 🔥 STOCK REAL desde Firestore

    this.enCarrito = 1;
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
      div.style.opacity = "0.6";
    } else {
      div.style.cursor = "pointer";
    }

    // ========= POPUP REUTILIZABLE =========
    const popupAñadido = (nombre, cantidad) => {
      return Swal.fire({
        title: "¡Producto añadido!",
        html: `<p style="font-size:18px; font-weight:600;">${nombre} x${cantidad} agregado al carrito 🛒</p>`,
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "¿Ir al carrito?",
        cancelButtonText: "Seguir comprando",
        reverseButtons: true,
        customClass: {
          popup: "swal-popup-custom",
          confirmButton: "swal-btn-confirm",
          cancelButton: "swal-btn-cancel",
        },
        buttonsStyling: false,
      });
    };

    // ========= CLICK PARA AGREGAR =========
    div.addEventListener("click", () => {
      if (this.stock <= 0) return;

      Swal.fire({
        title: this.nombre,
        html: `
          <img src="${this.imgSrc}" style="width:150px;margin-bottom:10px;" />
          <p>${this.descripcion}</p>
          <h5>Precio: $${this.precio}</h5>

          <div style="display:flex; justify-content:center; align-items:center; ">
            <button id="menos" class="btn-swal-cantidad">-</button>
            <input type="number" id="cantidad" class="swal2-input" value="1" min="1" max="${this.stock}" style="width:70px; text-align:center; margin: 0.5rem;">
            <button id="mas" class="btn-swal-cantidad">+</button>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Agregar al carrito",
        cancelButtonText: "Cancelar",
        customClass: {
          popup: "swal-popup-custom",
          confirmButton: "swal-btn-confirm",
          cancelButton: "swal-btn-cancel",
        },
        buttonsStyling: false,

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
            return Swal.showValidationMessage("Ingresa una cantidad válida");

          if (cant > this.stock)
            return Swal.showValidationMessage("No hay suficiente stock");

          return cant;
        },
      }).then((result) => {
        if (!result.isConfirmed) return;

        this.enCarrito = result.value;

        agregarProducto(this);
        mostrarCarrito();
        actualizarCarritoVisual();

        popupAñadido(this.nombre, this.enCarrito).then((r) => {
          if (r.isConfirmed) {
            carritoPanel.classList.add("open");
            carritoOverlay.hidden = false;
          }
        });
      });
    });

    return div;
  }
}

// ======================================================
// 📌 Renderizar catálogo por categoría
// ======================================================
export function renderizarCatalogo(filtro = "Todos") {
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

// ======================================================
// 📌 Cargar catálogo desde Firebase
// ======================================================
export async function cargarCatalogo() {
  if (!catalogoContainer) return;

  // 🔥 OCULTAR CATÁLOGO AL INICIAR
  catalogoContainer.style.display = "none";
  catalogoVisible = false;

  try {
    const snapshot = await getDocs(collection(db, "productos"));
    productos = snapshot.docs.map((doc) => new Producto(doc.id, doc.data()));
    renderizarCatalogo("Todos");
  } catch (error) {
    console.error("Error cargando el catálogo:", error);
    catalogoContainer.innerHTML =
      "<p class='text-center text-danger'>Error al cargar el catálogo.</p>";
  }
}

// ======================================================
// 🔍 Filtro por categorías + lógica de visibilidad
// ======================================================
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btnCategorias");
  if (!btn) return;

  const categoria = btn.dataset.categoria;
  const mensaje = document.getElementById("mensajeFiltro");

  // ================================
  // 📌 1. Si es una categoría normal
  // ================================
  if (categoria !== "Todos") {
    renderizarCatalogo(categoria);

    // Mostrar catálogo siempre
    catalogoContainer.style.display = "block";
    catalogoVisible = true;

    if (mensaje)
      mensaje.innerHTML = `🔎 Filtrado por: <strong>${categoria}</strong>`;

    return;
  }

  // ================================
  // 📌 2. Si es "Todos" → TOGGLE
  // ================================
  if (!catalogoVisible) {
    // Estaba oculto → mostrar todo
    renderizarCatalogo("Todos");
    catalogoContainer.style.display = "block";
    catalogoVisible = true;

    if (mensaje)
      mensaje.innerHTML = `🔎 Mostrando: <strong>Catálogo completo</strong>`;
  } else {
    // Estaba visible → ocultar
    catalogoContainer.style.display = "none";
    catalogoVisible = false;

    if (mensaje)
      mensaje.innerHTML = `Puedes filtrar los productos por categorías.`;
  }
});

// ======================================================
// 🚀 Iniciar carga
// ======================================================
document.addEventListener("DOMContentLoaded", () => cargarCatalogo());
