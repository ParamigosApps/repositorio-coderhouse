// /js/entradas.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { generarQr } from "./generarQr.js";
import { db, auth } from "./firebase.js";
import { formatearFecha } from "./utils.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

/**
 * Crear entrada en Firestore
 * @param {string} eventoId
 * @param {object} entradaData
 * @param {boolean} [pagado=true] - true = pagado, false = pendiente
 */

export async function crearEntrada(
  eventoId,
  entradaData,
  pagado = true,
  modoAdmin = false
) {
  try {
    if (!auth.currentUser) throw new Error("Usuario no logueado");

    const cantidadFinal = Number(entradaData.cantidad) || 1;

    const docRef = await addDoc(
      collection(db, pagado ? "entradas" : "entradasPendientes"),
      {
        eventoId,
        ...entradaData,
        cantidad: cantidadFinal,
        creadaEn: new Date().toISOString(),
        usado: false,
        pagado,
        usuarioId: auth.currentUser.uid,
        usuarioNombre: auth.currentUser.displayName || "Usuario",
        estado: pagado ? "aprobada" : "pendiente",
      }
    );

    if (pagado && !modoAdmin) {
      // Solo mostramos QR al usuario, no al admin
      const valorEntrada =
        !entradaData.precio || entradaData.precio < 1
          ? "Entrada gratuita"
          : `$${entradaData.precio}`;

      await generarQr({
        ticketId: docRef.id,
        nombreEvento: entradaData.nombre || "Evento sin nombre",
        usuario: auth.currentUser.displayName || "Usuario",
        fecha: entradaData.fecha,
        lugar: entradaData.lugar,
        precio: valorEntrada,
        modoAdmin, // aunque lo pasemos, generarQr puede usarlo para no mostrar
      });
    } else if (!pagado) {
      Swal.fire(
        "✅ Solicitud de entrada registrada",
        "Envía el comprobante para que un administrador apruebe la solicitud.",
        "success"
      );
    }

    return docRef;
  } catch (err) {
    console.error("Error creando entrada:", err);
    Swal.fire("Error", "No se pudo guardar la entrada.", "error");
  }
}

/**
//               Pedir entrada (gratuita, Mercado Pago o Transferencia)
 * @param {string} eventoId
 * @param {object} e - datos del evento
 */
export async function pedirEntrada(eventoId, e) {
  try {
    // --------------------------- VALIDAR LOGIN ---------------------------
    if (!auth.currentUser) {
      const usuarioCollapseEl = document.getElementById("collapseUsuario");
      new bootstrap.Collapse(usuarioCollapseEl, { toggle: true });
      usuarioCollapseEl.scrollIntoView({ behavior: "smooth", block: "start" });

      return Swal.fire({
        title: "Debes iniciar sesión",
        text: "Solo los usuarios con Google Sign-In pueden comprar entradas.",
        icon: "warning",
        confirmButtonText: "Iniciar sesión",
        customClass: { confirmButton: "btn btn-dark" },
        buttonsStyling: false,
      });
    }

    const usuarioId = auth.currentUser.uid;
    const usuarioNombre = auth.currentUser.displayName || "Usuario";

    // --------------------------- OBTENER EVENTO ---------------------------
    const eventoRef = doc(db, "eventos", eventoId);
    const eventoSnap = await getDoc(eventoRef);
    if (!eventoSnap.exists())
      return Swal.fire("Error", "No se encontró el evento.", "error");

    const entradasPorUsuario = eventoSnap.data().entradasPorUsuario || 4;

    // --------------------------- CALCULAR ENTRADAS EXISTENTES ---------------------------
    const entradasCompradasSnap = await getDocs(
      query(
        collection(db, "entradas"),
        where("eventoId", "==", eventoId),
        where("usuarioId", "==", usuarioId)
      )
    );
    const entradasCompradas = entradasCompradasSnap.docs.reduce(
      (acc, d) => acc + (d.data().cantidad || 1),
      0
    );

    const pendientesSnap = await getDocs(
      query(
        collection(db, "entradasPendientes"),
        where("eventoId", "==", eventoId),
        where("usuarioId", "==", usuarioId)
      )
    );
    const pendientes = pendientesSnap.docs.reduce(
      (acc, d) => acc + (d.data().cantidad || 1),
      0
    );

    const totalActual = entradasCompradas + pendientes;

    // --------------------------- VALIDAR LÍMITE TOTAL ---------------------------
    if (totalActual >= entradasPorUsuario) {
      return Swal.fire({
        title: "Límite de entradas alcanzado",
        html: `
          <p>Has alcanzado el máximo de <strong>${entradasPorUsuario}</strong> entradas por usuario para este evento.</p>
          <p>Entradas compradas: <strong>${entradasCompradas}</strong></p>
          <p>Pendientes de aprobación: <strong>${pendientes}</strong></p>
          <p>Contacta al organizador ante cualquier inquietud o espera la aprobación de las solicitudes pendientes.</p>
        `,
        icon: "warning",
        confirmButtonText: "Aceptar",
        customClass: { confirmButton: "btn btn-secondary" },
        buttonsStyling: false,
      });
    }

    // --------------------------- ENTRADAS GRATIS O PAGADAS ---------------------------
    const maxEntradas = entradasPorUsuario - totalActual;
    const valorEntrada = !e.precio || e.precio < 1 ? "Gratis" : `$${e.precio}`;

    const { value: metodo, isDenied } = await Swal.fire({
      title: e.nombre,
      html: `
    <p>Valor de entrada: <strong>${valorEntrada}</strong></p>
    <label for="swal-cantidad">Cantidad (máx ${maxEntradas}):</label>
    <input type="number" id="swal-cantidad" class="swal2-input"
           min="1" max="${maxEntradas}" value="1">
  `,
      showCancelButton: true,
      showDenyButton: e.precio && e.precio > 0, // ✅ Solo mostrar si es pagada
      confirmButtonText:
        e.precio && e.precio > 0 ? "Mercado Pago" : "Solicitar",
      denyButtonText: "Transferencia",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: "btn btn-success",
        denyButton: "btn btn-dark",
        cancelButton: "btn btn-secondary",
      },
      buttonsStyling: false,
    });

    if (metodo === null) return; // canceló

    const cantidad =
      parseInt(document.getElementById("swal-cantidad").value) || 1;

    if (cantidad > maxEntradas) {
      return Swal.fire({
        icon: "warning",
        title: "Límite superado",
        text: `Solo puedes solicitar ${maxEntradas} entradas.`,
      });
    }

    const entradaBase = {
      nombre: e.nombre,
      precio: Number(e.precio),
      fecha: e.fecha,
      lugar: e.lugar,
      horario: e.horario || "A confirmar",
      cantidad,
    };

    // --------------------------- ENTRADAS GRATIS ---------------------------
    if (!e.precio || e.precio < 1) {
      return await crearEntrada(eventoId, entradaBase);
    }

    // --------------------------- PAGO POR TRANSFERENCIA ---------------------------
    if (isDenied) {
      const datos = await obtenerDatosBancarios();
      const cuentaBancaria = `
Banco: ${datos.nombreBanco}
CBU: ${datos.cbuBanco}
Alias: ${datos.aliasBanco}
Titular: ${datos.titularBanco}
  `;

      const result = await Swal.fire({
        title: "Transferencia bancaria",
        html: `
          <p>Realiza la transferencia y luego envía el comprobante.</p>
          <pre style="text-align:left;background:#f0f0f0;padding:2px;border-radius:5px;">${cuentaBancaria}</pre>
        `,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Enviar comprobante por WhatsApp",
        denyButtonText: "Copiar datos",
        cancelButtonText: "Cancelar orden",
        customClass: {
          confirmButton: "btn btn-success",
          denyButton: "btn btn-dark",
          cancelButton: "btn btn-secondary",
        },
        buttonsStyling: false,
      });

      if (result.isConfirmed) {
        const mensaje = encodeURIComponent(
          `¡Hola, soy ${usuarioNombre}! y solicité ${cantidad} entrada(s) del evento "${e.nombre}" a través de la web. Adjunto comprobante de pago.`
        );
        window.open(`https://wa.me/541121894427?text=${mensaje}`, "_blank");
        await crearSolicitudPendiente(eventoId, usuarioId, entradaBase);
        return Swal.fire(
          "Solicitud enviada",
          "Se registró la solicitud y puedes compartir el comprobante ahora.",
          "success"
        );
      }

      if (result.isDenied) {
        await navigator.clipboard.writeText(cuentaBancaria);
        const afterCopy = await Swal.fire({
          title: "Datos copiados ✔️",
          text: "¿Qué deseas hacer ahora?",
          showCancelButton: true,
          showConfirmButton: true,
          confirmButtonText: "Enviar comprobante por WhatsApp",
          cancelButtonText: "Cancelar orden",
          customClass: {
            confirmButton: "btn btn-success",
            cancelButton: "btn btn-secondary",
          },
          buttonsStyling: false,
        });

        if (afterCopy.isConfirmed) {
          const mensaje = encodeURIComponent(
            `¡Hola, soy ${usuarioNombre}! y solicité ${cantidad} entrada(s) del evento "${e.nombre}" a través de la web. Adjunto comprobante de pago.`
          );
          window.open(`https://wa.me/541121894427?text=${mensaje}`, "_blank");
          await crearSolicitudPendiente(eventoId, usuarioId, entradaBase);
          return Swal.fire(
            "Solicitud enviada",
            "Ya puedes enviar el comprobante 🙂",
            "success"
          );
        }

        return Swal.fire("Cancelado", "No se generó ninguna orden.", "info");
      }

      return Swal.fire("Cancelado", "No se generó ninguna orden.", "info");
    }

    // --------------------------- MERCADO PAGO ---------------------------
    const res = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            title: e.nombre,
            quantity: cantidad,
            price: e.precio,
            fecha: e.fecha,
            lugar: e.lugar,
            usuarioId,
            eventoId,
          },
        ],
      }),
    });

    const data = await res.json();
    if (!data.init_point) {
      return Swal.fire("Error", "No se pudo iniciar el pago.", "error");
    }

    window.location.href = data.init_point;
  } catch (err) {
    console.error("❌ Error en pedirEntrada:", err);
    Swal.fire("Error", "Ocurrió un error al procesar la entrada.", "error");
  }
}

//                Escuchar pagos pendientes para usuario
export function escucharEntradasPendientes(usuarioId, callback) {
  const q = query(
    collection(db, "pagosProcesados"),
    where("usuarioId", "==", usuarioId),
    orderBy("creadoEn", "desc"),
    limit(1)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") callback(change.doc.data().ticketId);
    });
  });
}
//               Crear solicitudes pendientes
export async function crearSolicitudPendiente(
  eventoId,
  usuarioId,
  entradaBase
) {
  try {
    const existentes = await getDocs(
      query(
        collection(db, "entradasPendientes"),
        where("eventoId", "==", eventoId),
        where("usuarioId", "==", usuarioId)
      )
    );

    if (existentes.empty) {
      return await addDoc(collection(db, "entradasPendientes"), {
        eventoId,
        usuarioId,
        usuarioNombre: auth.currentUser.displayName,
        eventoNombre: entradaBase.nombre,
        cantidad: entradaBase.cantidad,
        monto: entradaBase.cantidad * entradaBase.precio,
        estado: "pendiente",
        creadaEn: new Date().toISOString(),
        fecha: entradaBase.fecha,
        lugar: entradaBase.lugar,
        horario: entradaBase.horario || "A confirmar",
        precio: entradaBase.precio,
      });
    } else {
      const ref = existentes.docs[0].ref;
      const prev = existentes.docs[0].data().cantidad || 1;
      const updatedCount = prev + entradaBase.cantidad;

      return await updateDoc(ref, {
        cantidad: updatedCount,
        monto: updatedCount * entradaBase.precio,
        actualizadaEn: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Error creando solicitud pendiente:", err);
  }
}
//               Registrar transferencia pendiente manualmente
export async function registrarTransferencia(
  usuario,
  eventoId,
  eventoNombre,
  cantidad,
  monto,
  comprobanteUrl = ""
) {
  try {
    await addDoc(collection(db, "entradasPendientes"), {
      usuarioNombre: usuario.nombre,
      usuarioEmail: usuario.email,
      eventoId,
      eventoNombre,
      cantidad,
      monto,
      comprobanteUrl,
      estado: "pendiente",
      creadoEn: serverTimestamp(),
    });

    Swal.fire(
      "✅ Registro enviado",
      "Tu pago por transferencia ha sido registrado. El administrador lo aprobará y recibirás tu entrada.",
      "success"
    );
  } catch (err) {
    console.error("Error registrando transferencia:", err);
    Swal.fire(
      "Error",
      "No se pudo registrar tu pago. Intentá nuevamente.",
      "error"
    );
  }
}

// -------------------------- CARGAR ENTRADAS --------------------------
export async function cargarEntradas() {
  const contenedor = document.getElementById("listaEntradas");
  if (!contenedor) return console.warn("⚠ listaEntradas no encontrado");

  contenedor.innerHTML = `<p class="text-secondary mt-3 text-center">Cargando entradas...</p>`;

  try {
    const usuarioId = auth.currentUser?.uid;
    if (!usuarioId) {
      contenedor.innerHTML = `<p class="text-danger mt-3 text-center">Debes iniciar sesión para ver tus entradas.</p>`;
      return;
    }

    const q = query(
      collection(db, "entradas"),
      where("usuarioId", "==", usuarioId)
    );
    const snapshot = await getDocs(q);

    contenedor.innerHTML = "";

    if (snapshot.empty) {
      contenedor.innerHTML = `<p class="text-secondary text-center">Todavía no generaste entradas.</p>`;
      return;
    }

    // Agrupar entradas por evento
    const entradasMap = {};
    snapshot.forEach((docSnap) => {
      const entrada = docSnap.data();
      const ticketId = docSnap.id;
      const key = entrada.eventoId || ticketId;

      if (!entradasMap[key]) {
        entradasMap[key] = { ...entrada, tickets: [ticketId] };
      } else {
        entradasMap[key].tickets.push(ticketId);
      }
    });

    // Renderizar entradas agrupadas
    Object.values(entradasMap).forEach((entrada) => {
      const div = document.createElement("div");
      div.className = "card mb-3 p-3 shadow-sm";

      div.innerHTML = `
        <h5 class="mb-1">${entrada.nombre || "Evento sin nombre"}</h5>
        <p class="mb-0">📅 ${formatearFecha(entrada.fecha) || "Sin fecha"}</p>
        <p class="mb-0">📍 ${entrada.lugar || "Lugar a definir"}</p>
        <p class="mb-0">🕑 ${entrada.horario || "Sin horario definido"}</p>
        <p class="mb-0">💲 ${
          entrada.precio === 0 || entrada.precio == null
            ? "Entrada gratuita"
            : `$${entrada.precio}`
        }</p>
        <p class="mb-0">🎫 Cantidad de entradas: ${entrada.tickets.length}</p>
        <button class="btn btn-dark mt-3 btn-ver-qr mx-auto d-block w-50">Ver QR</button>
      `;

      contenedor.appendChild(div);

      const btnVerQr = div.querySelector(".btn-ver-qr");

      btnVerQr.addEventListener("click", async () => {
        const tempDiv = document.createElement("div");
        tempDiv.style.textAlign = "left";

        const info = document.createElement("div");
        info.innerHTML = `
    <h5>🎟 ${entrada.nombre || "Evento sin nombre"}</h5>
    <p><strong>Fecha:</strong> ${
      formatearFecha(entrada.fecha) || "Sin fecha"
    }</p>
    <p><strong>Lugar:</strong> ${entrada.lugar || "Lugar a definir"}</p>
    <p><strong>Horario:</strong> ${
      entrada.horario || "Sin horario definido"
    }</p>
    <p><strong>Precio:</strong> ${
      entrada.precio === 0 || entrada.precio == null
        ? "Entrada gratuita"
        : `$${entrada.precio}`
    }</p>
    <p><strong>Cantidad de entradas:</strong> ${entrada.tickets.length}</p>
    <hr>
  `;
        tempDiv.appendChild(info);

        const qrSection = document.createElement("div");
        qrSection.style.display = "flex";
        qrSection.style.flexDirection = "column";
        qrSection.style.alignItems = "center";
        qrSection.style.gap = "20px";

        entrada.tickets.forEach((ticketId, i) => {
          const ticketDiv = document.createElement("div");
          ticketDiv.style.textAlign = "center";

          if (i > 0) {
            const separator = document.createElement("hr");
            separator.style.width = "80%";
            separator.style.border = "2px solid #333";
            separator.style.margin = "15px auto";
            ticketDiv.appendChild(separator);
          }

          const qrTitle = document.createElement("p");
          qrTitle.textContent = `Entrada ${i + 1}`;
          qrTitle.style.fontWeight = "bold";
          qrTitle.style.marginBottom = "12px";
          qrTitle.style.fontSize = "2rem";

          const qrContainer = document.createElement("div");
          qrContainer.id = `qrcode_${ticketId}`;
          qrContainer.style.marginBottom = "20px";

          const downloadLink = document.createElement("a");
          downloadLink.textContent = "Descargar QR";
          downloadLink.className = "btn btn-dark btn-sm";
          downloadLink.style.display = "none";
          downloadLink.style.margin = "12px 0 4px 0";

          ticketDiv.appendChild(qrTitle);
          ticketDiv.appendChild(qrContainer);
          ticketDiv.appendChild(downloadLink);
          qrSection.appendChild(ticketDiv);
        });

        tempDiv.appendChild(qrSection);

        Swal.fire({
          title: "Tus entradas 🎫",
          html: tempDiv,
          showConfirmButton: true,
          confirmButtonText: "Cerrar",
          width: 500,
          didOpen: () => {
            const qrDivs = tempDiv.querySelectorAll("[id^='qrcode_']");
            qrDivs.forEach((qrContainer) => {
              const ticketId = qrContainer.id.replace("qrcode_", "");
              const downloadLink = qrContainer.nextElementSibling; // el <a> sigue al qrContainer
              generarQr({
                ticketId,
                nombreEvento: entrada.nombre,
                usuario: auth.currentUser.displayName || "Usuario",
                fecha: entrada.fecha,
                horario: entrada.horario,
                lugar: entrada.lugar,
                precio:
                  entrada.precio === 0 || entrada.precio == null
                    ? "Entrada gratuita"
                    : `$${entrada.precio}`,
                qrContainer,
                downloadLink,
                individual: true,
                modoAdmin: false, // ⚡ asegurate de poner true si es admin
              });
            });
          },
        });
      });
    });
  } catch (err) {
    console.error("❌ Error en cargarEntradas():", err);
    contenedor.innerHTML = `<p class="text-danger text-center mt-3">Error al cargar entradas.</p>`;
  }
}

export async function obtenerDatosBancarios() {
  const docRef = doc(db, "configuracion", "datosBancarios");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) return docSnap.data();

  // Valores por defecto si no están guardados en Firestore
  return {
    nombreBanco: "Banco Ejemplo",
    cbuBanco: "1234567890123456789012",
    aliasBanco: "MI.ALIAS.BANCO",
    titularBanco: "Juan Pérez",
  };
}
