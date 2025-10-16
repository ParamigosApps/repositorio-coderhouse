const contenedorDetalle = document.getElementById("contenedor-detalleproducto");

const parametrosURL = new URLSearchParams(window.location.search);
const idProducto = parametrosURL.get("id");

// Mostramos el producto clickeado, guiandonos por su id
function mostrarProducto() {
  let listaproductos = window.productos;
  let producto = listaproductos.find((p) => p.id == idProducto);
  if (!idProducto || !producto) {
    contenedorDetalle.innerHTML = `<p>Producto no encontrado.</p>`;
    console.log(producto.titulo);
    return;
  }
  const sinStock = producto.stock <= 0;
  contenedorDetalle.innerHTML = `
  
  <section id="img-detalleproducto">
    <img
      src="${producto.imgSrc}"
      alt="${producto.titulo}"
    />
  </section>
  <section id="info-contenedor-productodetalles">
    <div id="categoria-detalleproducto">
      <h6>
        ${producto.categoria?.toUpperCase() || "CATEGORIA"} / ${
    producto.subCategoria?.toUpperCase() || "SUB CATEGORIA"
  }
      </h6>
    </div>
    <div id="tituloydescripcion-detalleproducto">
      <h2 id="titulo-detalleproducto">${producto.titulo}</h2>
      <h4 id="descripcion-detalleproducto">${producto.descripcion || ""}</h4>
    </div>
    <div id="precio-detalleproducto"><h3>${producto.precio}</h3></div>
    <div id="cantidad-detalleproducto">      <label for="cantidad" class="form-label fw-bold text-primary d-block text-left mt-5">Cantidad</label>
        <select class="form-select form-select-sm border border-2 border-info rounded-pill text-center w-50" id="cantidad" name="cantidad"></select>
        <div class="form-text text-muted mb-3">Selecciona la cantidad deseada.</div>
        
        <button class="btn-agregar w-50" id="agregar-detalle" style="background-color: ${
          sinStock ? "#9dcdff" : "#4199f7"
        };">
          ${sinStock ? "Sin stock" : "Añadir al carrito"}
        </button></div>
  </section>
`;

  // Llenamos la cantidad elegible segun stock disponible
  const cantidadSelect = document.getElementById("cantidad");
  cantidadSelect.innerHTML = "";

  for (let i = 1; i <= producto.stock; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    if (i === 1) option.selected = true;
    cantidadSelect.appendChild(option);
  }

  const boton = document.getElementById("agregar-detalle");

  // Escuchamos click para añadir productos al carrito, descontarlo del stock, chequear si hay stock, ect.
  boton.addEventListener("click", () => {
    const cantidad = parseInt(document.getElementById("cantidad").value) || 1;

    if (producto.stock <= 0) {
      boton.textContent = "Sin stock";
      boton.style.backgroundColor = "#9dcdff";
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

    localStorage.setItem(
      `stock-${producto.id}`,
      JSON.stringify(producto.stock)
    );

    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCarritoVisual();
    mostrarMensaje(
      `Añadiste ${cantidad} x ${producto.titulo} al carrito`,
      "#2bff00c4"
    );
  });
}

async function cargarProductosJSON() {
  try {
    const response = await fetch("/json/productos.json"); // Ajusta la ruta según dónde pusiste tu JSON
    const data = await response.json();

    window.productos = data.map(
      (p) => new Producto(p.id, p.imgSrc, p.titulo, p.precio)
    );
    mostrarProducto();
  } catch (error) {
    console.error("Error cargando productos JSON:", error);
  }
}

cargarProductosJSON();

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
