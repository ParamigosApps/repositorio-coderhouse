export class Producto {
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
    <div class="product-info">
      <h3 class="product-description-title">${this.titulo}</h3>
      <p class="product-description">${this.descripcion}</p>
      <h5 class="product-price">${this.precio}</h5>
    </div>
    <img src="${this.imgSrc}" alt="${this.titulo}" />
  `;
    if (sinStock) div.classList.add("producto-sin-stock");
    return div;
  }
}
