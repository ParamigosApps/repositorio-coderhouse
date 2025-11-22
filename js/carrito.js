// /js/carrito.js
/*
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
  if (!carritoItems) {
    console.log("No existe carritoItems en esta aina");
    return;
  }
  carritoItems.innerHTML = ""; // 🧽 limpiar render previo

  if (carrito.length === 0) {
    carritoItems.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-secondary py-3">
          Tu carrito está vacío 🛒
        </td>
      </tr>
    `;

    if (montoTotalCarrito) montoTotalCarrito.textContent = "$0";
    if (btnFinalizarCompra) btnFinalizarCompra.style.display = "none";
    return;
  }

  carrito.forEach((producto, index) => {
    const precioNumerico = Number(
      producto.precio.toString().replace(/\$/g, "").replace(/\./g, "")
    );
    const total = producto.enCarrito * precioNumerico;

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
        <div class="btn-group" role="group">
          <button class="btn btn-sm btn-danger" data-index="${index}">-</button>
          <button class="btn btn-sm btn-success" data-index="${index}">+</button>
        </div>
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

if (carritoItems) {
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
}
// ==================== VISUAL ====================
export function actualizarCarritoVisual() {
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
    gravity: "top",
    position: "center",
    duration: 2000,
    style: {
      background: "#fff",
      color: "#000",
      maxWidth: "300px",
      width: "100%",
      fontSize: "1rem",
    },
  }).showToast();
}

// ==================== INICIALIZAR ====================
mostrarCarrito();
actualizarCarritoVisual();

// ===================== CARRITO UI =====================

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
  document.getElementById("cerrarCarrito").blur();
  carritoPanel.setAttribute("aria-hidden", "true");
}

carritoIcono?.addEventListener("click", abrirCarrito);
carritoIcono?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") abrirCarrito();
});
cerrarCarrito?.addEventListener("click", cerrarPanel);
carritoOverlay?.addEventListener("click", cerrarPanel);

import { generarCompraQr } from "./generarQr.js";

export async function crearCompra(
  usuarioId,
  carrito,
  total,
  nombreUsuario = "Invitado"
) {
  try {
    // Creamos un documento en Firestore con toda la info del pedido
    const docRef = await addDoc(collection(db, "compras"), {
      usuarioId,
      usuarioNombre: nombreUsuario,
      items: carrito,
      total,
      fecha: new Date().toISOString(),
      usado: false, // para que la caja marque si ya se entregó
    });

    const ticketId = docRef.id;

    // Generamos el QR solo con el ticketId
    generarCompraQr({ ticketId, qrContainer: null });

    return ticketId;
  } catch (err) {
    console.error("Error creando compra:", err);
  }
}

async function guardarCompra(usuarioId, carrito) {
  const docRef = await addDoc(collection(db, "compras"), {
    usuarioId,
    carrito,
    fecha: new Date(),
    usado: false,
  });
  return docRef.id; // Este ID será el ticketId que pondrás en el QR
}

// CARRITOS CONFIRMADOS - PENDIENTES DE PAGAR O RETIRAR
const listaPedidos = document.getElementById("listaPedidos");

export async function mostrarPedidosConfirmados(usuarioId) {
  if (!listaPedidos) return;
  listaPedidos.innerHTML = "Cargando pedidos...";

  try {
    const pedidosSnap = await getDocs(collection(db, "compras"));
    const pedidos = [];

    pedidosSnap.forEach((docu) => {
      const data = docu.data();
      // Filtrar por usuario y solo los no usados (pendientes)
      if (data.usuarioId === usuarioId && !data.usado) {
        pedidos.push({ id: docu.id, ...data });
      }
    });

    if (pedidos.length === 0) {
      listaPedidos.innerHTML = `<p class="text-muted">No hay pedidos confirmados pendientes.</p>`;
      return;
    }

    listaPedidos.innerHTML = "";
    pedidos.forEach((pedido) => {
      const div = document.createElement("div");
      div.className = "pedido-confirmado p-3 mb-2 border rounded shadow-sm";

      div.innerHTML = `
        <p><strong>Pedido ID:</strong> ${pedido.id}</p>
        <p><strong>Total:</strong> $${pedido.total}</p>
        <p><strong>Productos:</strong></p>
        <ul>
          ${pedido.items
            .map((p) => `<li>${p.nombre} x${p.enCarrito} ($${p.precio})</li>`)
            .join("")}
        </ul>
        <button class="btn btn-sm btn-dark" id="btnQr-${
          pedido.id
        }">Ver QR</button>
      `;
      listaPedidos.appendChild(div);

      // Generar QR solo con el ticketId (evita overflow)
      document
        .getElementById(`btnQr-${pedido.id}`)
        .addEventListener("click", async () => {
          await generarCompraQr({
            carrito: pedido.items,
            usuarioId: pedido.usuarioId,
            nombreUsuario: pedido.usuarioNombre || "Invitado",
            lugar: "Tienda todovaper",
            total: pedido.total,
          });
        });
    });
  } catch (err) {
    console.error(err);
    listaPedidos.innerHTML = `<p class="text-danger">Error cargando pedidos.</p>`;
  }
}
*/

// carrito.js//// carrito.js
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
    carrito.push({ ...producto }); // clonamos para no modificar el objeto original
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

  // Opcional: si el usuario inicia sesión después
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await mostrarTodosLosPedidos(user.uid);
      console.log("se inicio sesion");
    }
  });
  mostrarCarrito();
  actualizarCarritoVisual();
  mostrarTodosLosPedidos();
});
