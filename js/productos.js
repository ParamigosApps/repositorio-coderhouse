class Producto {
  constructor(id, imgSrc, titulo, precio) {
    this.id = id;
    this.imgSrc = imgSrc;
    this.titulo = titulo;
    this.precio = precio;

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

    div.innerHTML = `
      <img src="${this.imgSrc}" alt="Imagen de producto" width="100%" />
      <h3 class="product-description-title">${this.titulo}</h3>
      <h5 class="product-price">${this.precio}</h5>
      <button 
      id="btn-id-${this.id}" 
      class="btn-agregar" 
      ${sinStock ? "disabled" : ""}
      ${sinStock ? "" : 'style="background-color: #4199f7ff; cursor: pointer;"'}
    >
      ${sinStock ? "Sin stock" : "Agregar al carrito"}
      
    </button>
    
    `;
    return div;
  }
}

// Array de productos
const productos = [
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
];

const container = document.getElementById("productos-container");

productos.forEach((producto) => {
  container.appendChild(producto.render());
  const boton = document.getElementById(`btn-id-${producto.id}`);

  boton.addEventListener("click", () => {
    if (producto.stock <= 0) {
      location.reload();
      return;
    }

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito.push(producto);
    producto.stock -= 1;
    localStorage.setItem(
      `stock-${producto.id}`,
      JSON.stringify(producto.stock)
    );
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCarritoVisual();
    mostrarMensaje();
  });
});

function mostrarMensaje() {
  const aviso = document.getElementById("mensajeCarrito");
  aviso.style.display = "block";

  setTimeout(() => {
    aviso.style.display = "none";
  }, 1500);
}
const cambiarBoton = document.getElementsByClassName("btn-agregar");

Array.from(cambiarBoton).forEach((boton) => {
  if (boton.textContent === "Sin stock") {
    boton.style.backgroundColor = "gray";
    boton.style.cursor = "not-allowed";
  }
});

function actualizarCarritoVisual() {
  let imgCarrito = document.getElementById("img-carrito");
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  if (carrito.length > 0) {
    imgCarrito.classList.add("con-productos");
  } else {
    imgCarrito.classList.remove("con-productos");
  }
}

actualizarCarritoVisual();
