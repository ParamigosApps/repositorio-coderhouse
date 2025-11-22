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
 * Crear un pedido pendiente en Firestore
 */
export async function crearPedidoPendiente({
  carrito,
  total,
  lugar = "Tienda",
}) {
  if (!auth.currentUser) throw new Error("Usuario no logueado");
  const usuarioId = auth.currentUser.uid;
  const nombreUsuario = auth.currentUser.displayName || "Usuario";

  // Generar ticketId único
  const ticketId = `${Date.now()}-${Math.floor(Math.random() * 9999)}`;

  // Guardar en Firestore
  await addDoc(collection(db, "pedidosPendientes"), {
    usuarioId,
    nombreUsuario,
    carrito,
    total,
    estado: "pendiente",
    ticketId,
    creadoEn: serverTimestamp(),
  });

  return ticketId;
}

/**
 * Generar QR de compra
 */
export async function mostrarQrCompra({
  carrito,
  total,
  ticketId,
  lugar = "Tienda",
}) {
  if (!auth.currentUser) throw new Error("Usuario no logueado");
  const nombreUsuario = auth.currentUser.displayName || "Usuario";

  await Swal.fire({
    title: "🧾 Tu ticket de compra",
    html: `
      <p><strong>Ticket:</strong> ${ticketId}</p>
      <p><strong>Cliente:</strong> ${nombreUsuario}</p>
      <p><strong>Lugar:</strong> ${lugar}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(new Date())}</p>
      <p><strong>Total:</strong> $${total}</p>
      <hr>
      <div id="qrCompraContainer" style="display:flex;justify-content:center;"></div>
    `,
    didOpen: async () => {
      const qrContainer = document.getElementById("qrCompraContainer");
      await generarCompraQr({
        contenido: ticketId,
        qrContainer,
        tamaño: 200,
        modoLectura: true,
      });
    },
    confirmButtonText: "Cerrar",
    customClass: { confirmButton: "btn btn-dark" },
    buttonsStyling: false,
  });
}
