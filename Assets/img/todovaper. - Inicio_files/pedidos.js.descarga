// /js/pedidos.js
import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
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
        ? "#c1f1cdff"
        : pedido.estado === "pendiente"
        ? "#f8e8b3ff"
        : "#bcb8b9bb";

    div.innerHTML = `
    <strong>ID:</strong> ${pedido.id}<br>
    <strong>Total:</strong> $${pedido.total}<br>
    <strong>Fecha:</strong> ${pedido.fecha}<br>
    <strong>Estado:</strong> ${pedido.estado}<br>

    ${
      pedido.estado !== "retirado"
        ? `<button class="btn btn-sm btn-dark mt-2 ver-qr">Ver QR</button>`
        : ``
    }

    <div class="detalles-pedido" style="display:none;margin-top:10px;"></div>
    <button class="btn btn-sm btn-danger position-absolute top-0 end-0">X</button>
  `;

    // Botón eliminar
    div.querySelector(".btn-danger").addEventListener("click", async (e) => {
      e.stopPropagation();

      const result = await Swal.fire({
        title: "¿Eliminar pedido?",
        html: "<p>Esta acción no se puede deshacer.</p>",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",
        customClass: {
          confirmButton: "btn btn-dark",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      });

      // ❌ Canceló
      if (!result.isConfirmed) return;

      // ✅ Eliminar en Firestore
      await deleteDoc(doc(db, "compras", pedido.id));
      div.remove();

      // 🔄 Actualizar listas
      mostrarTodosLosPedidos(auth.currentUser.uid);
      if (auth.currentUser) actualizarContadoresPedidos(auth.currentUser.uid);

      Toastify({
        text: "Pedido eliminado",
        duration: 2500,
        gravity: "top",
        position: "right",
        style: {
          background: "#1e88e5",
          color: "white",
          fontWeight: "bold",
          width: "80%", // ancho del toast
          margin: "0 auto", // centrar horizontalmente
          textAlign: "center", // centrar texto
        },
      }).showToast();
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

    // Ver QR (solo si existe el botón)
    const btnQr = div.querySelector(".ver-qr");
    if (btnQr) {
      btnQr.addEventListener("click", (e) => {
        e.stopPropagation();
        generarCompraQr({
          carrito: pedido.items,
          usuarioId: pedido.usuarioId,
          nombreUsuario: pedido.usuarioNombre,
          lugar: "Tienda",
          total: pedido.total,
          ticketId: pedido.id,
          fecha: pedido.fecha,
          modoLectura: true,
        });
      });
    }

    contenedor.appendChild(div);
  });
}

// Ejecutar cuando cambia el estado del usuario
auth.onAuthStateChanged((user) => {
  if (user) {
    mostrarTodosLosPedidos(user.uid);
  }
});

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

export async function obtenerPedidosPorEstado(usuarioId, estado) {
  try {
    if (!usuarioId) {
      console.warn("❌ obtenerPedidosPorEstado: usuarioId es undefined");
      return [];
    }

    if (!estado) {
      console.warn("❌ obtenerPedidosPorEstado: estado es undefined");
      return [];
    }
    const ref = collection(db, "compras");

    const q = query(
      ref,
      where("usuarioId", "==", usuarioId),
      where("estado", "==", estado)
    );

    const snap = await getDocs(q);

    const pedidos = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return pedidos;
  } catch (err) {
    console.error("❌ Error obteniendo pedidos:", err);
    return [];
  }
}

export async function eliminarPedido(pedidoId) {
  try {
    await deleteDoc(doc(db, "compras", pedidoId));
    return true;
  } catch (err) {
    console.error("❌ Error eliminando pedido:", err);
    return false;
  }
}

export async function actualizarContadoresPedidos(usuarioId) {
  if (!usuarioId) {
    console.warn("❌ actualizarContadoresPedidos: usuarioId es undefined");
    return;
  }

  const contadorPedidosPagos = document.getElementById("contadorPedidosPagos");
  const contadorPedidosPendientes = document.getElementById(
    "contadorPedidosPendientes"
  );

  if (!contadorPedidosPagos || !contadorPedidosPendientes) return;

  try {
    const pedidosPagos = await obtenerPedidosPorEstado(usuarioId, "pagado");
    const pedidosPendientes = await obtenerPedidosPorEstado(
      usuarioId,
      "pendiente"
    );

    contadorPedidosPagos.textContent = pedidosPagos.length;
    contadorPedidosPendientes.textContent = pedidosPendientes.length;
  } catch (err) {
    console.error("❌ Error actualizando contadores:", err);
  }
}
