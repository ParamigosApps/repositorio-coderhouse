// /js/admin.js

import { db, auth, storage } from "./firebase.js";
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

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

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
let loginSettingsActual = null;

function validarHorario(valor) {
  if (!valor) return true;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(valor);
}

// ==========================================================
// VALIDAR IMAGEN DEL EVENTO (5 MB, JPG/PNG/WEBP)
// ==========================================================
function validarImagen(file, mensajeError) {
  if (!file) return true; // opcional

  const formatos = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSize = 4 * 1024 * 1024;

  if (!formatos.includes(file.type)) {
    mensajeError.textContent = "⚠️ La imagen debe ser JPG, PNG o WEBP.";
    mensajeError.style.display = "block";
    return false;
  }

  if (file.size > maxSize) {
    mensajeError.textContent = "⚠️ La imagen no debe superar los 4 MB.";
    mensajeError.style.display = "block";
    return false;
  }

  return true;
}

// ==========================================================
//  SUBIR IMAGEN A FIREBASE STORAGE
// ==========================================================
async function subirImagenAStorage(file, id) {
  if (!file) return { url: null, path: null }; // ← evita errores

  const path = `eventos/${id}/${file.name}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { url, path };
}

// ==========================================================
//  DOM READY
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  const formCrearEvento = document.getElementById("form-crear-evento");
  const inputImagen = document.getElementById("imagenEvento");
  const btnGuardarEvento = document.getElementById("btnGuardarEvento");
  const mensajeError = document.getElementById("mensajeError");

  // ===============================
  // VALIDACIÓN DE IMAGEN (5 MB + formatos permitidos)
  // ===============================
  function validarImagen(file, mensajeError) {
    if (!file) return true; // es opcional

    const formatosPermitidos = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    if (!formatosPermitidos.includes(file.type)) {
      mensajeError.textContent = "⚠️ La imagen debe ser JPG, JPEG, PNG o WEBP.";
      mensajeError.style.display = "block";
      return false;
    }

    if (file.size > maxSize) {
      mensajeError.textContent = "⚠️ La imagen no debe superar los 4 MB.";
      mensajeError.style.display = "block";
      return false;
    }

    return true;
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
      const precio = Number(
        document.getElementById("precioEvento")?.value.trim()
      );
      const descripcion = document
        .getElementById("descripcionEvento")
        ?.value.trim();

      const entradasPorUsuario =
        parseInt(
          document.getElementById("entradasPorUsuarioEvento")?.value.trim()
        ) || 4;

      mensajeError.style.display = "none";

      // VALIDACIONES
      if (!nombre || !fecha || !lugar || !descripcion) {
        mensajeError.textContent = "⚠️ Completá todos los campos obligatorios.";
        mensajeError.style.display = "block";
        return;
      }

      if (descripcion.length > 180) {
        mensajeError.textContent =
          "⚠️ La descripción no puede superar los 180 caracteres.";
        mensajeError.style.display = "block";
        return;
      }

      if (!validarHorario(horarioDesde) || !validarHorario(horarioHasta)) {
        mensajeError.textContent =
          "⚠️ El horario debe ser válido (00:00 a 23:59).";
        mensajeError.style.display = "block";
        return;
      }

      const file = inputImagen.files?.[0];
      if (!validarImagen(file, mensajeError)) return;

      const horario = `Desde ${horarioDesde || "-"}hs hasta ${
        horarioHasta || "-"
      }hs.`;

      // Validar entradas máximas
      const entradasMaximas =
        parseInt(document.getElementById("entradasPorEvento")?.value.trim()) ||
        null;

      if (!entradasMaximas || entradasMaximas < 10 || entradasMaximas > 50000) {
        mensajeError.textContent =
          "⚠️ Ingresá un valor válido para las entradas máximas (entre 10 y 50.000).";
        mensajeError.style.display = "block";
        return;
      }
      try {
        const docRef = await addDoc(collection(db, "eventos"), {
          nombre,
          fecha,
          lugar,
          horario,
          precio: precio || 0,
          descripcion,
          entradasPorUsuario,
          entradasMaximasEvento: entradasMaximas,
          creadoEn: serverTimestamp(),
        });

        // 2️⃣ Subir imagen opcional
        let subida = { url: null, path: null };
        if (file) subida = await subirImagenAStorage(file, docRef.id);

        // 3️⃣ Guardar datos finales
        await updateDoc(doc(db, "eventos", docRef.id), {
          imagen: subida.url,
          imagenPath: subida.path,
        });

        Swal.fire(
          "🎉 Evento creado",
          `El evento "${nombre}" fue creado correctamente.`,
          "success"
        );

        formCrearEvento.reset();
        cargarEventosAdmin();
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

// ==========================================================
//  CARGAR EVENTOS ADMIN
// ==========================================================
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

        <button class="btn btn-sm btn-danger mt-2 btnEliminar d-block mx-auto" data-eventoid="${id}">
          🗑️ Eliminar
        </button>
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

        if (!confirm.isConfirmed) return;

        try {
          await deleteDoc(doc(db, "eventos", id));
          Swal.fire("Eliminado", "El evento fue borrado.", "success");
          cargarEventosAdmin();
        } catch (err) {
          console.error("Error al eliminar evento:", err);
          Swal.fire("Error", "No se pudo eliminar el evento.", "error");
        }
      });
    });
  } catch (error) {
    console.error("Error al cargar eventos admin:", error);
    listaEventos.innerHTML = `<p class="text-danger text-center mt-3">Error al cargar eventos.</p>`;
  }
}

// ==========================================================
//  ENTRADAS PENDIENTES
// ==========================================================
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
        <p class="mb-0">Evento: <strong>${e.eventoNombre || "-"}</strong></p>
        <p class="mb-0">Cantidad: <strong>${e.cantidad}</strong></p>
        <p class="mb-0">Total: <strong>$${
          e.precio * e.cantidad || 0
        }</strong></p>
        <p class="mb-0 text-warning">Estado: <strong>${
          e.estado || "pendiente"
        }</strong></p>

        <div class="text-center mt-2">
          <button class="btn btn-success btn-aprobar">Aprobar y notificar</button>
          <button class="btn btn-danger btn-rechazar">Rechazar</button>
        </div>
      `;

      actualizarContadorEntradasPendientes();

      div.querySelector(".btn-aprobar")?.addEventListener("click", async () => {
        try {
          for (let i = 0; i < (e.cantidad || 1); i++) {
            await crearEntrada(
              e.eventoId,
              {
                nombre: e.eventoNombre, // <-- BIEN
                fecha: e.fecha,
                lugar: e.lugar,
                precio: e.precio,
              },
              true,
              true
            );
          }

          await deleteDoc(doc(db, "entradasPendientes", e.id));

          Swal.fire(
            "🎉 Aprobado",
            `Se aprobaron ${e.cantidad} entradas`,
            "success"
          );
          console.log("📌 NOTIFICANDO APROBACIÓN:", {
            usuarioId: e.usuarioId,
            eventoNombre: e.eventoNombre,
            cantidad: e.cantidad,
            eventoId: e.eventoId,
          });

          // 🟢 USAR eventoNombre
          await notificarAprobacionEntrada(
            e.usuarioId,
            e.eventoNombre,
            e.cantidad
          );

          actualizarContadorEntradasPendientes();
        } catch (err) {
          console.error("Error al aprobar:", err);
          Swal.fire("Error", "No se pudo aprobar la entrada.", "error");
        }
      });

      div
        .querySelector(".btn-rechazar")
        ?.addEventListener("click", async () => {
          const confirm = await Swal.fire({
            title: "¿Rechazar solicitud?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí",
            cancelButtonText: "Cancelar",
          });

          if (!confirm.isConfirmed) return;

          await deleteDoc(doc(db, "entradasPendientes", e.id));
          Swal.fire("Rechazada", "La solicitud fue eliminada.", "success");
          actualizarContadorEntradasPendientes();
        });

      contenedor.appendChild(div);
    });
  });
}

// ==========================================================
//  EMPLEADOS
// ==========================================================
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

// ==========================================================
//  CONTACTO + DATOS BANCARIOS
// ==========================================================
const btnGuardarContacto = document.getElementById("btnGuardarContacto");
btnGuardarContacto?.addEventListener("click", guardarDatosContacto);

async function guardarDatosContacto() {
  const data = {
    toggleWhatsapp: document.getElementById("toggleWhatsapp").checked,
    toggleInstagram: document.getElementById("toggleInstagram").checked,
    toggleTiktok: document.getElementById("toggleTiktok").checked,
    toggleX: document.getElementById("toggleX").checked,
    toggleFacebook: document.getElementById("toggleFacebook").checked,
    toggleWeb: document.getElementById("toggleWeb").checked,

    whatsappContacto: document.getElementById("whatsappContacto").value.trim(),
    instagramContacto: document
      .getElementById("instagramContacto")
      .value.trim(),
    tiktokContacto: document.getElementById("tiktokContacto").value.trim(),
    xContacto: document.getElementById("xContacto").value.trim(),
    facebookContacto: document.getElementById("facebookContacto").value.trim(),
    webContacto: document.getElementById("webContacto").value.trim(),
  };

  await setDoc(doc(db, "configuracion", "social"), data);

  Swal.fire({
    icon: "success",
    title: "Datos guardados",
    text: "Los datos de contacto se guardaron correctamente",
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
  const docRef = doc(db, "configuracion", "datosBancarios");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const { nombreBanco, cbuBanco, aliasBanco, titularBanco } = docSnap.data();

    document.getElementById("nombreBanco").value = nombreBanco || "";
    document.getElementById("cbuBanco").value = cbuBanco || "";
    document.getElementById("aliasBanco").value = aliasBanco || "";
    document.getElementById("titularBanco").value = titularBanco || "";
  }

  const docSnapContacto = await getDoc(doc(db, "configuracion", "social"));
  if (!docSnapContacto.exists()) return;

  const data = docSnapContacto.data();
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

document.querySelectorAll(".toggle-red").forEach((toggle) => {
  toggle.addEventListener("change", () => {
    const fieldId = toggle.dataset.target;
    const input = document.getElementById(fieldId);

    if (!input) return;

    input.disabled = !toggle.checked;

    if (!toggle.checked) {
      input.classList.add("disabled-input");
      input.value = "";
    } else {
      input.classList.remove("disabled-input");
    }
  });

  toggle.dispatchEvent(new Event("change"));
});

ObtenerDatosGuardadosDB();
cargarEntradasPendientes();
cargarEmpleados();

// ==========================================================
//   HABILITAR / DESHABILITAR MÉTODOS DE INICIO DE SESIÓN
//   (Siempre debe quedar al menos 1 activo)
// ==========================================================

const togglesLogin = [
  document.getElementById("toggleLoginGoogle"),
  document.getElementById("toggleLoginFacebook"),
  document.getElementById("toggleLoginPhone"),
];

// Cargar estado inicial desde Firestore
async function cargarLoginSettingsAdmin() {
  const docSnap = await getDoc(doc(db, "configuracion", "loginMetodos"));
  if (!docSnap.exists()) return;

  loginSettingsActual = docSnap.data(); // ✔ GUARDAR EN VARIABLE GLOBAL

  const toggleGoogle = document.getElementById("toggleLoginGoogle");
  const toggleFacebook = document.getElementById("toggleLoginFacebook");
  const togglePhone = document.getElementById("toggleLoginPhone");

  if (loginSettingsActual.google !== undefined)
    toggleGoogle.checked = loginSettingsActual.google;

  if (loginSettingsActual.facebook !== undefined)
    toggleFacebook.checked = loginSettingsActual.facebook;

  if (loginSettingsActual.phone !== undefined)
    togglePhone.checked = loginSettingsActual.phone;

  console.log("CARGANDO");
  // ⭐ IMPORTANTE: disparar los eventos change para actualizar la UI
  toggleGoogle.dispatchEvent(new Event("change"));
  toggleFacebook.dispatchEvent(new Event("change"));
  togglePhone.dispatchEvent(new Event("change"));
}

// Guardar cambios en Firestore
async function guardarLoginSettings() {
  await setDoc(doc(db, "configuracion", "loginMetodos"), {
    google: document.getElementById("toggleLoginGoogle").checked,
    facebook: document.getElementById("toggleLoginFacebook").checked,
    phone: document.getElementById("toggleLoginPhone").checked,
  });
}

// VALIDACIÓN: siempre debe quedar al menos 1 método activo
togglesLogin.forEach((toggle) => {
  toggle.addEventListener("change", async () => {
    const habilitados = togglesLogin.filter((t) => t.checked).length;

    if (habilitados === 0) {
      toggle.checked = true;
      Swal.fire({
        icon: "error",
        title: "No permitido",
        text: "Debe haber al menos un método de inicio de sesión habilitado.",
      });
      return;
    }

    // Guardar cambios
    await guardarLoginSettings();

    // ACTUALIZAR LA VARIABLE CON LOS NUEVOS VALORES
    loginSettingsActual = {
      google: document.getElementById("toggleLoginGoogle").checked,
      facebook: document.getElementById("toggleLoginFacebook").checked,
      phone: document.getElementById("toggleLoginPhone").checked,
    };
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  // Esperar un pequeño delay para garantizar que el DOM cargó completamente
  setTimeout(async () => {
    await cargarLoginSettingsAdmin();
  }, 50);
});

export async function notificarAprobacionEntrada(
  usuarioId,
  nombreEvento,
  cantidad
) {
  console.log("📤 Enviando notificación...", {
    usuarioId,
    nombreEvento,
    cantidad,
  });

  await addDoc(collection(db, "notificaciones"), {
    usuarioId,
    nombreEvento,
    cantidad,
    tipo: "entrada_aprobada",
    leida: false,
    creadoEn: new Date(),
  });

  console.log("✅ Notificación insertada correctamente");
}
