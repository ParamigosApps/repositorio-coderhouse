// /js/compras.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { auth, db } from "./firebase.js";
import { obtenerFechaCompra } from "./utils.js";
import { mostrarTodosLosPedidos } from "./pedidos.js";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { generarCompraQr } from "./generarQr.js";

/**
 * Crear un pedido en Firestore (pendiente o pagado)
 */
export async function crearPedido({
  carrito,
  total,
  lugar = "Tienda",
  pagado = false,
}) {
  if (!auth.currentUser) throw new Error("Usuario no logueado");

  const usuarioId = auth.currentUser.uid;
  const usuarioNombre = auth.currentUser.displayName || "Usuario";

  const ticketId = `${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  const fechaCompra = obtenerFechaCompra();

  await addDoc(collection(db, "compras"), {
    usuarioId,
    usuarioNombre,
    items: carrito,
    total,
    pagado,
    estado: pagado ? "pagado" : "pendiente",
    ticketId,
    usado: false,
    fecha: fechaCompra, // <-- GUARDADA EN DB
    creadoEn: serverTimestamp(),
  });

  return ticketId;
}

/**
 * Mostrar QR de compra
 */
export async function mostrarQrCompra({
  carrito,
  total,
  ticketId,
  lugar = "Tienda",
}) {
  if (!auth.currentUser) throw new Error("Usuario no logueado");

  const usuarioNombre = auth.currentUser.displayName || "Usuario";
  const fechaCompra = obtenerFechaCompra(); // <-- MISMA FECHA QUE EN EL TICKET

  await Swal.fire({
    title: "🧾 Tu ticket de compra",
    html: `
      <p><strong>Ticket:</strong> ${ticketId}</p>
      <p><strong>Cliente:</strong> ${usuarioNombre}</p>
      <p><strong>Lugar:</strong> ${lugar}</p>
      <p><strong>Fecha: </strong>${fechaCompra}</p>  
      <p><strong>Total:</strong> $${total}</p>
      <hr>
      <div id="qrCompraContainer" style="display:flex;justify-content:center;"></div>
    `,
    didOpen: async () => {
      const qrContainer = document.getElementById("qrCompraContainer"); // <-- FIX ID

      if (!qrContainer) return;

      try {
        await generarCompraQr({
          ticketId,
          contenido: `Compra:${ticketId}`,
          qrContainer, // <-- AHORA ENCUENTRA EL DIV CORRECTO
          tamaño: 200,
          fecha: fechaCompra, // <-- PASAMOS LA FECHA AL QR
        });
      } catch (err) {
        console.error("Error generando QR:", err);
      }
    },

    confirmButtonText: "Cerrar",
    customClass: { confirmButton: "btn btn-dark" },
    buttonsStyling: false,
  });

  mostrarTodosLosPedidos(auth.currentUser.uid);
}
