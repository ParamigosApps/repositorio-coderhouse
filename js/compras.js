// /js/compras.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
const html2canvas = window.html2canvas;
const jsPDF = window.jsPDF;
import { auth, db } from "./firebase.js";
import { obtenerFechaCompra } from "./utils.js";
import { generarCompraQr } from "./generarQr.js";
import {
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  doc,
  collection,
  serverTimestamp,
  query,
  where,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
/* -------------------------------------------------------
   📌 OBTENER SIGUIENTE NÚMERO DE PEDIDO (AUTO-INCREMENTAL)
------------------------------------------------------- */
async function obtenerNumeroPedido() {
  const ref = doc(db, "configuracion", "pedidos");
  const snap = await getDoc(ref);

  // Si NO existe → crear doc con el valor inicial
  if (!snap.exists()) {
    await setDoc(ref, { numeroActual: 1000 });
    return 1000;
  }

  const numeroActual = snap.data()?.numeroActual ?? 1000;
  const siguiente = numeroActual + 1;

  await updateDoc(ref, { numeroActual: siguiente });

  return siguiente;
}

/* -------------------------------------------------------
   📌 CONTAR PENDIENTES (LÍMITE DE 3)
------------------------------------------------------- */
async function contarPendientes(usuarioId) {
  const q = query(
    collection(db, "compras"),
    where("usuarioId", "==", usuarioId),
    where("estado", "==", "pendiente")
  );
  const snap = await getDocs(q);
  return snap.size;
}

async function verificarLimitePedidosPendientes(usuarioId) {
  const pendientes = await contarPendientes(usuarioId);
  return pendientes >= 3;
}

/* -------------------------------------------------------
   📌 RESERVAR STOCK (RESTAR AL CREAR PEDIDO PENDIENTE)
   Colección: productos
------------------------------------------------------- */
async function reservarStock(items) {
  try {
    for (const item of items) {
      const ref = doc(db, "productos", item.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) continue;

      const data = snap.data();
      const nuevoStock = (data.stock || 0) - item.enCarrito;

      if (nuevoStock < 0) {
        console.warn("❌ Stock insuficiente al reservar:", item.nombre);
        continue;
      }

      await updateDoc(ref, { stock: nuevoStock });
    }
  } catch (err) {
    console.error("❌ Error reservando stock:", err);
  }
}

/* -------------------------------------------------------
   📌 DEVOLVER STOCK (ÚTIL SI EL PEDIDO EXPIRA O SE ELIMINA)
   Colección: productos
------------------------------------------------------- */
export async function devolverStock(items) {
  try {
    for (const item of items) {
      const ref = doc(db, "productos", item.id);
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
   📌 CREAR PEDIDO (ÚNICO PUNTO OFICIAL)
   👉 RESTA STOCK si NO está pagado
   👉 Genera ticketId
   👉 Aplica límite de 3 pendientes
------------------------------------------------------- */
export async function crearPedido({
  carrito,
  total,
  lugar = "Tienda",
  pagado = false,
}) {
  if (!auth.currentUser) {
    await Swal.fire("Debes iniciar sesión para comprar", "", "info");
    return null;
  }

  const usuarioId = auth.currentUser.uid;
  const usuarioNombre = auth.currentUser.displayName || "Usuario";

  // Límite de 3 pedidos pendientes
  if (!pagado) {
    const tieneLimite = await verificarLimitePedidosPendientes(usuarioId);
    if (tieneLimite) {
      await Swal.fire(
        "Límite alcanzado",
        "Ya tienes 3 pedidos pendientes. Finaliza o elimina un pedido para poder crear uno nuevo.",
        "warning"
      );
      return null;
    }
  }

  const ticketId = `${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  const numeroPedido = await obtenerNumeroPedido();

  // Reservar stock si es pendiente
  if (!pagado) {
    await reservarStock(carrito);
  }

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
    numeroPedido, // ← ← ← NUEVO
    usado: false,
    fecha: serverTimestamp(),
    expiraEn,
    creadoEn: serverTimestamp(),
  });

  return ticketId;
}

/* -------------------------------------------------------
   📌 MOSTRAR QR DE PEDIDO
   (Útil para flujos de pago online / directo)
------------------------------------------------------- */

export async function mostrarQrCompra({
  carrito,
  total,
  ticketId,
  numeroPedido = null,
  lugar = "Tienda",
  estado = "pendiente",
}) {
  const usuarioNombre = auth.currentUser.displayName || "Usuario";
  const fechaHumana = obtenerFechaCompra();

  const estadosPretty = {
    pagado: `<span style="
      background:#42b14d;
      color:#fff;
      padding:3px 8px;
      border-radius:6px;
      font-weight:700;
      font-size:13px;">
      PAGADO
    </span>`,

    pendiente: `<span style="
      background:#f7d774;
      color:#000;
      padding:3px 8px;
      border-radius:6px;
      font-weight:700;
      font-size:13px;">
      PENDIENTE
    </span>`,

    retirado: `<span style="
      background:#bbb;
      color:#000;
      padding:3px 8px;
      border-radius:6px;
      font-weight:700;
      font-size:13px;">
      RETIRADO
    </span>`,
  };

  const estadoHTML = estadosPretty[estado] || estado.toUpperCase();

  await Swal.fire({
    title: "🧾 Ticket de Compra",
    html: `
      <div id="ticketGenerado"
           style="text-align:left; font-size:15px; line-height:1.35; padding:10px;">

        <p style="margin:0 0 8px 0;">
          <strong style="font-size:18px;">
            Pedido #${numeroPedido ?? ticketId}
          </strong>
        </p>

        <p style="margin:0 0 8px 0;">
          <strong>Estado:</strong> ${estadoHTML}
        </p>

        <hr style="margin:10px 0;">

        <p><strong>Cliente:</strong> ${usuarioNombre}</p>
        <p><strong>Lugar:</strong> ${lugar}</p>
        <p><strong>Fecha:</strong> ${fechaHumana}</p>

        <hr style="margin:10px 0;">

        <p><strong>Su pedido:</strong></p>
        <div style="margin-left:10px; margin-bottom:6px;">
          ${carrito
            .map(
              (p) => `
              <p style="margin:0 0 4px 0;">
                - ${p.nombre} ×${p.enCarrito} → $${p.precio * p.enCarrito}
              </p>
            `
            )
            .join("")}
        </div>

        <hr style="margin:10px 0;">

        <p style="font-size:19px;">
          <strong>Total: $${total}</strong>
        </p>

        <div id="qrCompraContainer"
             style="display:flex; justify-content:center; margin-top:12px;"></div>

      </div>

      <!-- BOTONES EXTRA -->
      
      ${
        estado == "pendiente" || estado == "pagado"
          ? `
      <div class="botones-ticket">
        <button id="btnPdf" class="btn-pdf">
          <img src="https://cdn-icons-png.flaticon.com/512/337/337946.png" />
          PDF
        </button>

        <button id="btnWsp" class="btn-wsp">
          <img src="./Assets/img/whatsapp.png">
          WhatsApp
        </button>
      </div>
      `
          : ``
      }

    `,

    didOpen: async () => {
      if (estado != "retirado") {
        const qrContainer = document.getElementById("qrCompraContainer");
        await generarCompraQr({
          ticketId,
          contenido: `Compra:${ticketId}`,
          qrContainer,
          tamaño: 200,
        });
        const ticket = document.getElementById("ticketGenerado");
      } else console.log("YA FUE RETIRADO:" + estado);

      /* ----------------------- 📄 Descargar PDF ----------------------- */
      document.getElementById("btnPdf")?.addEventListener("click", async () => {
        const canvas = await html2canvas(ticket);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
        pdf.save(`ticket-${numeroPedido ?? ticketId}.pdf`);
      });

      /* ----------------------- 📲 Compartir WhatsApp ----------------------- */
      document.getElementById("btnWsp")?.addEventListener("click", async () => {
        let mensaje = `🧾 *Ticket de compra*\n`;
        mensaje += `Pedido #${numeroPedido ?? ticketId}\n`;
        mensaje += `Estado: ${estado.toUpperCase()}\n`;
        mensaje += `Total: $${total}\n`;
        mensaje += `Fecha: ${fechaHumana}\n`;
        mensaje += `\n¡Gracias por tu compra!`;

        const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
        window.open(url, "_blank");
      });
    },
    confirmButtonText: "Cerrar",
    customClass: { confirmButton: "btn btn-dark" },
    buttonsStyling: false,
    width: "420px",
  });
}
