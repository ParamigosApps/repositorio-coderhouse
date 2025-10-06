const carritoItems = document.getElementById("carrito-items");
const montoTotalCarrito = document.getElementById("MontoTotalCarrito");
const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
carritoItems.innerHTML = "";

function calcularTotal() {
  const subtotales = Array.from(
    document.getElementsByClassName("subtotalProducto")
  );
  let totalCarrito = 0;
  subtotales.forEach((td) => {
    const valor = parseInt(td.textContent.replace("$", "").replace(".", ""));
    totalCarrito += valor;
  });
  console.log("Total calculado:", totalCarrito);
  return totalCarrito;
}

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

// ELIMINAR PRODUCTOS
carritoItems.addEventListener("click", (e) => {
  const index = e.target.dataset.index;
  let producto = carrito[index];
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
            quitarProductoDelCarrito(producto);
          });
        }
      });
      // SI HAY MÁS DE 1 UNIDAD EN EL CARRITO
    } else if (producto.enCarrito > 1) QuitarUnidadDelCarrito(producto);

    // AÑADIR 1 UNIDAD AL CARRITO
  } else if (e.target.classList.contains("btn-success")) {
    sumarProductoAlCarrito(producto, index);
    console.log("Producto a sumar: ", producto);
    console.log("Índice del producto: ", index);
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
function quitarProductoDelCarrito(productoAEliminar, index) {
  let stockActual = JSON.parse(
    localStorage.getItem(`stock-${productoAEliminar.id}`)
  );

  localStorage.setItem(
    `stock-${productoAEliminar.id}`,
    JSON.stringify(stockActual + productoAEliminar.enCarrito)
  );

  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  location.reload();
}
// QUITAR 1 UNIDAD DEL CARRITO
function QuitarUnidadDelCarrito(productoAReducir, index) {
  let stockActual = JSON.parse(
    localStorage.getItem(`stock-${productoAReducir.id}`)
  );

  localStorage.setItem(
    `stock-${productoAReducir.id}`,
    JSON.stringify(stockActual + 1)
  );
  productoAReducir.enCarrito -= 1;
  localStorage.setItem("carrito", JSON.stringify(carrito));
  location.reload();
}
// SUMAR PRODUCTOS
function sumarProductoAlCarrito(producto, index) {
  let stockActual =
    JSON.parse(localStorage.getItem(`stock-${producto.id}`)) || 0;

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

  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  carrito = carrito.map((item) => {
    if (item.id === producto.id) {
      producto.enCarrito += 1;
      return { ...item, enCarrito: producto.enCarrito };
    }
    return item;
  });
  localStorage.setItem(`stock-${producto.id}`, JSON.stringify(stockActual - 1));
  localStorage.setItem("carrito", JSON.stringify(carrito));
  mostrarMensaje(
    "Añadiste una unidad más de" + producto.titulo + " al carrito.",
    "#2bff00c4" // AL RECARGAR LA PAGINA NO SE MUESTRA ESTE MSJ. VER SOLUCION
  );
  actualizarCarritoVisual();
  location.reload();
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
