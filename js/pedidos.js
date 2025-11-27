// /js/pedidos.js
import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { mostrarMensaje, formatearFecha } from "./utils.js";
import { devolverStock, mostrarQrCompra } from "./compras.js";

const expiradosNotificados = new Set();

/* -------------------------------------------------------
   📌 TRAER TODOS LOS PEDIDOS DEL USUARIO
------------------------------------------------------- */
async function traerPedidosRaw(usuarioId) {
  const pedidos = [];
  const snap = await getDocs(collection(db, "compras"));

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.usuarioId === usuarioId) {
      pedidos.push({ id: docSnap.id, ...data });
    }
  });

  pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  return pedidos;
}

/* -------------------------------------------------------
   📌 OBTENER PEDIDOS POR ESTADO (para otros módulos)
------------------------------------------------------- */
export async function obtenerPedidosPorEstado(usuarioId, estado) {
  try {
    const q = query(
      collection(db, "compras"),
      where("usuarioId", "==", usuarioId),
      where("estado", "==", estado)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("❌ Error obteniendo pedidos:", err);
    return [];
  }
}

/* -------------------------------------------------------
   📌 ELIMINAR PEDIDO
------------------------------------------------------- */
export async function eliminarPedido(pedidoId) {
  try {
    await deleteDoc(doc(db, "compras", pedidoId));
    return true;
  } catch (err) {
    console.error("❌ Error eliminando pedido:", err);
    return false;
  }
}

/* -------------------------------------------------------
   📌 MOSTRAR TODOS LOS PEDIDOS EN LA UI
------------------------------------------------------- */
export async function mostrarTodosLosPedidos(usuarioId) {
  if (!usuarioId) return;

  const contPendientes = document.getElementById("listaPedidosPendientes");
  const contPagos = document.getElementById("listaPedidosPagos");
  const contRetirados = document.getElementById("listaPedidosRetirados");

  if (!contPendientes && !contPagos && !contRetirados) return;

  const pedidos = await traerPedidosRaw(usuarioId);

  const pendientes = pedidos.filter((p) => p.estado === "pendiente");
  const pagados = pedidos.filter((p) => p.estado === "pagado");
  const retirados = pedidos.filter((p) => p.estado === "retirado");

  renderPedidos(contPendientes, pendientes);
  renderPedidos(contPagos, pagados);
  renderPedidos(contRetirados, retirados);
}

/* -------------------------------------------------------
   📌 RENDERIZAR UNA LISTA (por estado)
------------------------------------------------------- */
function renderPedidos(contenedor, pedidos) {
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (pedidos.length === 0) {
    contenedor.innerHTML =
      "<p class='text-muted text-center'>No tienes pedidos en este estado.</p>";
    return;
  }

  pedidos.forEach((pedido) => {
    renderPedido(contenedor, pedido);
  });
}

/* -------------------------------------------------------
   📌 RENDERIZAR 1 PEDIDO + EXPIRACIÓN
------------------------------------------------------- */
function renderPedido(contenedor, pedido) {
  const div = document.createElement("div");
  div.className = "pedido-item p-2 mb-2 rounded position-relative";
  div.style.backgroundColor =
    pedido.estado === "pagado"
      ? "#c1f1cdff"
      : pedido.estado === "pendiente"
      ? "#f8e8b3ff"
      : "#bcb8b9bb";

  const id = pedido.id;

  let contadorHtml = "";
  if (pedido.estado === "pendiente") {
    contadorHtml = `<p id="exp-${id}" class="fw-bold text-danger mt-1">⏳ Calculando...</p>`;
  }

  div.innerHTML = `


  <div style="
    display:flex;
    justify-content:space-between;
    align-items:center;
    border-bottom:1px solid #ddd;
    padding-bottom:6px;
  ">
    <strong style="font-size:18px; letter-spacing:0.5px;">
      PEDIDO #${pedido.numeroPedido}
    </strong>

    ${
      pedido.estado === "pendiente"
        ? `<button class="btn btn-sm btn-danger btn-eliminar"
             style="font-size:12px; padding:4px 10px;">
             X
           </button>`
        : ``
    }
  </div>


  <!-- BLOQUE INFO -->
  <div style="font-size:14px; line-height:1.35; color:#333; margin-top:6px;">

    <!-- Total + Fecha pegados -->
    <p style="margin-bottom: 4px;"><strong>Total:</strong> $${pedido.total}</p>

    <p style="margin:0;">
      <strong>Fecha:</strong>
      ${
        pedido.fecha?.toDate
          ? formatearFecha(pedido.fecha.toDate())
          : formatearFecha(pedido.fecha)
      }
    </p>

    <!-- Estado un poquito más abajo -->
    <p style="margin:6px 0 0 0;">
      <strong>Estado:</strong>
      <span style="
        background:${
          pedido.estado === "pagado"
            ? "#42b14dff"
            : pedido.estado === "pendiente"
            ? "#fac834ff"
            : "#ddd"
        };
        padding:3px 8px;
        border-radius:6px;
        font-size:12px;
        font-weight:600;
        color:#333;
      ">
        ${pedido.estado.toUpperCase()}
      </span>
    </p>

  </div>


  <!-- BLOQUE PIE: Caduca + Ver QR alineados -->
<div style="
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-top:10px;
  min-height:22px;  /* fuerza mismo alto siempre */
">
  ${
    pedido.estado === "pendiente"
      ? `<p id="exp-${pedido.id}"
           style="font-weight:bold; color:#c40b1d; margin:0; font-size:16px;">
           ⏳ Calculando...
         </p>`
      : `<span style="visibility:hidden;">placeholder</span>`
  }

  <button class="btn btn-dark btn-sm ver-qr"
    style="font-size:12px; padding:5px 14px; margin-bottom: 2px">  ${
      pedido.estado !== "retirado" ? `Ver QR` : `Ver ticket`
    }
  </button>
</div>


`;

  // ---- ELIMINAR MANUAL ----
  const btnEliminar = div.querySelector(".btn-eliminar");

  if (btnEliminar) {
    btnEliminar.addEventListener("click", async (e) => {
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

      if (!result.isConfirmed) return;

      await eliminarPedido(pedido.id);
      await devolverStock(pedido.items);
      div.remove();

      mostrarTodosLosPedidos(auth.currentUser.uid);
      actualizarContadoresPedidos(auth.currentUser.uid);
    });
  }

  // ---- VER QR ----
  const btnQr = div.querySelector(".ver-qr");
  if (btnQr) {
    btnQr.addEventListener("click", (e) => {
      e.stopPropagation();
      mostrarQrCompra({
        carrito: pedido.items,
        total: pedido.total,
        ticketId: pedido.id,
        numeroPedido: pedido.numeroPedido,
        lugar: pedido.lugar,
        estado: pedido.estado,
      });
    });
  }

  contenedor.appendChild(div);

  // ---- EXPIRACIÓN AUTOMÁTICA ----
  if (pedido.estado === "pendiente") iniciarExpiracion(div, pedido);
}

/* -------------------------------------------------------
   ⏳ EXPIRAR PEDIDO PENDIENTE AUTOMÁTICAMENTE
------------------------------------------------------- */
function iniciarExpiracion(div, pedido) {
  const id = pedido.id;
  const label = document.getElementById(`exp-${id}`);
  const btnQr = div.querySelector(".ver-qr");

  const fechaCreacion = pedido.creadoEn?.toDate?.()
    ? pedido.creadoEn.toDate()
    : new Date(pedido.fecha);

  const expiraEnMs = fechaCreacion.getTime() + 15 * 60 * 1000;

  const interval = setInterval(async () => {
    const ahora = Date.now();
    const diff = expiraEnMs - ahora;

    if (diff <= 0) {
      clearInterval(interval);

      if (!expiradosNotificados.has(id)) {
        expiradosNotificados.add(id);

        if (label) {
          label.textContent = "⛔ Expirado";
          label.classList.remove("text-warning");
          label.classList.add("text-danger");
          label.style.opacity = "0.9";
          label.style.fontWeight = "bold";
        }

        if (btnQr) {
          btnQr.disabled = true;
          btnQr.style.opacity = "0.5";
          btnQr.style.cursor = "not-allowed";
        }

        div.style.filter = "grayscale(70%)";

        mostrarMensaje(`⚠ Caducó 1 pedido pendiente.`, "#c40b1dff", "#fff");

        try {
          await devolverStock(pedido.items);
          await eliminarPedido(id);
          div.remove();
          actualizarContadoresPedidos(auth.currentUser.uid);
        } catch (err) {
          console.error("❌ Error al expirar pedido:", err);
        }
      }

      return;
    }

    const min = Math.floor(diff / 60000);
    const sec = Math.floor((diff % 60000) / 1000);

    if (label) {
      label.textContent = `⏳ Expira en: ${String(min).padStart(
        2,
        "0"
      )}:${String(sec).padStart(2, "0")}`;
    }
  }, 1000);
}
// ======================================================
// 7. CONTADORES — Mostrar cantidad de pedidos por estado
// ======================================================
export async function actualizarContadoresPedidos(usuarioId) {
  if (!usuarioId) return;

  const pagosEl = document.getElementById("contadorPedidosPagos");
  const pendientesEl = document.getElementById("contadorPedidosPendientes");
  const retiradosEl = document.getElementById("contadorPedidosRetirados");

  // Obtener pedidos por estado
  const pagos = await obtenerPedidosPorEstado(usuarioId, "pagado");
  const pendientes = await obtenerPedidosPorEstado(usuarioId, "pendiente");
  const retirados = await obtenerPedidosPorEstado(usuarioId, "retirado");

  // Pintar valores en la UI
  if (pagosEl) pagosEl.textContent = pagos.length;
  if (pendientesEl) pendientesEl.textContent = pendientes.length;
  if (retiradosEl) retiradosEl.textContent = retirados.length;
}

/* -------------------------------------------------------
   📌 LISTENER DE AUTH
------------------------------------------------------- */
auth.onAuthStateChanged((user) => {
  if (user) {
    mostrarTodosLosPedidos(user.uid);
  }
});
