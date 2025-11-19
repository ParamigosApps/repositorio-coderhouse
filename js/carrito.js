// /js/carrito.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

const carritoItems = document.getElementById("carritoItems");
let contadorCarrito = document.getElementById("carritoContador");
const montoTotalCarrito = document.getElementById("MontoTotalCarrito");
const btnFinalizarCompra = document.getElementById("btn-comprar");
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// ==================== FUNCIONES ====================
export function calcularTotal() {
  let totalCarrito = 0;
  carrito.forEach((producto) => {
    const precioNumerico = Number(
      producto.precio.toString().replace(/\$/g, "").replace(/\./g, "")
    );
    totalCarrito += producto.enCarrito * precioNumerico;
  });
  return totalCarrito;
}

export function mostrarCarrito() {
  carritoItems.innerHTML = "";
  carrito.forEach((producto, index) => {
    const precioNumerico = Number(
      producto.precio.toString().replace(/\$/g, "").replace(/\./g, "")
    );
    const total = producto.enCarrito * precioNumerico;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="text-start">
        <img src="${producto.imgSrc}" alt="${producto.nombre}" class="img-producto-carrito" />
        ${producto.nombre}
      </td>
      <td>${producto.enCarrito}</td>
      <td class="precioUnitarioProducto">${producto.precio}</td>
      <td class="subtotalProducto">$${total}</td>
      <td>
        <button class="btn btn-success btn-sm" data-index="${index}">+</button>
        <button class="btn btn-danger btn-sm" data-index="${index}">-</button>
      </td>
    `;
    carritoItems.appendChild(row);
  });

  if (montoTotalCarrito) {
    montoTotalCarrito.textContent = "$" + calcularTotal();
  }

  if (btnFinalizarCompra) {
    btnFinalizarCompra.style.display = carrito.length > 0 ? "block" : "none";
  }
}

// ==================== AGREGAR PRODUCTOS ====================
export function agregarProductoCarrito(producto) {
  if (!producto) return;

  let productoEnCarrito = carrito.find((p) => p.id === producto.id);

  const claveStock = `stock-${producto.id}`;
  let stockActual = JSON.parse(localStorage.getItem(claveStock)) || 0;

  if (stockActual <= 0) {
    Swal.fire({
      title: "No hay más stock",
      text: "No quedan más unidades de " + producto.nombre,
      icon: "error",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Aceptar",
    });
    return;
  }

  if (productoEnCarrito) {
    productoEnCarrito.enCarrito += 1;
  } else {
    producto.enCarrito = 1;
    carrito.push(producto);
  }

  localStorage.setItem(claveStock, JSON.stringify(stockActual - 1));
  localStorage.setItem("carrito", JSON.stringify(carrito));

  mostrarCarrito();
  actualizarCarritoVisual();
  mostrarMensaje(`Añadiste 1 unidad de ${producto.nombre} al carrito`);
}

// ==================== SUMAR / QUITAR UNIDADES ====================
carritoItems.addEventListener("click", (e) => {
  const index = Number(e.target.dataset.index);
  if (Number.isNaN(index)) return;
  const producto = carrito[index];
  if (!producto) return;

  const claveStock = `stock-${producto.id}`;
  let stockActual = JSON.parse(localStorage.getItem(claveStock)) || 0;

  if (e.target.classList.contains("btn-danger")) {
    if (producto.enCarrito === 1) {
      Swal.fire({
        title: "¿Estás seguro?",
        text: "Se quitará del carrito " + producto.nombre,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          carrito.splice(index, 1);
          localStorage.setItem(claveStock, JSON.stringify(stockActual + 1));
          localStorage.setItem("carrito", JSON.stringify(carrito));
          mostrarCarrito();
          actualizarCarritoVisual();
          mostrarMensaje(`Quitaste ${producto.nombre} del carrito`);
        }
      });
    } else {
      producto.enCarrito -= 1;
      localStorage.setItem(claveStock, JSON.stringify(stockActual + 1));
      localStorage.setItem("carrito", JSON.stringify(carrito));
      mostrarCarrito();
      actualizarCarritoVisual();
      mostrarMensaje(`Quitaste 1 unidad de ${producto.nombre} del carrito`);
    }
  } else if (e.target.classList.contains("btn-success")) {
    if (stockActual <= 0) {
      Swal.fire({
        title: "No hay más stock",
        text: "No quedan más unidades de " + producto.nombre,
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Aceptar",
      });
      return;
    }
    producto.enCarrito += 1;
    localStorage.setItem(claveStock, JSON.stringify(stockActual - 1));
    localStorage.setItem("carrito", JSON.stringify(carrito));
    mostrarCarrito();
    actualizarCarritoVisual();
    mostrarMensaje(`Añadiste 1 unidad de ${producto.nombre} al carrito`);
  }
});

// ==================== VISUAL ====================
function actualizarCarritoVisual() {
  let imgCarrito = document.getElementById("img-carrito");
  carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  if (contadorCarrito) {
    contadorCarrito.textContent = carrito.reduce(
      (acc, item) => acc + item.enCarrito,
      0
    );
  }

  if (!imgCarrito) return;

  if (carrito.length > 0) {
    //imgCarrito.classList.add("con-productos");
  } else {
    //imgCarrito.classList.remove("con-productos");
  }
}

// ==================== NOTIFICACIONES ====================
function mostrarMensaje(mensaje) {
  Toastify({
    text: mensaje,
    gravity: "bottom",
    position: "center",
    duration: 2500,
    style: { background: "#000", color: "#fff" },
  }).showToast();
}

// ==================== INICIALIZAR ====================
mostrarCarrito();
actualizarCarritoVisual();

// ===================== CARRITO UI

const carritoIcono = document.getElementById("carritoIcono");
const carritoPanel = document.getElementById("carritoPanel");
const carritoOverlay = document.getElementById("carritoOverlay");
const cerrarCarrito = document.getElementById("cerrarCarrito");

function abrirCarrito() {
  carritoPanel.classList.add("open");
  carritoOverlay.hidden = false;
  carritoPanel.setAttribute("aria-hidden", "false");
}
function cerrarPanel() {
  carritoPanel.classList.remove("open");
  carritoOverlay.hidden = true;
  carritoPanel.setAttribute("aria-hidden", "true");
}

carritoIcono?.addEventListener("click", abrirCarrito);
carritoIcono?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") abrirCarrito();
});
cerrarCarrito?.addEventListener("click", cerrarPanel);
carritoOverlay?.addEventListener("click", cerrarPanel);
