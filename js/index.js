import { db, auth } from "./firebase.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { cargarEventos } from "/js/cargarEventos.js";
import { renderizarCatalogo } from "./cargarCatalogo.js";
import { cargarEntradas, actualizarContadorMisEntradas } from "./entradas.js";
import {
  actualizarContadoresPedidos,
  mostrarTodosLosPedidos,
} from "./pedidos.js";

const listaEventos = document.getElementById("listaEventos");
const listaEntradas = document.getElementById("listaEntradas");
const userId = localStorage.getItem("userId");

document.addEventListener("DOMContentLoaded", () => {
  // ------------ CATALOGO ---------------
  const btnCatalogoCompleto = document.getElementById("btnCatalogoCompleto");
  const btnCategorias = document.querySelectorAll(".btn-categoria");
  const catalogoContainer = document.getElementById("catalogoContainer");

  // Carga inicial
  ObtenerDatosGuardadosDB();
  cargarEventos(listaEventos);
  cargarRedes();

  btnCategorias.forEach((btn) =>
    btn.addEventListener("click", () => {
      catalogoContainer?.classList.remove("d-none");
    })
  );

  if (btnCatalogoCompleto) {
    btnCatalogoCompleto.addEventListener("click", () => {
      catalogoContainer.classList.toggle("collapse");
      if (!catalogoContainer.classList.contains("collapse")) {
        renderizarCatalogo();
      }
    });

    //REDES SOCIALES
    const toggles = document.querySelectorAll(".toggle-red");

    const redButtons = {
      instagramContacto: document.querySelector('[data-red="instagram"]'),
      tiktokContacto: document.querySelector('[data-red="tiktok"]'),
      xContacto: document.querySelector('[data-red="x"]'),
      facebookContacto: document.querySelector('[data-red="facebook"]'),
      youtubeContacto: document.querySelector('[data-red="youtube"]'),
      twitchContacto: document.querySelector('[data-red="twitch"]'),
      webContacto: document.querySelector('[data-red="web"]'),
    };

    toggles.forEach((toggle) => {
      toggle.addEventListener("change", () => {
        const fieldId = toggle.dataset.target;
        const input = document.getElementById(fieldId);
        const btn = redButtons[fieldId];

        if (toggle.checked) {
          input.disabled = false;
          btn.classList.remove("disabled");
        } else {
          input.disabled = true;
          btn.classList.add("disabled");
        }
      });

      // ejecutar estado inicial
      toggle.dispatchEvent(new Event("change"));
    });
  }

  // ------------ EVENTOS & ENTRADAS ---------------

  const btnProximosEventos = document.getElementById("btnProximosEventos");
  const btnMisEntradas = document.getElementById("btnMisEntradas");

  const containerEntradasyEventos = document.getElementById(
    "collapseEntradasEventos"
  );

  // Instancias Bootstrap
  const bsEventos = bootstrap.Collapse.getOrCreateInstance(
    containerEntradasyEventos,
    {
      toggle: false,
    }
  );

  // Abrir eventos → cerrar entradas
  btnProximosEventos?.addEventListener("click", () => {
    bsEntradas.hide();
    bsEventos.toggle();
  });

  // Abrir entradas → cerrar eventos
  btnMisEntradas?.addEventListener("click", () => {
    bsEventos.hide();
    bsEntradas.toggle();
  });

  // Cargar datos al abrir
  containerEntradasyEventos.addEventListener("shown.bs.collapse", () => {
    cargarEventos(listaEventos);
    cargarEntradas(listaEntradas, userId);
  });
});

// REDES SOCIALES - SOLO MOSTRAR LAS ACTIVAS
async function cargarRedes() {
  const cont = document.getElementById("redesContainer");
  if (!cont) return;

  cont.innerHTML = "";

  const snap = await getDoc(doc(db, "configuracion", "social"));
  if (!snap.exists()) return;

  const r = snap.data();
  const botones = [];

  if (r.toggleWhatsapp && r.whatsappContacto)
    botones.push(`<button class="btn btn-outline-success"
      onclick="window.open('https://wa.me/${r.whatsappContacto}','_blank')">WhatsApp</button>`);

  if (r.toggleInstagram && r.instagramContacto)
    botones.push(`<button class="btn btn-outline-dark"
      onclick="window.open('https://instagram.com/${r.instagramContacto.replace(
        "@",
        ""
      )}','_blank')">Instagram</button>`);

  if (r.toggleTiktok && r.tiktokContacto)
    botones.push(`<button class="btn btn-outline-dark"
      onclick="window.open('https://tiktok.com/@${r.tiktokContacto.replace(
        "@",
        ""
      )}','_blank')">TikTok</button>`);

  if (r.toggleX && r.xContacto)
    botones.push(`<button class="btn btn-outline-dark"
      onclick="window.open('https://x.com/${r.xContacto.replace(
        "@",
        ""
      )}','_blank')">X</button>`);

  if (r.toggleFacebook && r.facebookContacto)
    botones.push(`<button class="btn btn-outline-primary"
      onclick="window.open('https://facebook.com/${r.facebookContacto}','_blank')">Facebook</button>`);

  if (r.toggleWeb && r.webContacto)
    botones.push(`<button class="btn btn-outline-dark"
      onclick="window.open('https://${r.webContacto}','_blank')">Página web`);

  cont.innerHTML = botones.join("");
}
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

    // Aplica estado final
    toggle.dispatchEvent(new Event("change"));
  });
}

auth.onAuthStateChanged(async (user) => {
  if (!user) return;
  await mostrarTodosLosPedidos(user.uid);
  await actualizarContadoresPedidos(user.uid);
  await cargarEntradas(listaEntradas, user.uid);
  await actualizarContadorMisEntradas(user.uid);
});
