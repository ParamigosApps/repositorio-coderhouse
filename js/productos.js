const container = document.getElementById("productos-container");
const containerDestacados = document.getElementById("container-destacados");
const cambiarBoton = document.getElementsByClassName("btn-agregar");
const botonMostrarMas = document.getElementById("button-mostrarmas");
const paginaActual = window.location.pathname.split("/").pop();

window.productos = [];
window.mostrarTodo = false;
let productosPorPaginas = 4;

let cartelEnCurso = false;
if (paginaActual == "productos.html") productosPorPaginas = 8;

class Producto {
  constructor(id, imgSrc, titulo, precio, destacado = false) {
    this.id = id;
    this.imgSrc = imgSrc;
    this.titulo = titulo;
    this.precio = precio;
    this.enCarrito = 1;
    this.categoria = "VAPES"; // FALTA IMPLEMENTAR
    this.subCategoria = "GENERAL"; // FALTA IMPLEMENTAR
    this.descripcion = null; // FALTA IMPLEMENTAR
    this.destacado = destacado;
    const chequearStock = JSON.parse(localStorage.getItem(`stock-${this.id}`));
    if (chequearStock !== null) {
      this.stock = chequearStock;
    } else {
      this.stock = 3;
      localStorage.setItem(`stock-${this.id}`, JSON.stringify(this.stock));
    }
  }

  //Prefab de nuestra card, para exhibir los productos
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

// Escuchamos cuando clickean agregar al carrito, verificamos stock, descontamos...
function vincularBotones(producto, boton) {
  boton.addEventListener("click", () => {
    if (producto.stock <= 0) {
      boton.textContent = "Sin stock";
      boton.style.backgroundColor = "#9dcdffff";
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
      `Se añadio con éxito: <b>${producto.titulo}</b>`,
      "#ffffffe9",
      "#000000fa",
      false
    );

    if (!cartelEnCurso) {
      setTimeout(() => {
        mostrarIrAlCarrito("<b>¿Desea ir al Carrito?</b>  ¡Haz Click Aqui!");
      }, 4000);
      cartelEnCurso = true;
    }
  });
}
//Chequeamos el stock, si no cambiamos boton
Array.from(cambiarBoton).forEach((boton) => {
  if (boton.textContent === "Sin stock") {
    boton.style.backgroundColor = "gray";
  }
});

// Boton para mostrar mas productos por pagina
if (botonMostrarMas != null) {
  botonMostrarMas.addEventListener("click", () => {
    productosPorPaginas += productosPorPaginas;
    if (productosPorPaginas >= window.productos.length) {
      botonMostrarMas.style.display = "none";
    }
    cargarProductos();
  });
}

// Animamos el carrito si hay productos añadidos
function animacionCarrito() {
  let imgCarrito = document.getElementById("img-carrito");
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  if (carrito.length > 0) {
    imgCarrito.classList.add("con-productos");
  } else {
    imgCarrito.classList.remove("con-productos");
  }
}

// NOTIFICACIONES TOASTIFY
function mostrarMensaje(mensaje, color, colorletra) {
  const toastmsj = document.createElement("div");
  toastmsj.innerHTML = mensaje;

  Toastify({
    node: toastmsj,
    position: "right",
    gravity: "bottom",
    style: {
      background: color,
      color: colorletra,
    },
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
    onClick: function () {
      window.location.href = "../pages/carrito.html";
    },
  }).showToast();
  cartelEnCurso = false;
}

// JSON CARGAR PRODUCTOS
async function cargarProductosJSON() {
  try {
    const response = await fetch("/json/productos.json");
    const data = await response.json();

    window.productos = data.map(
      (p) => new Producto(p.id, p.imgSrc, p.titulo, p.precio, p.destacado)
    );

    cargarProductos();
  } catch (error) {
    const p = document.createElement("p");
    p.textContent = "Hubo un error al cargar los productos.";

    if (container) container.appendChild(p);

    if (containerDestacados) containerDestacados.appendChild(p);
  }
}

function cargarProductos() {
  if (containerDestacados) {
    containerDestacados.innerHTML = "";

    let i = 0;
    window.productos.forEach((producto) => {
      if (!window.mostrarTodo) if (i >= productosPorPaginas) return;

      if (!producto.destacado) return;

      i++;
      const card = producto.render();
      containerDestacados.appendChild(card);

      const boton = card.querySelector(".btn-agregar");
      vincularBotones(producto, boton);
    });
  }
  //Si es para mostrar todos los productos
  if (container) {
    container.innerHTML = "";
    window.productos.forEach((producto, index) => {
      if (index >= productosPorPaginas && !window.mostrarTodo) return;

      //if (document.getElementById(producto.id)) return;

      const card = producto.render();
      container.appendChild(card);

      const boton = card.querySelector(".btn-agregar");
      vincularBotones(producto, boton);
    });
  }
}

function limpiar() {
  container.innerHTML = "";
}
document.addEventListener("DOMContentLoaded", () => {
  cargarProductosJSON();
  animacionCarrito();
});
