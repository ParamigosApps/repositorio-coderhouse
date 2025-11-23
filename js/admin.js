// /js/admin.js

// /js/admin.js
import { db, auth } from "./firebase.js";
import { initAdminProductos } from "./admin-productos.js";
import {
  actualizarContadorEntradasPendientes,
  crearEntrada,
} from "./entradas.js";
import { cargarCatalogo } from "./cargarCatalogo.js";
import { formatearFecha } from "./utils.js";

import {
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

function escapeHtml(text) {
  if (!text) return "";
  return text
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const esAdmin = localStorage.getItem("esAdmin") === "true";

// -----------------------------
// DOM Ready
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  // ---------------- CREAR EVENTO ----------------
  const formCrearEvento = document.getElementById("form-crear-evento");
  const btnGuardarEvento = document.getElementById("btnGuardarEvento");
  const mensajeError = document.getElementById("mensajeError");
  const btnCatalogoCompleto = document.getElementById("btnCatalogoCompleto");

  if (btnCatalogoCompleto) {
    btnCatalogoCompleto.addEventListener("click", () => {
      cargarCatalogo();
    });
  }

  if (btnGuardarEvento) {
    btnGuardarEvento.addEventListener("click", async () => {
      const nombre = document.getElementById("nombreEvento")?.value.trim();
      const fecha = document.getElementById("fechaEvento")?.value;
      const lugar = document.getElementById("lugarEvento")?.value.trim();
      const horarioDesde = document
        .getElementById("horarioDesdeEvento")
        ?.value.trim();
      const horarioHasta = document
        .getElementById("horarioHastaEvento")
        ?.value.trim();
      const horario = `Desde ${horarioDesde || "-"}hs hasta ${
        horarioHasta || "-"
      }hs.`;
      const precio = document.getElementById("precioEvento")?.value.trim();
      const descripcion = document
        .getElementById("descripcionEvento")
        ?.value.trim();
      const entradasPorUsuarioInput = document.getElementById(
        "entradasPorUsuarioEvento"
      );
      const entradasPorUsuario =
        parseInt(entradasPorUsuarioInput?.value.trim()) || 4;

      if (mensajeError) mensajeError.style.display = "none";

      if (!nombre || !fecha || !lugar || !descripcion) {
        if (mensajeError) {
          mensajeError.textContent =
            "⚠️ Por favor completá todos los campos obligatorios.";
          mensajeError.style.display = "block";
        }
        return;
      }

      if (descripcion.length > 180) {
        if (mensajeError) {
          mensajeError.textContent =
            "⚠️ La descripción no puede superar los 180 caracteres.";
          mensajeError.style.display = "block";
        }
        return;
      }

      try {
        await addDoc(collection(db, "eventos"), {
          nombre,
          fecha,
          lugar,
          horario,
          precio: precio || "Entrada gratuita",
          descripcion,
          entradasPorUsuario,
          creadoEn: serverTimestamp(),
        });

        Swal.fire(
          "🎉 Evento creado",
          `El evento "${nombre}" fue creado correctamente.`,
          "success"
        );

        if (formCrearEvento) formCrearEvento.reset();
        await cargarEventosAdmin();
      } catch (error) {
        console.error("Error al guardar evento:", error);
        Swal.fire("Error", "No se pudo guardar el evento.", "error");
      }
    });
  }

  initAdminProductos();
  cargarEventosAdmin();
  cargarCatalogo();
});

// -----------------------------
// FUNCIONES DE EVENTOS
// -----------------------------
export async function cargarEventosAdmin() {
  const listaEventos = document.getElementById("listaEventos");
  if (!listaEventos) return;

  listaEventos.innerHTML = `<p class="text-center text-secondary mt-3">Cargando eventos...</p>`;

  try {
    const snapshot = await getDocs(collection(db, "eventos"));
    listaEventos.innerHTML = "";

    if (snapshot.empty) {
      listaEventos.innerHTML = `<p class="text-center text-secondary mt-3">No hay eventos disponibles.</p>`;
      return;
    }

    snapshot.forEach((eDoc) => {
      const e = eDoc.data();
      const id = eDoc.id;

      const div = document.createElement("div");
      div.className = "card mb-3 shadow-sm p-3";

      const valorEntrada = e.precio && e.precio > 0 ? `$${e.precio}` : "Gratis";

      div.innerHTML = `
        <h4 class="fw-bold">${e.nombre || "Sin nombre"}</h4>
        <p class="mb-0">📅 <strong>${
          escapeHtml(formatearFecha(e.fecha)) || "Fecha a confirmar"
        }</strong></p>
        <p class="mb-0">📍 ${e.lugar || "Sin lugar"}</p>
        <p class="mb-0">🕑 ${e.horario || "Sin horario definido"}</p>
        <p class="mb-0">💲 ${valorEntrada}</p>
        <p class="mb-0">🎟 Entradas por usuario: ${
          e.entradasPorUsuario ?? "-"
        }</p>
        <p class="mt-2">📝 ${e.descripcion || "Sin descripción"}</p>
        ${
          e.imagen
            ? `<img src="${e.imagen}" class="img-fluid rounded mt-2" style="max-height:180px;object-fit:cover;">`
            : ""
        }
        <button class="btn btn-sm btn-danger mt-1 btnEliminar w-50" data-eventoid="${id}">🗑️ Eliminar</button>
      `;

      listaEventos.appendChild(div);

      div.querySelector(".btnEliminar")?.addEventListener("click", async () => {
        const confirm = await Swal.fire({
          title: "¿Eliminar evento?",
          text: "Esta acción no se puede deshacer.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "Cancelar",
        });

        if (confirm.isConfirmed) {
          try {
            await deleteDoc(doc(db, "eventos", id));
            Swal.fire("✅ Eliminado", "El evento fue borrado.", "success");
            cargarEventosAdmin();
          } catch (err) {
            console.error("Error al eliminar evento:", err);
            Swal.fire("Error", "No se pudo eliminar el evento.", "error");
          }
        }
      });
    });
  } catch (error) {
    console.error("Error al cargar eventos admin:", error);
    listaEventos.innerHTML = `<p class="text-danger text-center mt-3">Error al cargar eventos.</p>`;
  }
}

// -----------------------------
// ENTRADAS PENDIENTES
// -----------------------------
export function cargarEntradasPendientes() {
  const contenedor = document.getElementById("EntradasPendientes");
  if (!contenedor) return;

  contenedor.innerHTML = `<p class="text-center text-secondary mt-3">Cargando entradas pendientes...</p>`;

  const q = query(
    collection(db, "entradasPendientes"),
    orderBy("creadaEn", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    contenedor.innerHTML = "";

    if (snapshot.empty) {
      contenedor.innerHTML = `<p class="text-center text-secondary mt-3">No hay entradas pendientes.</p>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const e = { id: docSnap.id, ...docSnap.data() };

      const div = document.createElement("div");
      div.className = "card mb-3 shadow-sm p-3";

      div.innerHTML = `
        <h5 class="fw-bold">${e.usuarioNombre || "Sin nombre"}</h5>
        <h7 class="mb-0">Evento: <strong>${e.eventoNombre || "-"}</strong></h7>
        <p class="mb-0">Cantidad de entradas: <strong>${e.cantidad}</strong></p>
        <p class="mb-0">Monto total a recibir: <strong>$${
          e.precio * e.cantidad || 0
        }</strong></p>
        <p class="mb-0 text-warning">Estado: <strong>${
          e.estado || "pendiente"
        }</strong></p>
        <div class="text-center mt-2">
          <button class="btn btn-success btn-aprobar"><strong>Aprobar</strong></button>
          <button class="btn btn-danger btn-rechazar"><strong>Rechazar</strong></button>
        </div>
      `;

      actualizarContadorEntradasPendientes();

      // APROBAR
      div.querySelector(".btn-aprobar")?.addEventListener("click", async () => {
        try {
          for (let i = 0; i < (e.cantidad || 1); i++) {
            await crearEntrada(
              e.eventoId,
              {
                nombre: e.eventoNombre,
                fecha: e.fecha,
                lugar: e.lugar,
                precio: e.precio,
              },
              true,
              true
            );
          }
          await deleteDoc(doc(db, "entradasPendientes", e.id));

          const cantidad = e.cantidad || 1;
          const nombreUsuario = escapeHtml(e.usuarioNombre || "usuario");
          Swal.fire(
            "🎉 Aprobado",
            `Se ${cantidad === 1 ? "aprobó" : "aprobaron"} ${cantidad} entrada${
              cantidad === 1 ? "" : "s"
            } para ${nombreUsuario} correctamente.`,
            "success"
          );
          actualizarContadorEntradasPendientes();
        } catch (err) {
          console.error("Error al aprobar:", err);
          Swal.fire("❌ Error", "No se pudo aprobar la entrada.", "error");
        }
      });

      // RECHAZAR
      div
        .querySelector(".btn-rechazar")
        ?.addEventListener("click", async () => {
          const confirm = await Swal.fire({
            title: "¿Rechazar solicitud?",
            text: "Esta acción eliminará la solicitud permanentemente.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, rechazar",
            cancelButtonText: "Cancelar",
          });
          if (!confirm.isConfirmed) return;

          await deleteDoc(doc(db, "entradasPendientes", e.id));
          Swal.fire("❌ Rechazada", "La solicitud fue eliminada.", "success");
          actualizarContadorEntradasPendientes();
        });

      contenedor.appendChild(div);
    });
  });
}

// -----------------------------
// EMPLEADOS
// -----------------------------
let idEmpleadoSeleccionado = null;

const btnGuardarEmpleado = document.getElementById("btnGuardarEmpleado");
btnGuardarEmpleado?.addEventListener("click", async () => {
  const nombre = document.getElementById("nombreEmpleado")?.value.trim();
  const usuario = document.getElementById("usuarioEmpleado")?.value.trim();
  const contraseña = document
    .getElementById("contraseñaEmpleado")
    ?.value.trim();
  const permisos = document.getElementById("permisoEmpleado")?.value.trim();

  if (!nombre || !usuario || !contraseña || !permisos) {
    return Swal.fire("Error", "Completa todos los campos", "error");
  }

  try {
    if (idEmpleadoSeleccionado) {
      await updateDoc(doc(db, "empleados", idEmpleadoSeleccionado), {
        nombre,
        usuario,
        contraseña,
        permisos,
      });
      Swal.fire("Actualizado", "Empleado modificado correctamente", "success");
      idEmpleadoSeleccionado = null;
    } else {
      await addDoc(collection(db, "empleados"), {
        nombre,
        usuario,
        contraseña,
        permisos,
      });
      Swal.fire("Guardado", "Empleado creado correctamente", "success");
    }
    limpiarFormularioEmpleado();
    cargarEmpleados();
  } catch (err) {
    console.error("Error:", err);
    Swal.fire("Error", "No se pudo guardar", "error");
  }
});

function limpiarFormularioEmpleado() {
  document.getElementById("nombreEmpleado").value = "";
  document.getElementById("usuarioEmpleado").value = "";
  document.getElementById("contraseñaEmpleado").value = "";
  document.getElementById("permisoEmpleado").value = "";
}

export async function cargarEmpleados() {
  try {
    const empleadosSnapshot = await getDocs(collection(db, "empleados"));
    const lista = document.querySelector("#empleadosLista");
    if (!lista) return;
    lista.innerHTML = "";

    empleadosSnapshot.forEach((docu) => {
      const emp = docu.data();
      const row = document.createElement("div");
      row.className = "empleado-row";

      row.innerHTML = `
        <div>${emp.nombre}</div>
        <div>${emp.usuario}</div>
        <div>${emp.permisos}</div>
        <div class="acciones">
          <button class="btnEditar btn btn-sm btn-primary" data-id="${docu.id}">Editar</button>
          <button class="btnEliminar btn btn-sm btn-danger" data-id="${docu.id}">Eliminar</button>
        </div>
      `;

      row
        .querySelector(".btnEditar")
        ?.addEventListener("click", () =>
          editarEmpleado(
            docu.id,
            emp.nombre,
            emp.usuario,
            emp.contraseña,
            emp.permisos
          )
        );
      row
        .querySelector(".btnEliminar")
        ?.addEventListener("click", () => eliminarEmpleado(docu.id));

      lista.appendChild(row);
    });
  } catch (err) {
    console.error("Error cargando empleados:", err);
  }
}

window.editarEmpleado = (id, nombre, usuario, contraseña, permisos) => {
  document.getElementById("nombreEmpleado").value = nombre;
  document.getElementById("usuarioEmpleado").value = usuario;
  document.getElementById("contraseñaEmpleado").value = contraseña;
  document.getElementById("permisoEmpleado").value = permisos;
  idEmpleadoSeleccionado = id;
  Swal.fire("Edición", "Modifica los campos y guarda", "info");
};

window.eliminarEmpleado = async (id) => {
  const confirm = await Swal.fire({
    title: "¿Eliminar empleado?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
  });
  if (!confirm.isConfirmed) return;

  await deleteDoc(doc(db, "empleados", id));
  cargarEmpleados();
  Swal.fire("Eliminado", "Empleado eliminado", "success");
};

// -----------------------------
// TOGGLE PASSWORD
// -----------------------------
const togglePassword = document.getElementById("togglePassword");
togglePassword?.addEventListener("click", () => {
  const input = document.getElementById("contraseñaEmpleado");
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
});

// -----------------------------
// CONTACTO Y DATOS BANCARIOS
// -----------------------------
const btnGuardarContacto = document.getElementById("btnGuardarContacto");
btnGuardarContacto?.addEventListener("click", guardarDatosContacto);

async function guardarDatosContacto() {
  const whatsappContacto =
    document.getElementById("whatsappContacto")?.value || "";
  const instagramContacto =
    document.getElementById("instagramContacto")?.value || "";
  const tiktokContacto = document.getElementById("tiktokContacto")?.value || "";

  await setDoc(doc(db, "configuracion", "social"), {
    whatsappContacto,
    instagramContacto,
    tiktokContacto,
  });

  Swal.fire({
    icon: "success",
    title: "Contactos guardados",
    html: `
      <div style="text-align:left;">
        <p><strong>Whatsapp:</strong> ${escapeHtml(
          whatsappContacto || "Campo vacío"
        )}</p>
        <p><strong>Instagram:</strong> ${escapeHtml(
          instagramContacto || "Campo vacío"
        )}</p>
        <p><strong>TikTok:</strong> ${escapeHtml(
          tiktokContacto || "Campo vacío"
        )}</p>
      </div>
    `,
    confirmButtonText: "Aceptar",
  });
}

const btnGuardarDatosBancarios = document.getElementById(
  "btnGuardarDatosBancarios"
);
btnGuardarDatosBancarios?.addEventListener("click", guardarDatosBancarios);

async function guardarDatosBancarios() {
  const nombreBanco = document.getElementById("nombreBanco")?.value || "";
  const cbuBanco = document.getElementById("cbuBanco")?.value || "";
  const aliasBanco = document.getElementById("aliasBanco")?.value || "";
  const titularBanco = document.getElementById("titularBanco")?.value || "";

  await setDoc(doc(db, "configuracion", "datosBancarios"), {
    nombreBanco,
    cbuBanco,
    aliasBanco,
    titularBanco,
  });

  Swal.fire({
    icon: "success",
    title: "Datos bancarios guardados",
    html: `
      <div style="text-align:left;">
        <p><strong>Banco:</strong> ${escapeHtml(nombreBanco)}</p>
        <p><strong>CBU:</strong> ${escapeHtml(cbuBanco)}</p>
        <p><strong>Alias:</strong> ${escapeHtml(aliasBanco)}</p>
        <p><strong>Titular:</strong> ${escapeHtml(titularBanco)}</p>
      </div>
    `,
    confirmButtonText: "Aceptar",
  });
}

async function ObtenerDatosGuardadosDB() {
  // DATOS BANCARIOS
  const docRef = doc(db, "configuracion", "datosBancarios");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const { nombreBanco, cbuBanco, aliasBanco, titularBanco } = docSnap.data();

    const nombreBancoInput = document.getElementById("nombreBanco");
    const cbuBancoInput = document.getElementById("cbuBanco");
    const aliasBancoInput = document.getElementById("aliasBanco");
    const titularBancoInput = document.getElementById("titularBanco");

    if (nombreBanco) nombreBancoInput.value = nombreBanco;
    else nombreBancoInput.placeholder = "Banco Ejemplo";

    if (cbuBanco) cbuBancoInput.value = cbuBanco;
    else cbuBancoInput.placeholder = "1234567890123456789012";

    if (aliasBanco) aliasBancoInput.value = aliasBanco;
    else aliasBancoInput.placeholder = "MI.ALIAS.BANCO";

    if (titularBanco) titularBancoInput.value = titularBanco;
    else aliasBancoInput.placeholder = "Juan Pérez";
  }

  // DATOS CONTACTO
  const docRefCont = doc(db, "configuracion", "social");
  const docSnapCont = await getDoc(docRefCont);

  if (docSnapCont.exists()) {
    const { whatsappContacto, instagramContacto, tiktokContacto } =
      docSnapCont.data();

    const whatsappContactoInput = document.getElementById("whatsappContacto");
    const instagramContactoInput = document.getElementById("instagramContacto");
    const tiktokContactoInput = document.getElementById("tiktokContacto");

    if (whatsappContacto) whatsappContactoInput.value = whatsappContacto;
    else whatsappContactoInput.placeholder = "Ej: 1112345678";

    if (tiktokContacto) instagramContactoInput.value = instagramContacto;
    else instagramContactoInput.tiktokContacto = "Ej: @usuario_ig";

    if (tiktokContacto) tiktokContactoInput.value = tiktokContacto;
    else tiktokContactoInput.placeholder = "Ej: @usuario_tiktok";
  }
}

ObtenerDatosGuardadosDB();
cargarEntradasPendientes();
cargarEmpleados();
