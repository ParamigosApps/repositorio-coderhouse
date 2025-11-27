// ======================================================
// P E D I D O S   –   SISTEMA CENTRALIZADO
// ======================================================

import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { generarCompraQr } from "./generarQr.js";
import { mostrarMensaje } from "./utils.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

// ======================================================
// 1. HELPERS INTERNOS
// ======================================================

// Obtiene todos los pedidos de un usuario
async function _traerPedidosRaw(usuarioId) {
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

// Cuenta pedidos pendientes del usuario
async function _contarPendientes(usuarioId) {
  const q = query(
    collection(db, "compras"),
    where("usuarioId", "==", usuarioId),
    where("estado", "==", "pendiente")
  );

  const snap = await getDocs(q);
  return snap.size;
}

// ======================================================
// 2. REGLAS DEL SISTEMA
// ======================================================

// 🔥 Bloquea al usuario si ya tiene 3 pedidos pendientes
export async function verificarLimitePedidosPendientes(usuarioId) {
  const pendientes = await _contarPendientes(usuarioId);
  return pendientes >= 3;
}

// ======================================================
// 3. CREAR PEDIDO
// ======================================================
export async function crearPedido({
  carrito,
  total,
  lugar = "Tienda",
  pagado,
}) {
  try {
    const usuarioId = auth.currentUser?.uid;
    const usuarioNombre = auth.currentUser?.displayName || "Usuario";

    if (!usuarioId) throw new Error("Usuario no logueado");

    // ------------------------------------------------------
    // 🔥 LÍMITE DE 3 PENDIENTES
    // ------------------------------------------------------
    const tieneLimite = await verificarLimitePedidosPendientes(usuarioId);

    if (!pagado && tieneLimite) {
      return null; // no mostrar ningún Swal acá
    }

    // ------------------------------------------------------
    // ✔ CREAR PEDIDO
    // ------------------------------------------------------
    const docRef = await addDoc(collection(db, "compras"), {
      usuarioId,
      usuarioNombre,
      items: carrito,
      total,
      fecha: new Date().toISOString(),
      estado: pagado ? "pagado" : "pendiente",
      pagado,
      lugar,
      usado: false,
    });

    // Guardar ticketId
    await updateDoc(doc(db, "compras", docRef.id), {
      ticketId: docRef.id,
    });

    return docRef.id;
  } catch (err) {
    console.error("❌ Error creando pedido:", err);
    return null;
  }
}

// ======================================================
// 4. OBTENER PEDIDOS
// ======================================================
export async function obtenerPedidosPorUsuario(usuarioId) {
  return await _traerPedidosRaw(usuarioId);
}

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

// ======================================================
// 5. ELIMINAR PEDIDO
// ======================================================
export async function eliminarPedido(pedidoId) {
  try {
    await deleteDoc(doc(db, "compras", pedidoId));
    return true;
  } catch (err) {
    console.error("❌ Error eliminando pedido:", err);
    return false;
  }
}

// ======================================================
// 6. MOSTRAR PEDIDOS EN LA UI
// ======================================================
export async function mostrarTodosLosPedidos(usuarioId) {
  if (!usuarioId) return;

  const contPendientes = document.getElementById("listaPedidosPendientes");
  const contPagos = document.getElementById("listaPedidosPagos");
  const contRetirados = document.getElementById("listaPedidosRetirados");

  if (!contPendientes && !contPagos && !contRetirados) return;

  const pedidos = await obtenerPedidosPorUsuario(usuarioId);

  const pendientes = pedidos.filter((p) => p.estado === "pendiente");
  const pagados = pedidos.filter((p) => p.estado === "pagado");
  const retirados = pedidos.filter((p) => p.estado === "retirado");

  mostrarPedidosUI(contPendientes, pendientes);
  mostrarPedidosUI(contPagos, pagados);
  mostrarPedidosUI(contRetirados, retirados);
}

function mostrarPedidosUI(contenedor, pedidos) {
  if (!contenedor) return;

  contenedor.innerHTML = "";
  let estado = "";

  if (contenedor.id === "listaPedidosPendientes") estado = "Pendientes";
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

    const id = pedido.id;

    // Contador solo si es PENDIENTE
    let contadorHtml = "";
    if (pedido.estado === "pendiente") {
      contadorHtml = `<p id="exp-${id}" class="fw-bold text-danger">⏳ Calculando...</p>`;
    }

    div.innerHTML = `
      <strong>ID:</strong> ${pedido.id}<br>
      <strong>Total:</strong> $${pedido.total}<br>
      <strong>Fecha:</strong> ${pedido.fecha}<br>
      <strong>Estado:</strong> ${pedido.estado}<br>

      ${contadorHtml}

      ${
        pedido.estado !== "retirado"
          ? `<button class="btn btn-sm btn-dark mt-2 ver-qr" ${
              pedido.estado === "pendiente" ? "disabled" : ""
            }>Ver QR</button>`
          : ``
      }

      <button class="btn btn-sm btn-danger position-absolute top-0 end-0">X</button>
    `;

    // === ELIMINAR ===
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

      if (!result.isConfirmed) return;

      await eliminarPedido(pedido.id);
      div.remove();

      mostrarTodosLosPedidos(auth.currentUser.uid);
      actualizarContadoresPedidos(auth.currentUser.uid);
    });

    // === VER QR ===
    const btnQr = div.querySelector(".ver-qr");
    if (btnQr) {
      btnQr.addEventListener("click", (e) => {
        e.stopPropagation();
        generarCompraQr({
          carrito: pedido.items,
          usuarioId: pedido.usuarioId,
          nombreUsuario: pedido.usuarioNombre,
          lugar: pedido.lugar,
          total: pedido.total,
          ticketId: pedido.id,
          fecha: pedido.fecha,
          modoLectura: true,
        });
      });
    }

    contenedor.appendChild(div);

    // ======================================================
    //  ⏳ CONTADOR CON TIMESTAMP REAL + AUTO-REMOVE
    // ======================================================
    if (pedido.estado === "pendiente") {
      const label = document.getElementById(`exp-${id}`);

      // ⛔ USAMOS EL TIMESTAMP REAL
      const fechaCreacion = pedido.creadoEn?.toDate?.()
        ? pedido.creadoEn.toDate()
        : new Date();

      const expiraEnMs = fechaCreacion.getTime() + 15 * 60 * 1000;

      let expiradoMostrado = false;
      let timeoutAutoRemove = null;

      const interval = setInterval(() => {
        const ahora = Date.now();
        const diff = expiraEnMs - ahora;

        // ------------ PEDIDO EXPIRADO ------------
        if (diff <= 0) {
          clearInterval(interval);

          if (!expiradoMostrado) {
            expiradoMostrado = true;

            if (label) {
              label.textContent = "⛔ Expirado";
              label.classList.remove("text-warning");
              label.classList.add("text-danger");
            }

            div.style.opacity = "0.5";

            mostrarMensaje(
              `⚠️ Tu pedido #${id} venció y fue cancelado.`,
              "#dc3545",
              "#fff"
            );

            // borrar de la UI tras 60s
            timeoutAutoRemove = setTimeout(() => {
              div.remove();
            }, 60 * 1000);
          }
          return;
        }

        // ------------ CONTADOR VÁLIDO (ya NO NaN) ------------
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
  });
}

// ======================================================
// 7. CONTADORES
// ======================================================
export async function actualizarContadoresPedidos(usuarioId) {
  if (!usuarioId) return;

  const pagosEl = document.getElementById("contadorPedidosPagos");
  const pendientesEl = document.getElementById("contadorPedidosPendientes");

  const pagos = await obtenerPedidosPorEstado(usuarioId, "pagado");
  const pendientes = await obtenerPedidosPorEstado(usuarioId, "pendiente");

  if (pagosEl) pagosEl.textContent = pagos.length;
  if (pendientesEl) pendientesEl.textContent = pendientes.length;
}

// ======================================================
// 8. LISTENER DE AUTH
// ======================================================
auth.onAuthStateChanged((user) => {
  if (user) {
    mostrarTodosLosPedidos(user.uid);
    actualizarContadoresPedidos(user.uid);
  }
});
