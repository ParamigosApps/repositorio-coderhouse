// /js/finalizarCompra.js
import {
  mostrarCarrito,
  actualizarCarritoVisual,
  calcularTotal,
} from "./carrito.js";

import { auth } from "./firebase.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

import { crearPedido } from "./pedidos.js";
import { mostrarQrCompra } from "./compras.js";

import {
  actualizarContadoresPedidos,
  mostrarTodosLosPedidos,
} from "./pedidos.js";
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

    // =====================================================
    // SELECCIÓN DE MÉTODO DE PAGO
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
    // PAGO EN CAJA
    // =====================================================
    if (isDenied) {
      const ticketId = await crearPedido({
        carrito,
        total,
        lugar: "Tienda",
        pagado: false,
      });

      // ❌ No pudo crear pedido (tiene 3 pendientes)
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

      // Mostrar QR solo si ticketId es válido
      await mostrarQrCompra({ carrito, total, ticketId, lugar: "Tienda" });

      // Limpiar carrito
      localStorage.removeItem("carrito");

      actualizarCarritoVisual();
      mostrarCarrito();
      mostrarTodosLosPedidos(auth.currentUser.uid);
      actualizarContadoresPedidos(auth.currentUser.uid);

      return;
    }

    // =====================================================
    // MERCADO PAGO
    // =====================================================
    if (isConfirmed) {
      const ticketId = await crearPedido({
        carrito,
        total,
        lugar: "Tienda",
        pagado: true,
      });

      // ❌ Límite alcanzado → cancelar flujo
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

      // Crear preferencia MP
      const res = await fetch("/api/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: carrito.map((p) => ({
            title: p.nombre,
            quantity: p.enCarrito,
            price: Number(p.precio),
            usuarioId: auth.currentUser.uid,
            productoId: p.id,
          })),
          ticketId,
        }),
      });

      const data = await res.json();

      if (!data.init_point)
        return Swal.fire("Error", "No se pudo iniciar el pago.", "error");

      window.location.href = data.init_point;
    }
  } catch (err) {
    console.error("❌ Error:", err);
    Swal.fire("Error", "Ocurrió un error al procesar la compra.", "error");
  }
}

// ================= EVENTO BOTÓN =================
document
  .getElementById("btnConfirmarPedido")
  ?.addEventListener("click", finalizarCompra);
