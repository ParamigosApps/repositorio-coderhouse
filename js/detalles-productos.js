const contenedorDetalle = document.getElementById("detalle-producto");

const parametrosURL = new URLSearchParams(window.location.search);
const idProducto = parametrosURL.get("id");

window.productos =
  window.productos || JSON.parse(localStorage.getItem("productos")) || [];

const listaproductos = window.productos;
const producto = listaproductos.find((p) => p.id === idProducto);

if (!idProducto || !producto)
  contenedorDetalle.innerHTML = `<p>Producto no encontrado.</p>`;

const sinStock = producto.stock <= 0;

contenedorDetalle.innerHTML = `
    <section class="producto-info">
      <div id="comprar-producto">
        <h6>CATEGORIAS / ${producto.categoria?.toUpperCase() || "GENERAL"}</h6>
        <h4>${producto.subtitulo || ""}</h4>
        <h2>${producto.titulo}</h2>
        <h3 class="product-price">${producto.precio}</h3>
        <img src="${producto.imgSrc}" alt="${
  producto.titulo
}" width="100%" style="margin-bottom: 1rem;"/>
        <div class="mb-3">
          <label for="cantidad" class="form-label">Cantidad</label>
          <input type="number" class="form-control" id="cantidad" name="cantidad" value="1" min="1"/>
        </div>
        <div>
          <button 
            class="btn-agregar" 
            id="agregar-detalle"
            style="background-color: ${sinStock ? "#9dcdff" : "#4199f7"};"
            ${sinStock ? "" : ""}
          >
            ${sinStock ? "Sin stock" : "Añadir al carrito"}
          </button>
        </div>
      </div>
    </section>
  `;

const boton = document.getElementById("agregar-detalle");

boton.addEventListener("click", () => {
  const cantidad = parseInt(document.getElementById("cantidad").value) || 1;

  if (producto.stock <= 0) {
    boton.textContent = "Sin stock";
    boton.style.backgroundColor = "#9dcdffff";
    mostrarMensaje("Producto sin stock", "#ff2d03c1");
    return;
  }

  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  const existe = carrito.find((item) => item.id === producto.id);

  if (producto.stock - cantidad < 0) {
    console.log("stock - cantidad: " + (producto.stock - cantidad));
    mostrarMensaje(
      `Solo quedan ${producto.stock} unidades en stock`,
      "#ffb703c1"
    );

    return;
  }

  producto.stock -= cantidad;
  if (producto.stock <= 0) {
    boton.textContent = "Sin stock";
    boton.style.backgroundColor = "#9dcdffff";
  }

  if (existe) {
    console.log(producto.stock - cantidad < 0);
    console.log("stock " + producto.stock + " cantidad " + cantidad);
    existe.enCarrito += cantidad;
  } else carrito.push({ ...producto, enCarrito: cantidad });

  localStorage.setItem(`stock-${producto.id}`, JSON.stringify(producto.stock));

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarritoVisual();
  mostrarMensaje(
    `Añadiste ${cantidad} x ${producto.titulo} al carrito`,
    "#2bff00c4"
  );
});

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
