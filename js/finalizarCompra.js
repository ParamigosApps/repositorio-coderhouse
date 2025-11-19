import { generarTicketQr } from "./generarQr.js";
import { actualizarCarritoVisual, mostrarCarrito } from "./carrito.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { auth } from "./firebase.js";

export async function finalizarCompra() {
  try {
    // --------------------------- VALIDAR LOGIN ---------------------------
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
        return;
      }
    }

    const usuarioId = auth.currentUser.uid;
    const nombreUsuario = auth.currentUser.displayName || "Usuario";

    // --------------------------- OBTENER CARRITO ---------------------------
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    if (carrito.length === 0) {
      return Swal.fire("Carrito vacío", "Agrega productos primero", "info");
    }

    const total = carrito.reduce(
      (acc, p) => acc + Number(p.precio) * p.enCarrito,
      0
    );

    // --------------------------- ELEGIR MÉTODO DE PAGO ---------------------------
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

    // --------------------------- PAGO EN CAJA ---------------------------

    if (isDenied) {
      await generarTicketQr({
        carrito,
        usuarioId,
        nombreUsuario,
        lugar: "Tienda",
        total,
      });

      // Limpiar carrito y cerrar panel
      localStorage.removeItem("carrito");
      actualizarCarritoVisual();
      mostrarCarrito();

      document.getElementById("carritoPanel")?.classList.remove("open");
      document.getElementById("carritoOverlay")?.setAttribute("hidden", true);

      return; // El modal del QR se muestra desde generarQr
    }

    // --------------------------- MERCADO PAGO ---------------------------
    if (isConfirmed) {
      const res = await fetch("/api/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: carrito.map((p) => ({
            title: p.nombre,
            quantity: p.enCarrito,
            price: Number(p.precio),
            usuarioId,
            productoId: p.id,
          })),
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

document
  .getElementById("btnPagarCarrito")
  ?.addEventListener("click", finalizarCompra);
