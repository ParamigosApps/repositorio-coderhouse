class Producto {
  constructor(id, imgSrc, titulo, precio) {
    this.id = id;
    this.imgSrc = imgSrc;
    this.titulo = titulo;
    this.precio = precio;
    this.stock = 10; //FALTA IMPLEMENTAR
  }

  render() {
    const div = document.createElement("div");
    div.className = "product-card";
    div.id = this.id;

    div.innerHTML = `
      <img src="${this.imgSrc}" alt="Imagen de producto" width="100%" />
      <h3 class="product-description-title">${this.titulo}</h3>
      <h5 class="product-price">${this.precio}</h5>
      <button id="btn-id-${this.id}" class="btn-agregar">Agregar al carrito</button>
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
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito.push(producto);
    localStorage.setItem("carrito", JSON.stringify(carrito));
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
