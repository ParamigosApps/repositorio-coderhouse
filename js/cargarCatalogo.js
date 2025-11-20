import { db } from "./firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { agregarProductoCarrito, mostrarCarrito } from "/js/carrito.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

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

  // ⬇⬇⬇ AGREGAR ESTO DE NUEVO ⬇⬇⬇
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
    `;

    if (sinStock) {
      div.style.backgroundColor = "#d3d3d3";
      div.style.pointerEvents = "none";
      div.style.opacity = "0.7";
    } else {
      div.style.cursor = "pointer";
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

    // Mostrar contenedor
    catalogoContainer.classList.remove("d-none");

    // Render inicial: todo el catálogo
    renderizarCatalogo("Todos");

    // Vincular botones de categorías
    const botonesCategorias = document.querySelectorAll(".btnCategorias");
    botonesCategorias.forEach((btn) => {
      btn.addEventListener("click", () => {
        const categoria = btn.dataset.categoria;
        renderizarCatalogo(categoria);
      });
    });

    // Botón catálogo completo
    const btnCatalogoCompleto = document.getElementById("btnCatalogoCompleto");
    if (btnCatalogoCompleto) {
      btnCatalogoCompleto.addEventListener("click", () =>
        renderizarCatalogo("Todos")
      );
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
      } else {
        if (producto.stock > 0) card.style.cursor = "pointer";

        card.addEventListener("click", () => {
          Swal.fire({
            title: producto.nombre,
            html: `
              <div class="product-card-expandida">
                <img src="${producto.imgSrc}" alt="${
              producto.nombre
            }" class="product-card-expandida__img">
                <p class="product-card-expandida__descripcion">${
                  producto.descripcion
                }</p>
                <h5 class="product-card-expandida__precio">Precio: $${
                  producto.precio
                }</h5>
                <button 
                  id="swal-btn-agregar" 
                  class="product-card-expandida__btn" 
                  ${producto.stock <= 0 ? "disabled" : ""}
                >
                  ${producto.stock <= 0 ? "X" : "Agregar"}
                </button>
              </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
              popup: "product-card-popup", // clase para popup
            },
          });

          // Botón agregar
          document
            .getElementById("swal-btn-agregar")
            ?.addEventListener("click", () => {
              if (producto.stock > 0) {
                agregarProductoCarrito(producto);
                mostrarCarrito();
                Swal.close();
              }
            });
        });
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

// ------------------------------ FUNCIONES CARRITO ------------------------------ //
function vincularBotones(producto, boton) {
  boton.addEventListener("click", (e) => {
    e.stopPropagation();

    if (producto.stock <= 0) {
      boton.textContent = "Sin stock";
      boton.style.backgroundColor = "#343a40";
      mostrarMensaje("Producto sin stock", "#ff2d03e0", "#ffffffff");
      return;
    }

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const existe = carrito.some((item) => item.id === producto.id);

    if (existe) {
      carrito = carrito.map((item) => {
        if (item.id === producto.id) {
          producto.enCarrito += 1;
          return { ...item, enCarrito: producto.enCarrito };
        }
        return item;
      });
    } else carrito.push(producto);

    producto.stock -= 1;
    localStorage.setItem(
      `stock-${producto.id}`,
      JSON.stringify(producto.stock)
    );
    localStorage.setItem("carrito", JSON.stringify(carrito));

    mostrarMensaje(
      `Se añadió con éxito: <b>${producto.nombre}</b>`,
      "#ffffffe9",
      "#000000fa"
    );

    if (!cartelEnCurso) {
      setTimeout(() => {
        mostrarIrAlCarrito("<b>¿Desea ir al Carrito?</b> ¡Haz Click Aquí!");
      }, 4000);
      cartelEnCurso = true;
    }
  });
}

// ------------------------------ TOASTIFY ------------------------------ //
function mostrarMensaje(mensaje, color, colorletra) {
  const toastmsj = document.createElement("div");
  toastmsj.innerHTML = mensaje;

  Toastify({
    node: toastmsj,
    position: "right",
    gravity: "bottom",
    style: { background: color, color: colorletra },
    duration: 2500,
  }).showToast();
}

function mostrarIrAlCarrito(mensaje) {
  const toastmsj = document.createElement("div");
  toastmsj.innerHTML = mensaje;

  Toastify({
    node: toastmsj,
    duration: 4000,
    gravity: "top",
    position: "center",
    style: {
      background: "#ffffffda",
      width: "250px",
      height: "75px",
      lineHeight: "25px",
      textAlign: "center",
      borderRadius: "4px",
      fontSize: "1.2rem",
      fontWeight: "500",
      color: "#000000fa",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    },
    stopOnFocus: true,
    onClick: () => (window.location.href = "../pages/carrito.html"),
  }).showToast();

  cartelEnCurso = false;
}

// ------------------------------ INICIO ------------------------------ //
document.addEventListener("DOMContentLoaded", () => {
  cargarCatalogo();
});
