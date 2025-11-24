// /js/finalizarCompra.js
import {
  mostrarCarrito,
  actualizarCarritoVisual,
  calcularTotal,
} from "./carrito.js";
import { auth } from "./firebase.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { crearPedido, mostrarQrCompra } from "./compras.js"; // <-- ahora usamos crearPedido unificado
import { mostrarTodosLosPedidos } from "./pedidos.js";

export async function finalizarCompra() {
  try {
    // Validar login
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

    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    if (carrito.length === 0) {
      return Swal.fire("Carrito vacío", "Agrega productos primero", "info");
    }

    const total = calcularTotal();

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

    // ================= PAGO EN CAJA =================
    if (isDenied) {
      // Guardar pedido en "compras" con pagado: false
      const ticketId = await crearPedido({
        carrito,
        total,
        lugar: "Tienda",
        pagado: false,
      });

      // Mostrar QR
      await mostrarQrCompra({ carrito, total, ticketId, lugar: "Tienda" });

      // Limpiar carrito
      localStorage.removeItem("carrito");
      actualizarCarritoVisual();
      mostrarCarrito();
      mostrarTodosLosPedidos(auth.currentUser.uid);
      //document.getElementById("carritoPanel")?.classList.remove("open");
      //document.getElementById("carritoOverlay")?.setAttribute("hidden", true);
      return;
    }

    // ================= MERCADO PAGO =================
    if (isConfirmed) {
      // Primero creamos el pedido con pagado: true
      const ticketId = await crearPedido({
        carrito,
        total,
        lugar: "Tienda",
        pagado: true,
      });

      // Crear preferencia en backend
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
          ticketId, // pasamos el ticketId al backend por si hace falta
        }),
      });

      const data = await res.json();
      if (!data.init_point)
        return Swal.fire("Error", "No se pudo iniciar el pago.", "error");

      // Redirigir a Mercado Pago
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
