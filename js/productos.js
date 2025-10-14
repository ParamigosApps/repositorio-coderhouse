const container = document.getElementById("productos-container");
const cambiarBoton = document.getElementsByClassName("btn-agregar");
const botonMostrarMas = document.getElementById("button-mostrarmas");
const paginaActual = window.location.pathname.split("/").pop();

window.productos = []; // Array de productos obtenidos de JSON

let productosPorPaginas = 4;
let mostrarMas = 4;

if (paginaActual == "productos.html") productosPorPaginas = 8;

class Producto {
  constructor(id, imgSrc, titulo, precio) {
    this.id = id;
    this.imgSrc = imgSrc;
    this.titulo = titulo;
    this.precio = precio;
    this.enCarrito = 1;
    this.categoria = "VAPES"; // FALTA IMPLEMENTAR
    this.subCategoria = "GENERAL"; // FALTA IMPLEMENTAR
    this.descripcion = null; // FALTA IMPLEMENTAR
    this.destacado = false;
    const chequearStock = JSON.parse(localStorage.getItem(`stock-${this.id}`));
    if (chequearStock !== null) {
      this.stock = chequearStock;
    } else {
      this.stock = 3;
      localStorage.setItem(`stock-${this.id}`, JSON.stringify(this.stock));
    }
  }

  render() {
    const div = document.createElement("div");
    div.className = "product-card";
    div.id = this.id;

    const sinStock = this.stock <= 0;

    div.innerHTML = `<a href="../pages/producto.html?id=${this.id}">
      <img src="${this.imgSrc}" alt="Imagen de producto" />
      <h3 class="product-description-title">${this.titulo}</h3>
      <h5 class="product-price">${this.precio}</h5>
      </a>
      <button 
      id="btn-id-${this.id}" 
      
      class="btn-agregar" 
      ${
        sinStock
          ? 'style="background-color: #9dcdffff;"'
          : 'style="background-color: #4199f7ff;"'
      }
    >
      ${sinStock ? "Sin stock" : "Agregar al carrito"}
      
    </button>
    
    `;
    return div;
  }
}
function cargarProductos() {
  if (container == null) return;

  window.productos.forEach((producto, index) => {
    if (index >= productosPorPaginas) return;

    if (document.getElementById(producto.id)) return;

    const card = producto.render();
    container.appendChild(card);

    const boton = card.querySelector(".btn-agregar");
    vincularBotones(producto, boton);
  });
}

function vincularBotones(producto, boton) {
  boton.addEventListener("click", () => {
    if (producto.stock <= 0) {
      boton.textContent = "Sin stock";
      boton.style.backgroundColor = "#9dcdffff";
      mostrarMensaje("Producto sin stock", "#ff2d03c1");
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
    actualizarCarrito();
    mostrarMensaje(
      "Añadiste: " + producto.titulo + " al carrito ",
      "#2bff00c4"
    );
  });
}
Array.from(cambiarBoton).forEach((boton) => {
  if (boton.textContent === "Sin stock") {
    boton.style.backgroundColor = "gray";
  }
});

if (botonMostrarMas != null) {
  botonMostrarMas.addEventListener("click", () => {
    productosPorPaginas += mostrarMas;
    if (productosPorPaginas >= window.productos.length) {
      botonMostrarMas.style.display = "none";
    }
    cargarProductos();
  });
}

function actualizarCarrito() {
  let imgCarrito = document.getElementById("img-carrito");
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  if (carrito.length > 0) {
    imgCarrito.classList.add("con-productos");
  } else {
    imgCarrito.classList.remove("con-productos");
  }
}

// NOTIFICACIONES TOASTIFY
function mostrarMensaje(mensaje, color) {
  Toastify({
    text: mensaje,
    position: "right",
    gravity: "bottom",
    backgroundColor: color,
    duration: 2500,
  }).showToast();
}

// JSON CARGAR PRODUCTOS
async function cargarProductosJSON() {
  try {
    const response = await fetch("/database.json"); // Ajusta la ruta según dónde pusiste tu JSON
    const data = await response.json();

    window.productos = data.map(
      (p) => new Producto(p.id, p.imgSrc, p.titulo, p.precio)
    );

    cargarProductos();
  } catch (error) {
    console.error("Error cargando productos JSON:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarProductosJSON();
  actualizarCarrito();
});
