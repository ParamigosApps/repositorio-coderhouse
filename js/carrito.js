const carritoItems = document.getElementById("carrito-items");
const montoTotalCarrito = document.getElementById("MontoTotalCarrito");
const btnFinalizarCompra = document.getElementById("btn-comprar");
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function calcularTotal() {
  let totalCarrito = 0;
  carrito.forEach((producto) => {
    const precioNumerico = Number(
      producto.precio.toString().replace(/\$/g, "").replace(/\./g, "")
    );
    totalCarrito += producto.enCarrito * precioNumerico;
  });
  console.log("Total calculado:", totalCarrito);
  return totalCarrito;
}
function mostrarCarrito() {
  carritoItems.innerHTML = "";
  carrito.forEach((producto, idbtn) => {
    const precioNumerico = Number(
      producto.precio.replace(/\$/g, "").replace(/\./g, "")
    );
    const total = producto.enCarrito * precioNumerico;
    const card = document.createElement("tr");
    card.innerHTML = `
      <td class="text-start">
        <img src="${producto.imgSrc}" alt="${producto.titulo}" class="img-producto-carrito" />
        ${producto.titulo}
      </td>
      <td>${producto.enCarrito}</td>
      <td class="precioUnitarioProducto">${producto.precio}</td>
      <td class="subtotalProducto">$${total}</td>
      <td>
        <button class="btn btn-success btn-sm" data-index="${idbtn}">+</button>
        <button class="btn btn-danger btn-sm" data-index="${idbtn}">-</button>
      </td>
    `;
    carritoItems.appendChild(card);
  });

  montoTotalCarrito.textContent = "$" + calcularTotal();
}

// ELIMINAR PRODUCTOS
carritoItems.addEventListener("click", (e) => {
  const index = Number(e.target.dataset.index);
  if (Number.isNaN(index)) return;

  const producto = carrito[index];
  if (!producto) return;
  // QUITAR 1 UNIDAD DEL CARRITO
  if (e.target.classList.contains("btn-danger")) {
    // SI HAY 1 UNIDAD EN EL CARRITO
    if (producto.enCarrito == 1) {
      Swal.fire({
        title: "¿Estás seguro?",
        text: "Se quitará del carrito " + producto.titulo,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "¡Producto eliminado!",
            text: "Se ha quitado " + producto.titulo + " de su carrito.",
            icon: "success",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Aceptar",
          }).then(() => {
            quitarProductoDelCarrito(index);
          });
        }
      });
      // SI HAY MÁS DE 1 UNIDAD EN EL CARRITO
    } else if (producto.enCarrito > 1) QuitarUnidadDelCarrito(index);

    // AÑADIR 1 UNIDAD AL CARRITO
  } else if (e.target.classList.contains("btn-success")) {
    sumarProductoAlCarrito(index);
  } else {
    Swal.fire({
      title: "No hay más stock",
      text: "No quedan más unidades de " + producto.titulo,
      icon: "error",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Aceptar",
    });
  }
});
// QUITAR PRODUCTO DEL CARRITO
function quitarProductoDelCarrito(index) {
  const productoAEliminar = carrito[index];
  if (!productoAEliminar) return;

  const claveStock = `stock-${productoAEliminar.id}`;
  const stockActual = JSON.parse(localStorage.getItem(claveStock)) || 0;
  localStorage.setItem(
    claveStock,
    JSON.stringify(stockActual + productoAEliminar.enCarrito)
  );

  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));

  actualizarCarritoVisual();
  mostrarCarrito();

  mostrarMensaje(
    "Quitaste " + productoAEliminar.titulo + " del carrito.",
    "#ff2d03c1"
  );
}
// QUITAR 1 UNIDAD DEL CARRITO
function QuitarUnidadDelCarrito(index) {
  const producto = carrito[index];
  if (!producto) return;

  const claveStock = `stock-${producto.id}`;
  const stockActual = JSON.parse(localStorage.getItem(claveStock)) || 0;
  localStorage.setItem(claveStock, JSON.stringify(stockActual + 1));

  producto.enCarrito -= 1;

  if (producto.enCarrito <= 0) {
    carrito.splice(index, 1);
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarritoVisual();
  mostrarCarrito();

  mostrarMensaje(
    "Quitaste 1 unidad de " + producto.titulo + " al carrito.",
    "#ff2d03c1"
  );
}
// SUMAR PRODUCTOS
function sumarProductoAlCarrito(index) {
  const producto = carrito[index];
  if (!producto) return;

  const claveStock = `stock-${producto.id}`;
  let stockActual = JSON.parse(localStorage.getItem(claveStock)) || 0;

  if (stockActual <= 0) {
    Swal.fire({
      title: "No hay más stock",
      text: "No quedan más unidades de " + producto.titulo,
      icon: "error",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Aceptar",
    });
    return;
  }

  producto.enCarrito += 1;
  localStorage.setItem(claveStock, JSON.stringify(stockActual - 1));
  localStorage.setItem("carrito", JSON.stringify(carrito));

  actualizarCarritoVisual();
  mostrarCarrito();

  mostrarMensaje(
    "Añadiste 1 unidad de " + producto.titulo + " al carrito.",
    "#2bff00c4"
  );
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
// OCULTAR BOTON FINALIZAR SI CARRITO ESTA VACIO
if (calcularTotal() <= 0) btnFinalizarCompra.style.display = "none";

btnFinalizarCompra.addEventListener("click", (e) => {
  window.location.href = "/pages/checkout.html";
});

actualizarCarritoVisual();
mostrarCarrito();
