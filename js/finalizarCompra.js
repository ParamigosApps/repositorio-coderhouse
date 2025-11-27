// /js/finalizarCompra.js
import {
  mostrarCarrito,
  actualizarCarritoVisual,
  calcularTotal,
} from "./carrito.js";

import { auth } from "./firebase.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

// ⚠️ UN SOLO crearPedido → el correcto
import { crearPedido, mostrarQrCompra } from "./compras.js";

import {
  actualizarContadoresPedidos,
  mostrarTodosLosPedidos,
  obtenerPedidosPorEstado,
} from "./pedidos.js";

import { crearPreferenciaCompra } from "./mercadopago.js";

export async function finalizarCompra() {
  try {
    // =====================================================
    // VALIDAR LOGIN
    // =====================================================
    if (!auth.currentUser) {
      const { value: confirmacion } = await Swal.fire({
        title: "Debes iniciar sesión",
        text: "Solo los usuarios con Google Sign-In pueden comprar.",
        icon: "warning",
        confirmButtonText: "Iniciar sesión",
        customClass: { confirmButton: "btn btn-dark" },
        buttonsStyling: false,
      });

      if (confirmacion === true) {
        const usuarioCollapseEl = document.getElementById("collapseUsuario");
        new bootstrap.Collapse(usuarioCollapseEl, { toggle: true });
        usuarioCollapseEl.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        document.getElementById("carritoPanel")?.classList.remove("open");
        document.getElementById("carritoOverlay")?.setAttribute("hidden", true);
      }
      return;
    }

    // =====================================================
    // VALIDAR CARRITO
    // =====================================================
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    if (carrito.length === 0) {
      return Swal.fire("Carrito vacío", "Agrega productos primero", "info");
    }

    const total = calcularTotal();
    const usuarioId = auth.currentUser.uid;

    // =====================================================
    // ⚠️ VALIDAR LÍMITE DE PEDIDOS *ANTES DE MOSTRAR EL SWAL*
    // =====================================================
    const pendientes = await obtenerPedidosPorEstado(usuarioId, "pendiente");

    if (pendientes.length >= 3) {
      return Swal.fire({
        title: "No puedes generar más pedidos",
        html: `
          <p>Ya tienes <strong>3 pedidos pendientes</strong>.</p>
          <p>Debes pagar o eliminar alguno antes de crear otro.</p>
        `,
        icon: "warning",
        confirmButtonText: "Aceptar",
        customClass: { confirmButton: "btn btn-dark" },
        buttonsStyling: false,
      });
    }

    // =====================================================
    // ELECCIÓN DE MÉTODO DE PAGO
    // =====================================================
    const { isConfirmed, isDenied, isDismissed } = await Swal.fire({
      title: "Finalizar compra",
      html: `<p>Total a pagar: <strong>$${total}</strong></p>`,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Mercado Pago",
      denyButtonText: "Pago en caja",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: "btn btn-success",
        denyButton: "btn btn-dark",
        cancelButton: "btn btn-secondary",
      },
      buttonsStyling: false,
    });

    if (isDismissed) return;

    // =====================================================
    // 🔵 PAGO EN CAJA (pendiente)
    // =====================================================
    if (isDenied) {
      const ticketId = await crearPedido({
        carrito,
        total,
        lugar: "Tienda",
        pagado: false,
      });

      // No debería pasar nunca, pero lo dejo por seguridad
      if (!ticketId) {
        return Swal.fire({
          title: "No puedes generar más pedidos",
          html: `
            <p>Ya tienes <strong>3 pedidos pendientes</strong>.</p>
            <p>Debes pagar o eliminar alguno antes de crear otro.</p>
          `,
          icon: "warning",
          confirmButtonText: "Aceptar",
          customClass: { confirmButton: "btn btn-dark" },
          buttonsStyling: false,
        });
      }

      await mostrarQrCompra({ carrito, total, ticketId, lugar: "Tienda" });

      localStorage.removeItem("carrito");
      actualizarCarritoVisual();
      mostrarCarrito();

      mostrarTodosLosPedidos(auth.currentUser.uid);
      actualizarContadoresPedidos(auth.currentUser.uid);

      return;
    }

    // =====================================================
    // 🟢 MERCADO PAGO (pagado)
    // =====================================================
    if (isConfirmed) {
      const ticketId = await crearPedido({
        carrito,
        total,
        lugar: "Tienda",
        pagado: true,
      });

      if (!ticketId) {
        return Swal.fire({
          title: "No puedes generar más pedidos",
          html: `
            <p>Ya tienes <strong>3 pedidos pendientes</strong>.</p>
            <p>Debes pagar o eliminar alguno antes de crear otro.</p>
          `,
          icon: "warning",
          confirmButtonText: "Aceptar",
          customClass: { confirmButton: "btn btn-dark" },
          buttonsStyling: false,
        });
      }

      const initPoint = await crearPreferenciaCompra({ carrito, ticketId });

      if (!initPoint) {
        return Swal.fire("Error", "No se pudo iniciar el pago.", "error");
      }

      localStorage.removeItem("carrito");
      actualizarCarritoVisual();
      mostrarCarrito();

      window.location.href = initPoint;
    }
  } catch (err) {
    console.error("❌ Error:", err);
    Swal.fire("Error", "Ocurrió un error al procesar la compra.", "error");
  }
}

// Botón
document
  .getElementById("btnConfirmarPedido")
  ?.addEventListener("click", finalizarCompra);
