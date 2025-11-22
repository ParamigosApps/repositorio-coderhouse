// /js/pedidos.js
import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { generarCompraQr } from "./generarQr.js";

/**
 * Crear un pedido en Firestore
 */
export async function crearPedido(
  usuarioId,
  carrito,
  total,
  nombreUsuario,
  estado = "pendiente",
  pagado = false,
  ticketId
) {
  try {
    const docRef = await addDoc(collection(db, "compras"), {
      usuarioId,
      usuarioNombre: nombreUsuario,
      items: carrito,
      total,
      fecha: new Date().toISOString(),
      estado,
      ticketId,
      usado: false,
      pagado,
    });
    return docRef.id;
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

    pedidosSnap.forEach((doc) => {
      const data = doc.data();
      if (data.usuarioId !== usuarioId) return;
      if (!estado || data.estado === estado)
        pedidos.push({ id: doc.id, ...data });
    });

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
export async function mostrarTodosLosPedidos(usuarioId) {
  if (!usuarioId) return;
  const contPendientes = document.getElementById("listaPedidosPendientes");
  const contPagos = document.getElementById("listaPedidosPagos");
  const contRetirados = document.getElementById("listaPedidosRetirados");

  const pedidosPagos = await obtenerPedidosPorEstado(usuarioId, "pagado");
  const pedidosPendientes = await obtenerPedidosPorEstado(
    usuarioId,
    "pendiente"
  );
  const pedidosRetirados = await obtenerPedidosPorEstado(usuarioId, "retirado");

  mostrarPedidosUI(contPagos, pedidosPagos);
  mostrarPedidosUI(contPendientes, pedidosPendientes);
  mostrarPedidosUI(contRetirados, pedidosRetirados);
}

function mostrarPedidosUI(contenedor, pedidos) {
  if (!contenedor) return;
  contenedor.innerHTML = "";

  pedidos.forEach((pedido) => {
    const div = document.createElement("div");
    div.classList.add("pedido-item");
    div.style.padding = "10px";
    div.style.marginBottom = "10px";
    div.style.borderRadius = "5px";
    div.style.position = "relative";

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "✖";
    btnEliminar.style.position = "absolute";
    btnEliminar.style.top = "5px";
    btnEliminar.style.right = "5px";
    btnEliminar.style.background = "transparent";
    btnEliminar.style.border = "none";
    btnEliminar.style.fontSize = "16px";
    btnEliminar.style.cursor = "pointer";
    btnEliminar.title = "Eliminar pedido";
    div.appendChild(btnEliminar);

    btnEliminar.addEventListener("click", async () => {
      if (!window.confirm("¿Eliminar este pedido?")) return;
      const success = await eliminarPedido(pedido.id);
      if (success) div.remove();
      else alert("No se pudo eliminar el pedido");
    });

    const contenido = document.createElement("div");
    contenido.style.cursor = "pointer";
    contenido.style.userSelect = "none";

    contenido.innerHTML = `
      <strong>Pedido ID:</strong> ${pedido.id} <br> 
      <strong>Total:</strong> $${pedido.total} <br>
      <strong>Fecha:</strong> ${new Date(pedido.fecha).toLocaleString()} <br>
      <strong>Estado:</strong> ${pedido.estado} <br>
      <button class="btn btn-sm btn-dark mt-2 ver-qr">Ver QR</button>
      <div class="detalles-pedido" style="display:none;margin-top:10px;"></div>
    `;

    contenido.addEventListener("click", (e) => {
      if (e.target.classList.contains("ver-qr") || e.target === btnEliminar)
        return;
      const detalles = contenido.querySelector(".detalles-pedido");
      detalles.style.display =
        detalles.style.display === "none" ? "block" : "none";
    });

    contenido.querySelector(".ver-qr").addEventListener("click", (e) => {
      e.stopPropagation();
      generarCompraQr({
        carrito: pedido.items,
        usuarioId: pedido.usuarioId,
        nombreUsuario: pedido.usuarioNombre,
        lugar: "Tienda",
        total: pedido.total,
        ticketId: pedido.ticketId,
        modoLectura: true,
      });
    });

    div.style.backgroundColor =
      pedido.estado === "pagado"
        ? "#d4edda"
        : pedido.estado === "pendiente"
        ? "#fff3cd"
        : "#f8d7da";

    contenedor.appendChild(div);
  });
}

// ================= DOMContentLoaded =================
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await mostrarTodosLosPedidos(user.uid);
    }
  });
});
