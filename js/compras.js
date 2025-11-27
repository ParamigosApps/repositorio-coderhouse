// /js/compras.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { auth, db } from "./firebase.js";
import { obtenerFechaCompra, mostrarMensaje } from "./utils.js";
import { mostrarTodosLosPedidos } from "./pedidos.js";
import {
  addDoc,
  updateDoc,
  getDoc,
  doc,
  collection,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { generarCompraQr } from "./generarQr.js";

/* -------------------------------------------------------
   📌 RESERVAR STOCK (RESTAR AL CREAR PEDIDO PENDIENTE)
------------------------------------------------------- */
async function reservarStock(items) {
  try {
    for (const item of items) {
      const ref = doc(db, "catalogo", item.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) continue;

      const data = snap.data();
      const nuevoStock = (data.stock || 0) - item.enCarrito;

      if (nuevoStock < 0) {
        console.warn("❌ Stock insuficiente al reservar:", item.titulo);
        continue;
      }

      await updateDoc(ref, { stock: nuevoStock });
    }
  } catch (err) {
    console.error("❌ Error reservando stock:", err);
  }
}

/* -------------------------------------------------------
   📌 DEVOLVER STOCK (ÚTIL SI EL PEDIDO EXPIRA)
------------------------------------------------------- */
export async function devolverStock(items) {
  try {
    for (const item of items) {
      const ref = doc(db, "catalogo", item.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) continue;

      const data = snap.data();
      await updateDoc(ref, { stock: (data.stock || 0) + item.enCarrito });
    }
  } catch (err) {
    console.error("❌ Error devolviendo stock:", err);
  }
}

/* -------------------------------------------------------
   📌 CREAR PEDIDO (PENDIENTE o PAGADO)
   👉 RESTA STOCK si NO está pagado
   👉 Genera ticketId
------------------------------------------------------- */
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

  // Si el pedido es PENDIENTE → Reservar stock YA
  if (!pagado) {
    await reservarStock(carrito);
  }

  // Día + hora + 15 minutos
  const expiraEn = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await addDoc(collection(db, "compras"), {
    usuarioId,
    usuarioNombre,
    items: carrito,
    total,
    lugar,
    pagado,
    estado: pagado ? "pagado" : "pendiente",
    ticketId,
    usado: false,
    fecha: fechaCompra,
    expiraEn, // ⏳ PARA VENCIMIENTO
    creadoEn: serverTimestamp(),
  });

  return ticketId;
}

/* -------------------------------------------------------
   📌 MOSTRAR QR DE PEDIDO
------------------------------------------------------- */
export async function mostrarQrCompra({
  carrito,
  total,
  ticketId,
  lugar = "Tienda",
}) {
  if (!auth.currentUser) throw new Error("Usuario no logueado");

  const usuarioNombre = auth.currentUser.displayName || "Usuario";
  const fechaCompra = obtenerFechaCompra();

  await Swal.fire({
    title: "🧾 Tu ticket de compra",
    html: `
      <p><strong>Ticket:</strong> ${ticketId}</p>
      <p><strong>Cliente:</strong> ${usuarioNombre}</p>
      <p><strong>Lugar:</strong> ${lugar}</p>
      <p><strong>Fecha:</strong> ${fechaCompra}</p>
      <p><strong>Total:</strong> $${total}</p>
      <hr>
      <div id="qrCompraContainer" style="display:flex; justify-content:center;"></div>
    `,
    didOpen: async () => {
      const qrContainer = document.getElementById("qrCompraContainer");

      if (!qrContainer) return;

      try {
        await generarCompraQr({
          ticketId,
          contenido: `Compra:${ticketId}`,
          qrContainer,
          tamaño: 200,
          fecha: fechaCompra,
        });
      } catch (err) {
        console.error("❌ Error generando QR:", err);
      }
    },
    confirmButtonText: "Cerrar",
    customClass: { confirmButton: "btn btn-dark" },
    buttonsStyling: false,
  });

  mostrarTodosLosPedidos(auth.currentUser.uid);
}
