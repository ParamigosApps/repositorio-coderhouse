import { db } from "./firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

const catalogoContainer = document.getElementById("catalogoContainer");
const paginaActual = window.location.pathname.split("/").pop();

let productos = [];
let productosPorPagina = paginaActual === "index.html" ? 4 : 8;
let cartelEnCurso = false;

// ------------------------------ CLASE PRODUCTO ------------------------------ //
class Producto {
  constructor(
    id,
    imgSrc,
    titulo,
    descripcion,
    precio,
    categoria,
    destacado = false
  ) {
    this.id = id;
    this.imgSrc = imgSrc;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.precio = precio;
    this.categoria = categoria;
    this.destacado = destacado;
    this.enCarrito = 1;

    const stockGuardado = JSON.parse(localStorage.getItem(`stock-${this.id}`));
    this.stock = stockGuardado !== null ? stockGuardado : 3;
    localStorage.setItem(`stock-${this.id}`, JSON.stringify(this.stock));
  }

  render() {
    const div = document.createElement("div");
    div.className = "product-card";

    const sinStock = this.stock <= 0;

    div.innerHTML = `
      <h3 class="product-description-title">${this.titulo}</h3>
      <p class="product-description">${this.descripcion}</p>
      <h5 class="product-price">$${this.precio}</h5>
      <button 
        id="btn-id-${this.id}" 
        class="btn-agregar"
        ${sinStock ? 'style="background-color:#2d2d2db6;"' : ""}
      >
        ${sinStock ? "X" : "+"}
      </button>
      <img src="${this.imgSrc}" alt="${this.titulo}" />
    `;
    return div;
  }
}

// ------------------------------ CARGAR CATALOGO DESDE FIREBASE ------------------------------ //
export async function cargarCatalogo() {
  if (!catalogoContainer)
    return console.error("No se encontró #catalogoContainer");

  catalogoContainer.innerHTML = "<p>Cargando productos...</p>";

  try {
    const snapshot = await getDocs(collection(db, "productos"));
    catalogoContainer.innerHTML = "";

    productos = snapshot.docs.map((doc) => {
      const data = doc.data();
      return new Producto(
        doc.id,
        data.imagenURL || data.imagen || "/img/default-product.png",
        data.titulo,
        data.descripcion,
        data.precio,
        data.categoria,
        data.destacado
      );
    });

    renderizarCatalogo();
  } catch (error) {
    console.error("Error cargando el catálogo:", error);
    catalogoContainer.innerHTML =
      "<p class='text-center text-danger'>Error al cargar el catálogo.</p>";
  }
}

// ------------------------------ RENDER CATALOGO ------------------------------ //
function renderizarCatalogo() {
  catalogoContainer.innerHTML = "";

  // Agrupamos productos por categoría
  const categorias = {};
  productos.forEach((p) => {
    if (!categorias[p.categoria]) categorias[p.categoria] = [];
    categorias[p.categoria].push(p);
  });

  // Creamos sección para cada categoría
  Object.keys(categorias).forEach((cat) => {
    const section = document.createElement("section");
    section.className = "categoria-section";

    const titulo = document.createElement("h2");
    titulo.className = "categoria-titulo text-center mb-4";
    titulo.textContent = cat;

    const grid = document.createElement("div");
    grid.className = "productos-grid";

    categorias[cat].forEach((producto) => {
      const card = producto.render();
      grid.appendChild(card);

      // Vincular botón de agregar
      const boton = card.querySelector(".btn-agregar");
      vincularBotones(producto, boton);

      // Click en card para mostrar en grande con Swal
      card.addEventListener("click", (e) => {
        if (e.target !== boton) {
          Swal.fire({
            title: producto.titulo,
            html: `
              <img src="${producto.imgSrc}" alt="${producto.titulo}" 
                style="width: 100%; max-width: 300px; border-radius: 8px; margin-bottom: 10px;">
              <p>${producto.descripcion}</p>
              <h5>Precio: $${producto.precio}</h5>
              <p>Stock: ${producto.stock}</p>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            width: "350px",
            background: "#f7f7f7",
          });
        }
      });
    });

    section.appendChild(titulo);
    section.appendChild(grid);
    catalogoContainer.appendChild(section);
  });
}

// ------------------------------ FUNCIONES CARRITO ------------------------------ //
function vincularBotones(producto, boton) {
  boton.addEventListener("click", (e) => {
    e.stopPropagation(); // Evita abrir Swal al hacer click en el botón

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

    animacionCarrito();
    mostrarMensaje(
      `Se añadió con éxito: <b>${producto.titulo}</b>`,
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

function animacionCarrito() {
  const imgCarrito = document.getElementById("img-carrito");
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  if (imgCarrito)
    carrito.length > 0
      ? imgCarrito.classList.add("con-productos")
      : imgCarrito.classList.remove("con-productos");
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
  animacionCarrito();
});
