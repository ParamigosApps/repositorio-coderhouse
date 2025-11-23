// /js/compras.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { auth, db } from "./firebase.js";
import { formatearFecha } from "./utils.js";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { generarCompraQr } from "./generarQr.js";

/**
 * Crear un pedido en Firestore (pendiente o pagado)
 * @param {Array} carrito - Lista de productos
 * @param {number} total - Total de la compra
 * @param {string} lugar - Lugar de la compra
 * @param {boolean} pagado - true si fue pago online, false si es en caja
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

  // Generar ticketId único
  const ticketId = `${Date.now()}-${Math.floor(Math.random() * 9999)}`;

  // Guardar en Firestore en la colección "compras"
  await addDoc(collection(db, "compras"), {
    usuarioId,
    usuarioNombre,
    items: carrito,
    total,
    pagado, // true o false
    estado: pagado ? "pagado" : "pendiente",
    ticketId,
    usado: false,
    creadoEn: serverTimestamp(),
  });

  return ticketId;
}

/**
 * Mostrar QR de compra
 * @param {Array} carrito - Productos del pedido
 * @param {number} total - Total del pedido
 * @param {string} ticketId - ID del ticket
 * @param {string} lugar - Lugar de la compra
 */
export async function mostrarQrCompra({
  carrito,
  total,
  ticketId,
  lugar = "Tienda",
}) {
  if (!auth.currentUser) throw new Error("Usuario no logueado");
  const usuarioNombre = auth.currentUser.displayName || "Usuario";

  await Swal.fire({
    title: "🧾 Tu ticket de compra",
    html: `
      <p><strong>Ticket:</strong> ${ticketId}</p>
      <p><strong>Cliente:</strong> ${usuarioNombre}</p>
      <p><strong>Lugar:</strong> ${lugar}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(new Date())}</p>
      <p><strong>Total:</strong> $${total}</p>
      <hr>
      <div id="qrCompraContainer" style="display:flex;justify-content:center;"></div>
    `,
    didOpen: async () => {
      const qrContainer = document.getElementById("qrContainer"); // Contenedor real
      if (!qrContainer) return;

      try {
        await generarCompraQr({
          ticketId,
          contenido: `Compra:${ticketId}`, // opcional, poner prefijo como en entradas
          qrContainer,
          tamaño: 200,
        });
      } catch (err) {
        console.error("Error generando QR:", err);
      }
    },

    confirmButtonText: "Cerrar",
    customClass: { confirmButton: "btn btn-dark" },
    buttonsStyling: false,
  });
}
