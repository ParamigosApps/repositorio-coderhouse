// pedidos.js
import { db } from "./firebase.js";
import { generarCompraQr } from "./generarQr.js";

export async function crearPedido(
  usuarioId,
  carrito,
  total,
  nombreUsuario,
  pagado = false
) {
  const docRef = await addDoc(collection(db, "compras"), {
    usuarioId,
    usuarioNombre: nombreUsuario,
    items: carrito,
    total,
    fecha: new Date().toISOString(),
    usado: false,
    pagado,
  });
  return docRef.id;
}

export async function obtenerPedidos(usuarioId, filtro = "pendiente") {
  const pedidosSnap = await getDocs(collection(db, "compras"));
  const pedidos = [];

  pedidosSnap.forEach((docu) => {
    const data = docu.data();
    if (data.usuarioId !== usuarioId) return;

    if (filtro === "pendiente" && !data.pagado)
      pedidos.push({ id: docu.id, ...data });
    if (filtro === "pagado" && data.pagado)
      pedidos.push({ id: docu.id, ...data });
  });

  return pedidos;
}

export function mostrarPedidosUI(listaPedidosContainer, pedidos) {
  listaPedidosContainer.innerHTML = "";
  if (!pedidos.length) {
    listaPedidosContainer.innerHTML = `<p class="text-muted">No hay pedidos.</p>`;
    return;
  }

  pedidos.forEach((pedido) => {
    const div = document.createElement("div");
    div.className = "pedido-confirmado p-3 mb-2 border rounded shadow-sm";
    div.innerHTML = `
      <p><strong>Pedido ID:</strong> ${pedido.id}</p>
      <p><strong>Total:</strong> $${pedido.total}</p>
      <ul>
        ${pedido.items
          .map((p) => `<li>${p.nombre} x${p.enCarrito} ($${p.precio})</li>`)
          .join("")}
      </ul>
      <button class="btn btn-sm btn-dark" id="btnQr-${
        pedido.id
      }">Ver QR</button>
    `;
    listaPedidosContainer.appendChild(div);

    document
      .getElementById(`btnQr-${pedido.id}`)
      .addEventListener("click", () => {
        generarCompraQr({ pedido });
      });
  });
}
