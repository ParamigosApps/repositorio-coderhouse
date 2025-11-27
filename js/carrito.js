// /js/carrito.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { auth } from "./firebase.js";
import { crearPedido } from "./compras.js";
import { mostrarTodosLosPedidos, obtenerPedidosPorEstado } from "./pedidos.js";

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// DOM
const carritoItems = document.getElementById("carritoItemsMensaje");
const contadorCarrito = document.getElementById("carritoContador");
const montoTotalCarrito = document.getElementById("MontoTotalCarrito");
const btnFinalizarCompra = document.getElementById("btnConfirmarPedido");
const carritoIcono = document.getElementById("carritoIcono");
const carritoPanel = document.getElementById("carritoPanel");
const carritoOverlay = document.getElementById("carritoOverlay");
const cerrarCarrito = document.getElementById("cerrarCarrito");

// Hacerlos accesibles desde otros módulos (cargarCatalogo.js)
window.carritoPanel = carritoPanel;
window.carritoOverlay = carritoOverlay;

/* -------------------------------------------------------
   📌 CALCULAR TOTAL
------------------------------------------------------- */
export function calcularTotal() {
  return carrito.reduce((total, producto) => {
    const precio = Number(
      producto.precio.toString().replace(/\$/g, "").replace(/\./g, "")
    );
    return total + precio * producto.enCarrito;
  }, 0);
}

/* -------------------------------------------------------
   📌 MOSTRAR CARRITO
------------------------------------------------------- */
export async function mostrarCarrito() {
  if (!carritoItems) return;

  carritoItems.innerHTML = "";

  if (carrito.length === 0) {
    carritoItems.innerHTML = `Tu carrito está vacío 🛒.`;
    if (montoTotalCarrito) montoTotalCarrito.textContent = "$0";
    if (btnFinalizarCompra) btnFinalizarCompra.style.display = "none";

    // Mensaje extra si tiene pedidos QR generados
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const resultado = await qrPendientesEnCarrito(uid);

      if (resultado && resultado.qrGenerados > 0) {
        carritoItems.innerHTML = `Tu carrito está vacío 🛒. ¡Tienes pedidos QR generados!`;
      }
    }

    return;
  }

  carrito.forEach((producto, index) => {
    const precio = Number(
      producto.precio.toString().replace(/\$/g, "").replace(/\./g, "")
    );
    const total = producto.enCarrito * precio;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="d-flex align-items-center">
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
          <button class="btn btn-sm btn-resta" data-index="${index}">-</button>
          <button class="btn btn-sm btn-success btn-suma" data-index="${index}">+</button>
        </div>
      </td>
    `;
    carritoItems.appendChild(row);
  });

  if (montoTotalCarrito) montoTotalCarrito.textContent = "$" + calcularTotal();
  if (btnFinalizarCompra)
    btnFinalizarCompra.style.display = carrito.length > 0 ? "block" : "none";
}

/* -------------------------------------------------------
   📌 ACTUALIZAR BURBUJA DEL CARRITO
------------------------------------------------------- */
export function actualizarCarritoVisual() {
  carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  if (contadorCarrito) {
    contadorCarrito.textContent = carrito.reduce(
      (acc, p) => acc + p.enCarrito,
      0
    );
  }
}

/* -------------------------------------------------------
   📌 AGREGAR PRODUCTO DESDE EL CATÁLOGO
   👉 Respeta stock REAL (producto.stock)
------------------------------------------------------- */
export function agregarProducto(producto) {
  if (!producto) return;

  const existente = carrito.find((p) => p.id === producto.id);
  const cantidadAAgregar = producto.enCarrito || 1;
  const stockDisponible = producto.stock ?? Infinity;
  const cantidadActual = existente ? existente.enCarrito : 0;

  if (cantidadActual + cantidadAAgregar > stockDisponible) {
    Swal.fire(
      "No hay suficiente stock",
      `Solo quedan ${stockDisponible - cantidadActual} unidades de ${
        producto.nombre
      }`,
      "error"
    );
    return;
  }

  if (existente) {
    existente.enCarrito += cantidadAAgregar;
  } else {
    carrito.push({ ...producto });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  mostrarCarrito();
  actualizarCarritoVisual();
}

/* -------------------------------------------------------
   📌 SUMAR / RESTAR DESDE LA TABLA
------------------------------------------------------- */
if (carritoItems) {
  carritoItems.addEventListener("click", (e) => {
    const index = Number(e.target.dataset.index);
    if (Number.isNaN(index)) return;

    const producto = carrito[index];
    if (!producto) return;

    // ---- RESTAR ----
    if (e.target.classList.contains("btn-resta")) {
      if (producto.enCarrito === 1) {
        carrito.splice(index, 1);

        Toastify({
          text: `Eliminaste ${producto.nombre} del carrito`,
          duration: 2000,
          gravity: "bottom",
          position: "center",
          style: {
            background: "#ee0202db",
            width: "80%",
            margin: "0 auto",
            textAlign: "center",
          },
        }).showToast();
      } else {
        producto.enCarrito -= 1;

        Toastify({
          text: `Quitaste una unidad de ${producto.nombre}`,
          duration: 1500,
          gravity: "bottom",
          position: "center",
          style: {
            background: "#ee0202db",
            width: "80%",
            margin: "0 auto",
            textAlign: "center",
          },
        }).showToast();
      }
    }

    // ---- SUMAR ----
    if (e.target.classList.contains("btn-suma")) {
      if (producto.enCarrito >= (producto.stock ?? Infinity)) {
        Swal.fire(
          "No hay más stock",
          "No quedan más unidades de " + producto.nombre,
          "error"
        );
        return;
      }

      producto.enCarrito += 1;

      Toastify({
        text: `Añadiste una unidad más de ${producto.nombre}`,
        duration: 1500,
        gravity: "bottom",
        position: "center",
        style: {
          background: "#1e88e5",
          width: "80%",
          margin: "0 auto",
          textAlign: "center",
        },
      }).showToast();
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    mostrarCarrito();
    actualizarCarritoVisual();
  });
}

/* -------------------------------------------------------
   📌 ABRIR / CERRAR PANEL DE CARRITO
------------------------------------------------------- */
export function abrirCarrito() {
  if (!carritoPanel || !carritoOverlay) return;
  carritoPanel.classList.add("open");
  carritoOverlay.hidden = false;
}

export function cerrarPanel() {
  if (!carritoPanel || !carritoOverlay) return;
  carritoPanel.classList.remove("open");
  carritoOverlay.hidden = true;
}

carritoIcono?.addEventListener("click", abrirCarrito);
carritoOverlay?.addEventListener("click", cerrarPanel);
cerrarCarrito?.addEventListener("click", cerrarPanel);

/* -------------------------------------------------------
   📌 CONSULTAR SI TIENE QR GENERADOS (pagados o pendientes)
------------------------------------------------------- */
export async function qrPendientesEnCarrito(usuarioId) {
  if (!usuarioId) {
    console.warn("❌ qrPendientesEnCarrito: usuarioId es undefined");
    return { qrGenerados: 0 };
  }

  try {
    const pedidosPagos = await obtenerPedidosPorEstado(usuarioId, "pagado");
    const pedidosPendientes = await obtenerPedidosPorEstado(
      usuarioId,
      "pendiente"
    );

    const valor = pedidosPagos.length + pedidosPendientes.length;
    return { qrGenerados: valor };
  } catch (err) {
    console.error("❌ Error en qrPendientesEnCarrito:", err);
    return { qrGenerados: 0 };
  }
}

/* -------------------------------------------------------
   📌 INICIALIZAR
------------------------------------------------------- */
export { carrito };

document.addEventListener("DOMContentLoaded", () => {
  mostrarCarrito();
  actualizarCarritoVisual();

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await mostrarTodosLosPedidos(user.uid);
      await mostrarCarrito();
    }
  });
});
