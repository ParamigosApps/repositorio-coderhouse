const container = document.getElementById("productos-container");
const cambiarBoton = document.getElementsByClassName("btn-agregar");
const botonMostrarMas = document.getElementById("button-mostrarmas");
const paginaActual = window.location.pathname.split("/").pop();

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

    div.innerHTML = `<a href="/pages/producto.html?id=${this.id}">
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

// Array de productos
window.productos = [
  new Producto(
    "producto1",
    "/Assets/vapers/vaper (1).webp",
    "GrapeFruit - Lost Mary 30K",
    "$30.000"
  ),
  new Producto(
    "producto2",
    "/Assets/vapers/vaper (2).jpg",
    "Peach Lemonade - Nasty 5K",
    "$17.999"
  ),
  new Producto(
    "producto3",
    "/Assets/vapers/vaper (3).png",
    "Menta - Elfbar 40K",
    "$32.999"
  ),
  new Producto(
    "producto4",
    "/Assets/vapers/vaper (4).webp",
    "Frutilla - Elfbar 40K",
    "$49.999"
  ),
  new Producto(
    "producto5",
    "/Assets/vapers/vaper (6).jpg",
    "Mango Strawberry - Nasty 5K",
    "$17.999"
  ),
  new Producto(
    "producto6",
    "/Assets/vapers/vaper (7).webp",
    "Orange Strawberry - Losty Mary 30K",
    "$30.000"
  ),
  new Producto(
    "producto7",
    "/Assets/vapers/vaper (8).jpg",
    "PineApple Lemonade - Nasty 5K",
    "$17.999"
  ),
  new Producto(
    "producto8",
    "/Assets/vapers/vaper (10).webp",
    "Grape - ELFBAR 40K",
    "$32.999"
  ),
  new Producto(
    "producto9",
    "/Assets/vapers/vaper9.png",
    "Paradise OG - Torch 7.5",
    "$75.000"
  ),
  new Producto(
    "producto10",
    "/Assets/vapers/vaper10.png",
    "Green Apple - Torch 5.0",
    "$32.999"
  ),

  new Producto(
    "producto11",
    "/Assets/vapers/vaper11.webp",
    "Lemon - Torch 7.5",
    "$75.000"
  ),

  new Producto(
    "producto12",
    "/Assets/vapers/vaper12.jpg",
    "Watermelon - Torch 7.5",
    "$75.000"
  ),
];

function cargarProductos() {
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
  //BOTONES
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
    actualizarCarritoVisual();
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
    if (productosPorPaginas >= productos.length) {
      botonMostrarMas.style.display = "none";
    }
    cargarProductos();
  });
}

function actualizarCarritoVisual() {
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
actualizarCarritoVisual();

if (paginaActual == "index.html" || paginaActual == "productos.html")
  cargarProductos();
