// ======================================================
// IMPORTS
// ======================================================
import { db, auth } from "./firebase.js";
import {
  getDoc,
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  where,
  limit,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { cargarEventos } from "/js/cargarEventos.js";
import { renderizarCatalogo } from "./cargarCatalogo.js";
import { mostrarMensaje } from "./utils.js";
import {
  cargarEntradas,
  actualizarContadorMisEntradas,
  escucharEntradasPendientes,
} from "./entradas.js";
import {
  actualizarContadoresPedidos,
  mostrarTodosLosPedidos,
} from "./pedidos.js";
import { mostrarQrCompra } from "./compras.js";

// ======================================================
// DOM ELEMENTOS
// ======================================================
const listaEventos = document.getElementById("listaEventos");
const listaEntradas = document.getElementById("listaEntradas");
const btnCatalogoCompleto = document.getElementById("btnCatalogoCompleto");
const btnCategorias = document.querySelectorAll(".btn-categoria");
const catalogoContainer = document.getElementById("catalogoContainer");

const btnProximosEventos = document.getElementById("btnProximosEventos");
const btnMisEntradas = document.getElementById("btnMisEntradas");
const containerEntradasyEventos = document.getElementById(
  "collapseEntradasEventos"
);

const redesContainer = document.getElementById("redesContainer");

// ======================================================
// INICIALIZACIÓN
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {
  // --- Cargar datos guardados (redes sociales)
  await ObtenerDatosGuardadosDB();

  // --- Cargar eventos al inicio
  cargarEventos(listaEventos);

  // --- Renderizar catálogo solo al abrir
  btnCategorias.forEach((btn) => {
    btn.addEventListener("click", () => {
      catalogoContainer?.classList.remove("d-none");
    });
  });

  if (btnCatalogoCompleto) {
    btnCatalogoCompleto.addEventListener("click", () => {
      catalogoContainer.classList.toggle("collapse");

      if (!catalogoContainer.classList.contains("collapse")) {
        renderizarCatalogo();
      }
    });
  }

  // --- Redes sociales visibles
  cargarRedes();

  // ======================================================
  // EVENTOS / MIS ENTRADAS UI
  // ======================================================

  const bsEventos = bootstrap.Collapse.getOrCreateInstance(
    containerEntradasyEventos,
    {
      toggle: false,
    }
  );

  // Crear collapse de entradas (si existe el elemento)
  const containerEntradas = document.getElementById("collapseEntradas");
  const bsEntradas = containerEntradas
    ? bootstrap.Collapse.getOrCreateInstance(containerEntradas, {
        toggle: false,
      })
    : null;

  // Abrir eventos → cerrar entradas
  btnProximosEventos?.addEventListener("click", () => {
    bsEntradas?.hide();
    bsEventos.toggle();
  });

  // Abrir entradas → cerrar eventos
  btnMisEntradas?.addEventListener("click", () => {
    bsEventos.hide();
    bsEntradas?.toggle();
  });

  // Cargar contenido al abrir
  containerEntradasyEventos.addEventListener("shown.bs.collapse", () => {
    cargarEventos(listaEventos);
    cargarEntradas(listaEntradas);
  });

  // ======================================================
  // MOSTRAR QR LUEGO DE MERCADO PAGO
  // ======================================================
  const ticketId = localStorage.getItem("ultimoTicketPagado");

  if (ticketId) {
    localStorage.removeItem("ultimoTicketPagado");

    mostrarQrCompra({
      ticketId,
      desdePago: true,
    });

    document.getElementById("carritoPanel")?.classList.add("open");
    document.getElementById("carritoOverlay")?.removeAttribute("hidden");
  }
});

// ======================================================
// LISTENER LOGIN
// ======================================================

auth.onAuthStateChanged(async (user) => {
  console.log("👤 onAuthStateChanged USER:", user?.uid);

  if (!user) return;

  // Cargar datos
  await mostrarTodosLosPedidos(user.uid);
  await actualizarContadoresPedidos(user.uid);
  await cargarEntradas(listaEntradas);
  await actualizarContadorMisEntradas(user.uid);

  console.log("🔔 ACTIVANDO escucharNotificaciones para:", user.uid);
  escucharNotificaciones(user.uid);

  // ======================================================
  // 🔔 ESCUCHAR APROBACIÓN DE PAGOS (NOTIFICACIÓN EN VIVO)
  // ======================================================
  escucharEntradasPendientes(user.uid, ({ ticketId }) => {
    Swal.fire({
      icon: "success",
      title: "🎉 ¡Tu entrada fue aprobada!",
      html: `Ya podés verla en <strong>Mis Entradas</strong>.`,
      confirmButtonText: "Ver ahora",
      customClass: { confirmButton: "btn btn-dark" },
      buttonsStyling: false,
    }).then(() => {
      document.getElementById("btnMisEntradas")?.click();
    });
  });
});

// ======================================================
// REDES SOCIALES - MOSTRAR SOLO LAS ACTIVAS
// ======================================================
async function cargarRedes() {
  if (!redesContainer) return;

  redesContainer.innerHTML = "";

  const snap = await getDoc(doc(db, "configuracion", "social"));
  if (!snap.exists()) return;

  const r = snap.data();
  const botones = [];

  if (r.toggleWhatsapp && r.whatsappContacto)
    botones.push(
      `<button class="btn btn-outline-success" onclick="window.open('https://wa.me/${r.whatsappContacto}','_blank')">WhatsApp</button>`
    );

  if (r.toggleInstagram && r.instagramContacto)
    botones.push(
      `<button class="btn btn-outline-dark" onclick="window.open('https://instagram.com/${r.instagramContacto.replace(
        "@",
        ""
      )}','_blank')">Instagram</button>`
    );

  if (r.toggleTiktok && r.tiktokContacto)
    botones.push(
      `<button class="btn btn-outline-dark" onclick="window.open('https://tiktok.com/@${r.tiktokContacto.replace(
        "@",
        ""
      )}','_blank')">TikTok</button>`
    );

  if (r.toggleX && r.xContacto)
    botones.push(
      `<button class="btn btn-outline-dark" onclick="window.open('https://x.com/${r.xContacto.replace(
        "@",
        ""
      )}','_blank')">X</button>`
    );

  if (r.toggleFacebook && r.facebookContacto)
    botones.push(
      `<button class="btn btn-outline-primary" onclick="window.open('https://facebook.com/${r.facebookContacto}','_blank')">Facebook</button>`
    );

  if (r.toggleWeb && r.webContacto)
    botones.push(
      `<button class="btn btn-outline-dark" onclick="window.open('https://${r.webContacto}','_blank')">Página web</button>`
    );

  redesContainer.innerHTML = botones.join("");
}

// ======================================================
// LEER DATOS DE REDES PARA ADMIN
// ======================================================
async function ObtenerDatosGuardadosDB() {
  const docSnap = await getDoc(doc(db, "configuracion", "social"));
  if (!docSnap.exists()) return;

  const data = docSnap.data();
  const fields = ["Whatsapp", "Instagram", "Tiktok", "X", "Facebook", "Web"];

  fields.forEach((red) => {
    const toggle = document.getElementById(`toggle${red}`);
    const input = document.getElementById(`${red.toLowerCase()}Contacto`);

    if (!toggle || !input) return;

    toggle.checked = data[`toggle${red}`] ?? false;
    input.value = data[`${red.toLowerCase()}Contacto`] || "";

    toggle.dispatchEvent(new Event("change"));
  });
}

let ultimaNotificacion = null;

function escucharNotificaciones(usuarioId) {
  console.log("🔔 escucharNotificaciones() llamado con usuarioId:", usuarioId);
  if (!usuarioId) {
    console.warn("⚠ usuarioId ES NULL, no se escuchan notificaciones");
    return;
  }

  const q = query(
    collection(db, "notificaciones"),
    where("usuarioId", "==", usuarioId),
    orderBy("creadoEn", "desc"),
    limit(1)
  );

  console.log("📡 Listener creado. Esperando notificaciones…");

  onSnapshot(
    q,
    (snap) => {
      console.log("📨 Snapshot recibido:", snap.size, "documentos");

      snap.docChanges().forEach((change) => {
        console.log("🔄 change detectado:", change.type, change.doc.id);

        if (change.type !== "added") {
          console.log("⏭ No es 'added', se ignora.");
          return;
        }

        const data = change.doc.data();
        console.log("📌 Datos de la notificación recibida:", data);

        // Evitar notificaciones duplicadas al recargar
        if (ultimaNotificacion === change.doc.id) {
          console.log("⛔ Notificación duplicada ignorada:", change.doc.id);
          return;
        }

        ultimaNotificacion = change.doc.id;

        // --------------------------
        // 🎟 ENTRADA APROBADA
        // --------------------------
        if (data.tipo === "entrada_aprobada") {
          console.log("🎉 Disparando mensaje de entrada aprobada…", data);

          const entradaText = data.cantidad == 1 ? "entrada" : "entradas";

          mostrarMensaje(
            `🎉 ¡Te aprobaron ${data.cantidad} ${entradaText} para ${data.nombreEvento}!`,
            "#28a745",
            "#ffffff"
          );

          return;
        }

        // --------------------------
        // ⚠ PEDIDO VENCIDO
        // --------------------------
        if (data.tipo === "pedido_vencido") {
          console.log("⚠️ Notificación de pedido vencido recibida:", data);

          mostrarMensaje(
            "⚠️ Tu pedido pendiente venció y fue cancelado.",
            "#ffcc00",
            "#000"
          );

          // Refrescar listas
          if (auth.currentUser) {
            mostrarTodosLosPedidos(auth.currentUser.uid);
            actualizarContadoresPedidos(auth.currentUser.uid);
          }

          return;
        }

        console.log("📭 Tipo de notificación desconocido:", data.tipo);
      });
    },
    (err) => {
      console.error("❌ Error en onSnapshot escuchando notificaciones:", err);
    }
  );
}
