const catalogoContainer = document.getElementById("catalogo-container");
const paginaActual = window.location.pathname.split("/").pop();

let productos = [];
let productosPorPaginas = 8;
if (paginaActual === "index.html") productosPorPaginas = 4;

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
      <a href="../pages/producto.html?id=${this.id}">
        
        <h3 class="product-description-title">${this.titulo}</h3>
        <p class="product-description">${this.descripcion}</p>
        <h5 class="product-price">${this.precio}</h5>
      </a>
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

// ------------------------------ FUNCIONES PRINCIPALES ------------------------------ //
async function cargarCatalogoJSON() {
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

    renderizarCatalogo();
  } catch (error) {
    console.error("Error cargando el catálogo:", error);
    catalogoContainer.innerHTML =
      "<p class='text-center text-danger'>Error al cargar el catálogo.</p>";
  }
}

function renderizarCatalogo() {
  catalogoContainer.innerHTML = "";

  // Agrupamos los productos por categoría
  const categorias = {};
  productos.forEach((p) => {
    if (!categorias[p.categoria]) categorias[p.categoria] = [];
    categorias[p.categoria].push(p);
  });

  // Creamos una sección para cada categoría
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
      const boton = card.querySelector(".btn-agregar");
      vincularBotones(producto, boton);
    });

    section.appendChild(titulo);
    section.appendChild(grid);
    catalogoContainer.appendChild(section);
  });
}

// ------------------------------ FUNCIONES CARRITO ------------------------------ //
function vincularBotones(producto, boton) {
  boton.addEventListener("click", () => {
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
  let imgCarrito = document.getElementById("img-carrito");
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
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

// ------------------------------ INICIO ------------------------------ //
document.addEventListener("DOMContentLoaded", () => {
  cargarCatalogoJSON();
  animacionCarrito();
});
