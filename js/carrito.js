// /js/carrito.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { mostrarMensaje } from "./utils.js";
import { mostrarTodosLosPedidos } from "./pedidos.js";
import { auth } from "./firebase.js";

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
const carritoItems = document.getElementById("carritoItems");
const contadorCarrito = document.getElementById("carritoContador");
const montoTotalCarrito = document.getElementById("MontoTotalCarrito");
const btnFinalizarCompra = document.getElementById("btn-comprar");
const carritoIcono = document.getElementById("carritoIcono");
const carritoPanel = document.getElementById("carritoPanel");
const carritoOverlay = document.getElementById("carritoOverlay");
const cerrarCarrito = document.getElementById("cerrarCarrito");

// ================= FUNCIONES =================
export function calcularTotal() {
  return carrito.reduce((total, producto) => {
    const precio = Number(
      producto.precio.toString().replace(/\$/g, "").replace(/\./g, "")
    );
    return total + precio * producto.enCarrito;
  }, 0);
}

export function mostrarCarrito() {
  if (!carritoItems) return;
  carritoItems.innerHTML = "";

  if (carrito.length === 0) {
    carritoItems.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Tu carrito está vacío 🛒</td></tr>`;
    if (montoTotalCarrito) montoTotalCarrito.textContent = "$0";
    if (btnFinalizarCompra) btnFinalizarCompra.style.display = "none";
    return;
  }

  carrito.forEach((producto, index) => {
    const precio = Number(
      producto.precio.toString().replace(/\$/g, "").replace(/\./g, "")
    );
    const total = producto.enCarrito * precio;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="d-flex align-items-center gap-2">
        <img src="${producto.imgSrc}" alt="${producto.nombre}" class="img-producto-carrito rounded" />
        <div class="producto-info d-flex flex-column">
          <strong class="nombre-producto">${producto.nombre}</strong>
          <span class="cantidad text-muted">Cantidad: ${producto.enCarrito}</span>
        </div>
      </td>
      <td class="text-center precio">$${producto.precio} x Unidad</td>
      <td class="text-center subtotal fw-bold">$${total}</td>
      <td class="text-center acciones">
        <div class="btn-group">
          <button class="btn btn-sm btn-danger" data-index="${index}">-</button>
          <button class="btn btn-sm btn-success" data-index="${index}">+</button>
        </div>
      </td>
    `;
    carritoItems.appendChild(row);
  });

  if (montoTotalCarrito) montoTotalCarrito.textContent = "$" + calcularTotal();
  if (btnFinalizarCompra)
    btnFinalizarCompra.style.display = carrito.length > 0 ? "block" : "none";
}

export function actualizarCarritoVisual() {
  carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  if (contadorCarrito) {
    contadorCarrito.textContent = carrito.reduce(
      (acc, p) => acc + p.enCarrito,
      0
    );
  }
}

// ==================== AGREGAR PRODUCTO ====================
export function agregarProducto(producto) {
  if (!producto) return;

  const productoExistente = carrito.find((p) => p.id === producto.id);
  const claveStock = `stock-${producto.id}`;
  let stockActual = JSON.parse(localStorage.getItem(claveStock)) || 0;

  const cantidadAAgregar = producto.enCarrito || 1;

  if (cantidadAAgregar > stockActual) {
    Swal.fire(
      "No hay suficiente stock",
      `Solo quedan ${stockActual} unidades de ${producto.nombre}`,
      "error"
    );
    return;
  }

  if (productoExistente) {
    productoExistente.enCarrito += cantidadAAgregar;
  } else {
    carrito.push({ ...producto });
  }

  stockActual -= cantidadAAgregar;
  localStorage.setItem("carrito", JSON.stringify(carrito));
  localStorage.setItem(claveStock, JSON.stringify(stockActual));

  mostrarCarrito();
  actualizarCarritoVisual();
  mostrarMensaje(
    `Añadiste ${cantidadAAgregar} unidad(es) de ${producto.nombre} al carrito`
  );
}

// ==================== SUMAR / QUITAR UNIDADES ====================
if (carritoItems) {
  carritoItems.addEventListener("click", (e) => {
    const index = Number(e.target.dataset.index);
    if (Number.isNaN(index)) return;
    const producto = carrito[index];
    if (!producto) return;

    const claveStock = `stock-${producto.id}`;
    let stockActual = JSON.parse(localStorage.getItem(claveStock)) || 0;

    if (e.target.classList.contains("btn-danger")) {
      if (producto.enCarrito === 1) carrito.splice(index, 1);
      else producto.enCarrito -= 1;

      stockActual += 1;
    } else if (e.target.classList.contains("btn-success")) {
      if (stockActual <= 0) {
        return Swal.fire(
          "No hay más stock",
          "No quedan más unidades de " + producto.nombre,
          "error"
        );
      }
      producto.enCarrito += 1;
      stockActual -= 1;
    }

    localStorage.setItem(claveStock, JSON.stringify(stockActual));
    localStorage.setItem("carrito", JSON.stringify(carrito));

    mostrarCarrito();
    actualizarCarritoVisual();
  });
}

// ================= UI carrito panel =================
export function abrirCarrito() {
  carritoPanel.classList.add("open");
  carritoOverlay.hidden = false;
}

export function cerrarPanel() {
  carritoPanel.classList.remove("open");
  carritoOverlay.hidden = true;
}

// ================= EVENTOS =================
carritoIcono?.addEventListener("click", abrirCarrito);
carritoOverlay?.addEventListener("click", cerrarPanel);
cerrarCarrito?.addEventListener("click", cerrarPanel);

// ================= INICIALIZAR =================
export { carrito };
document.addEventListener("DOMContentLoaded", async () => {
  if (auth.currentUser) {
    await mostrarTodosLosPedidos(auth.currentUser.uid);
  }

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await mostrarTodosLosPedidos(user.uid);
    }
  });

  mostrarCarrito();
  actualizarCarritoVisual();
});
