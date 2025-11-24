// /js/pedidos.js
import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { generarCompraQr } from "./generarQr.js";

export async function obtenerPedidosPorUsuario(usuarioId) {
  const pedidos = [];
  const querySnap = await getDocs(collection(db, "compras"));

  querySnap.forEach((doc) => {
    const data = doc.data();
    if (data.usuarioId === usuarioId) {
      pedidos.push({
        id: doc.id,
        ...data,
        fecha: data.fecha,
      });
    }
  });

  // Ordenar por fecha descendente
  pedidos.sort((a, b) => b.fecha - a.fecha);

  return pedidos;
}

export async function mostrarTodosLosPedidos(usuarioId) {
  if (!usuarioId) return;

  const contPendientes = document.getElementById("listaPedidosPendientes");
  const contPagos = document.getElementById("listaPedidosPagos");
  const contRetirados = document.getElementById("listaPedidosRetirados");

  if (contPendientes || contPagos || contRetirados) {
    const pedidos = await obtenerPedidosPorUsuario(usuarioId);

    const pendientes = pedidos.filter((p) => p.estado === "pendiente");
    const pagados = pedidos.filter((p) => p.estado === "pagado");
    const retirados = pedidos.filter((p) => p.estado === "retirado");

    mostrarPedidosUI(contPendientes, pendientes);
    mostrarPedidosUI(contPagos, pagados);
    mostrarPedidosUI(contRetirados, retirados);
  }
}

function mostrarPedidosUI(contenedor, pedidos) {
  contenedor.innerHTML = "";
  let estado = "";

  if (contenedor.id === "listaPedidosPendientes") estado = "Pendientes de pago";
  else if (contenedor.id === "listaPedidosPagos") estado = "Pagados";
  else if (contenedor.id === "listaPedidosRetirados") estado = "Retirados";

  if (pedidos.length === 0) {
    contenedor.innerHTML = `<p class="text-muted text-center">No tienes pedidos <strong>${estado}</strong></p>`;
    return;
  }

  pedidos.forEach((pedido) => {
    const div = document.createElement("div");
    div.className = "pedido-item p-2 mb-2 rounded position-relative";
    div.style.backgroundColor =
      pedido.estado === "pagado"
        ? "#d4edda"
        : pedido.estado === "pendiente"
        ? "#fff3cd"
        : "#f8d7da";

    div.innerHTML = `
      <strong>ID:</strong> ${pedido.id}<br>
      <strong>Total:</strong> $${pedido.total}<br>
      <strong>Fecha:</strong> ${pedido.fecha}<br>
      <strong>Estado:</strong> ${pedido.estado}<br>
      <button class="btn btn-sm btn-dark mt-2 ver-qr">Ver QR</button>
      <div class="detalles-pedido" style="display:none;margin-top:10px;"></div>
      <button class="btn btn-sm btn-danger position-absolute top-0 end-0">X</button>
    `;

    // Botón eliminar
    div.querySelector(".btn-danger").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("¿Eliminar este pedido?")) return;
      await deleteDoc(doc(db, "compras", pedido.id));
      div.remove();
      mostrarTodosLosPedidos(auth.currentUser.uid);
    });

    // Toggle detalles
    div.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("ver-qr") ||
        e.target.classList.contains("btn-danger")
      )
        return;
      const detalles = div.querySelector(".detalles-pedido");
      detalles.style.display =
        detalles.style.display === "none" ? "block" : "none";
    });

    // Ver QR
    div.querySelector(".ver-qr").addEventListener("click", (e) => {
      e.stopPropagation();
      generarCompraQr({
        carrito: pedido.items,
        usuarioId: pedido.usuarioId,
        nombreUsuario: pedido.usuarioNombre,
        lugar: "Tienda",
        total: pedido.total,
        ticketId: pedido.id, // ✅ usar ID de Firestore
        fecha: pedido.fecha,
        modoLectura: true,
      });
    });
    contenedor.appendChild(div);
  });
}

// Ejecutar cuando cambia el estado del usuario
auth.onAuthStateChanged((user) => {
  if (user) {
    mostrarTodosLosPedidos(user.uid);
  }
});

/**
 * Crear un pedido en Firestore
 */
export async function crearPedido(
  usuarioId,
  carrito,
  total,
  nombreUsuario,
  estado = "pendiente",
  pagado = false
) {
  try {
    const docRef = await addDoc(collection(db, "compras"), {
      usuarioId,
      usuarioNombre: nombreUsuario,
      items: carrito,
      total,
      fecha: new Date().toISOString(),
      estado,
      usado: false,
      pagado,
    });

    // El ID de Firestore será nuestro ticketId
    const ticketId = docRef.id;
    await docRef.update({ ticketId });

    return ticketId;
  } catch (err) {
    console.error("❌ Error creando pedido:", err);
    throw err;
  }
}

/**
 * Obtener pedidos por estado
 */
export async function obtenerPedidosPorEstado(usuarioId, estado) {
  try {
    const pedidosSnap = await getDocs(collection(db, "compras"));
    const pedidos = [];

    pedidosSnap.forEach((docu) => {
      const data = docu.data();
      if (data.usuarioId !== usuarioId) return;

      if (!estado || data.estado === estado) {
        pedidos.push({ id: docu.id, ...data });
      }
    });

    // Ordenar por fecha descendente
    pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return pedidos;
  } catch (err) {
    console.error("❌ Error obteniendo pedidos:", err);
    return [];
  }
}

/**
 * Eliminar pedido
 */
export async function eliminarPedido(pedidoId) {
  try {
    await deleteDoc(doc(db, "compras", pedidoId));
    return true;
  } catch (err) {
    console.error("❌ Error eliminando pedido:", err);
    return false;
  }
}

/**
 * Mostrar todos los pedidos
 */

// ================= DOMContentLoaded =================
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await mostrarTodosLosPedidos(user.uid);
    }
  });
});

export async function actualizarContadoresPedidos(usuarioId) {
  const contadorPedidosPagos = document.getElementById("contadorPedidosPagos");
  const contadorPedidosPendientes = document.getElementById(
    "contadorPedidosPendientes"
  );

  if (!contadorPedidosPagos || !contadorPedidosPendientes) {
    console.warn("⚠ No se encontraron los elementos de contadores.");
    return;
  }

  try {
    const pedidosPagos = await obtenerPedidosPorEstado(usuarioId, "pagado");
    const pedidosPendientes = await obtenerPedidosPorEstado(
      usuarioId,
      "pendiente"
    );

    contadorPedidosPagos.textContent = pedidosPagos.length;
    contadorPedidosPendientes.textContent = pedidosPendientes.length;
    console.log(pedidosPagos.length + "  aaa  " + pedidosPendientes.length);
  } catch (err) {
    console.error("❌ Error actualizando contadores:", err);
  }
}
