// /js/entradas.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { generarQr } from "./generarQr.js";
import { db, auth } from "./firebase.js";
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
export async function crearEntrada(eventoId, entradaData, pagado = true) {
  try {
    if (!auth.currentUser) throw new Error("Usuario no logueado");

    const docRef = await addDoc(
      collection(db, pagado ? "entradas" : "entradasPendientes"),
      {
        eventoId,
        ...entradaData,
        creadaEn: new Date().toISOString(),
        usado: false,
        pagado,
        usuarioId: auth.currentUser.uid,
        usuarioNombre: auth.currentUser.displayName || "Usuario",
        estado: pagado ? "aprobada" : "pendiente",
      }
    );

    if (pagado) {
      generarQr({
        ticketId: docRef.id,
        nombreEvento: entradaData.nombre || "Evento sin nombre",
        usuario: auth.currentUser.displayName || "Usuario",
        fecha: entradaData.fecha,
        lugar: entradaData.lugar,
        precio: entradaData.precio ?? 0,
      });
      return docRef;
    } else {
      Swal.fire(
        "✅ Solicitud de entrada registrada",
        "Envía el comprobante para que un administrador apruebe la solicitud y genere la/s entrada/s.",
        "success"
      );
    }
  } catch (err) {
    console.error("❌ Error creando entrada en Firestore:", err);
    Swal.fire("Error", "No se pudo guardar la entrada.", "error");
  }
}

/**
 * Pedir entrada (gratuita, Mercado Pago o Transferencia)
 * @param {string} eventoId
 * @param {object} e - datos del evento
 */
export async function pedirEntrada(eventoId, e) {
  try {
    // Validar login
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

    // Obtener evento
    const eventoRef = doc(db, "eventos", eventoId);
    const eventoSnap = await getDoc(eventoRef);
    if (!eventoSnap.exists())
      return Swal.fire("Error", "No se encontró el evento.", "error");

    const entradasPorUsuario = eventoSnap.data().entradasPorUsuario || 5;

    // Contar entradas compradas
    const snapshot = await getDocs(
      query(
        collection(db, "entradas"),
        where("eventoId", "==", eventoId),
        where("usuarioId", "==", usuarioId)
      )
    );

    const entradasCompradas = snapshot.docs.length;
    if (entradasCompradas >= entradasPorUsuario) {
      return Swal.fire(
        "Límite alcanzado",
        `Ya compraste el máximo de ${entradasPorUsuario} entradas para este evento.`,
        "warning"
      );
    }

    // Si es gratis → directa
    if (!e.precio || e.precio < 1) {
      const cantidad = 1; // valor por defecto para entradas gratuitas
      return await crearEntrada(eventoId, {
        nombre: e.nombre,
        precio: 0,
        fecha: e.fecha,
        lugar: e.lugar,
        cantidad: cantidad,
      });
    }

    // Elegir método de pago y cantidad
    const { value: metodo, isDenied } = await Swal.fire({
      title: e.nombre,
      html: `
        <p>Precio por entrada: <strong>$${e.precio}</strong></p>
        <label for="swal-cantidad">Cantidad (máx ${
          entradasPorUsuario - entradasCompradas
        }):</label>
        <input type="number" id="swal-cantidad" class="swal2-input"
               min="1" max="${
                 entradasPorUsuario - entradasCompradas
               }" value="1">
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Mercado Pago",
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
    // Validar límite elegido manualmente
    if (cantidad > entradasPorUsuario - entradasCompradas) {
      return Swal.fire({
        icon: "warning",
        title: "Límite superado",
        text: `Solo puedes solicitar ${
          entradasPorUsuario - entradasCompradas
        } entradas.`,
      });
    }
    // Base para crear entradas
    const entradaBase = {
      nombre: e.nombre,
      precio: Number(e.precio),
      fecha: e.fecha,
      lugar: e.lugar,
      cantidad: cantidad,
    };

    // Pago por transferencia
    if (isDenied) {
      const cuentaBancaria = `
Banco: Banco Ejemplo
CBU: 1234567890123456789012
Alias: MI.ALIAS.BANCO
Titular: Juan Pérez
  `;

      const result = await Swal.fire({
        title: "Transferencia bancaria",
        html: `
      <p>Realiza la transferencia y luego envía el comprobante.</p>
      <pre style="text-align:left;background:#f0f0f0;padding:10px;border-radius:5px;">${cuentaBancaria}</pre>
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

      // ------ Enviar comprobante por WhatsApp ------
      if (result.isConfirmed) {
        const mensaje = encodeURIComponent(
          `Hola! Solicitó ${cantidad} entrada(s) del evento "${e.nombre}". Adjunto comprobante de pago.`
        );
        window.open(`https://wa.me/541121894427?text=${mensaje}`, "_blank");

        // Generar solicitud de aprobación
        await crearSolicitudPendiente(eventoId, usuarioId, entradaBase);

        return Swal.fire(
          "Solicitud enviada",
          "Se registró la solicitud y puedes compartir el comprobante ahora.",
          "success"
        );
      }

      // ------ Copiar datos bancarios ------
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
            `Hola! Solicitó ${cantidad} entrada(s) del evento "${e.nombre}". Adjunto comprobante de pago.`
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

      // ------ Cancelar ------
      return Swal.fire("Cancelado", "No se generó ninguna orden.", "info");
    }

    // MERCADO PAGO
    const res = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: e.nombre,
        quantity: cantidad,
        price: e.precio,
        eventoId: eventoId,
        usuarioId: usuarioId,
      }),
    });

    const data = await res.json();

    if (!data.init_point) {
      return Swal.fire("Error", "No se pudo iniciar el pago.", "error");
    }

    // Ir al checkout de Mercado Pago
    window.location.href = data.init_point;
  } catch (err) {
    console.error("❌ Error en pedirEntrada:", err);
    Swal.fire("Error", "Ocurrió un error al procesar la entrada.", "error");
  }
}

/**
 * Escuchar pagos pendientes para usuario
 */
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

/**
 * Registrar transferencia pendiente manualmente
 */
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
async function crearSolicitudPendiente(eventoId, usuarioId, entradaBase) {
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
}
