// /js/entradas.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { db, auth } from "/js/firebase.js"; // Usamos tu firebase.js local
import { formatearFecha } from "/js/utils.js";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

// =======================================================
// GENERADOR DE QR
// =======================================================
export function generarQr(ticketId, entradaData) {
  console.log("🟦 generarQr() ejecutado con:", ticketId, entradaData);

  const qrcodeContainer = document.getElementById("qrcode");
  const ticketInfo = document.getElementById("ticketInfo");
  const downloadLink = document.getElementById("downloadQr");
  const qrModalEl = document.getElementById("qrModal");

  if (!qrcodeContainer || !ticketInfo || !downloadLink || !qrModalEl)
    return console.warn("⚠ Faltan elementos del DOM para mostrar el QR");

  qrcodeContainer.innerHTML = "";

  ticketInfo.innerHTML = `
    🧾 Ticket: ${ticketId}<br>
    🎟 Evento: ${entradaData.nombre}<br>
    📅 Fecha: ${
      entradaData.fecha ? formatearFecha(entradaData.fecha) : "Sin fecha"
    }<br>
    📍 Lugar: ${entradaData.lugar || "No especificado"}<br>
    💲 Precio: ${entradaData.precio}
  `;

  new QRCode(qrcodeContainer, {
    text: ticketId,
    width: 200,
    height: 200,
    correctLevel: QRCode.CorrectLevel.H,
  });

  setTimeout(() => {
    const img = qrcodeContainer.querySelector("img");
    if (!img) return console.warn("⚠ No se encontró imagen QR aún");
    downloadLink.href = img.src;
    downloadLink.download = `entrada_${ticketId}.png`;
    downloadLink.style.display = "inline-block";
  }, 600);

  new bootstrap.Modal(qrModalEl).show();
}

// =======================================================
// CREAR ENTRADA + MOSTRAR QR
// =======================================================
export async function crearEntrada(eventoId, entradaData) {
  try {
    const docRef = await addDoc(collection(db, "entradas"), {
      eventoId,
      ...entradaData,
      creadaEn: new Date().toISOString(),
      usado: false,
      pagado: true,
      usuarioId: auth.currentUser ? auth.currentUser.uid : null,
    });

    console.log("🧾 Entrada creada con ID:", docRef.id);

    const qrContainer = document.createElement("div");
    qrContainer.style.textAlign = "center";
    qrContainer.innerHTML = `
      <p>🧾 Ticket: ${docRef.id}</p>
      <p>🎟 Evento: ${entradaData.nombre}</p>
      <p>📅 Fecha: ${
        entradaData.fecha ? formatearFecha(entradaData.fecha) : "Sin fecha"
      }</p>
      <p>📍 Lugar: ${entradaData.lugar || "No especificado"}</p>
      <p>💲 Precio: $${entradaData.precio}</p>
      <div id="swal-qrcode" style="margin:0 auto"></div>
      <a id="downloadQr" style="display:none; margin-top:10px;" class="btn btn-primary">Descargar QR</a>
    `;

    await Swal.fire({
      title: "🎫 Tu entrada",
      html: qrContainer,
      showConfirmButton: true,
      confirmButtonText: "Cerrar",
      width: 350,
    });

    const qrEl = qrContainer.querySelector("#swal-qrcode");
    new QRCode(qrEl, {
      text: docRef.id,
      width: 200,
      height: 200,
      correctLevel: QRCode.CorrectLevel.H,
    });

    setTimeout(() => {
      const img = qrEl.querySelector("img");
      const downloadLink = qrEl.parentElement.querySelector("#downloadQr");
      if (img && downloadLink) {
        downloadLink.href = img.src;
        downloadLink.download = `entrada_${docRef.id}.png`;
        downloadLink.style.display = "inline-block";
      }
    }, 500);
  } catch (err) {
    console.error("❌ Error creando entrada en Firestore:", err);
    Swal.fire("Error", "No se pudo guardar la entrada.", "error");
  }
}

// =======================================================
// PEDIR ENTRADA CON MP + TRANSFERENCIA (optimizado)
// =======================================================
export async function pedirEntrada(eventoId, e, maxEntradasPorUsuario = 5) {
  try {
    if (!auth.currentUser) {
      return Swal.fire({
        title: "Debes iniciar sesión",
        text: "Solo los usuarios con Google Sign-In pueden comprar entradas.",
        icon: "warning",
        confirmButtonText: "Iniciar sesión",
        customClass: { confirmButton: "btn btn-dark" },
        buttonsStyling: false,
      }).then(() => {
        const collapseUsuario = document.getElementById("collapseUsuario");
        new bootstrap.Collapse(collapseUsuario, { toggle: true });
        document.querySelectorAll(".accordion-collapse").forEach((el) => {
          if (el !== collapseUsuario)
            new bootstrap.Collapse(el, { toggle: false }).hide();
        });
        collapseUsuario.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }

    const usuarioId = auth.currentUser.uid;

    // Contar entradas ya compradas
    const snapshot = await getDocs(
      query(
        collection(db, "entradas"),
        where("eventoId", "==", eventoId),
        where("usuarioId", "==", usuarioId)
      )
    );

    const entradasCompradas = snapshot.docs.reduce(
      (total, doc) => total + (doc.data().cantidad || 0),
      0
    );

    if (entradasCompradas >= maxEntradasPorUsuario) {
      return Swal.fire(
        "Límite alcanzado",
        `Ya compraste el máximo de ${maxEntradasPorUsuario} entradas para este evento.`,
        "warning"
      );
    }

    // Entrada gratuita
    if (e.precio === 0) {
      await crearEntrada(eventoId, {
        nombre: e.nombre,
        precio: 0,
        cantidad: 1,
        fecha: e.fecha,
        lugar: e.lugar,
      });
      return Swal.fire(
        "Entrada gratuita",
        "Tu entrada ha sido generada.",
        "success"
      );
    }

    // Pedir cantidad de entradas
    const { value: metodo } = await Swal.fire({
      title: `${e.nombre}`,
      html: `
        <p>Precio por entrada: $${e.precio}</p>
        <label for="swal-cantidad">Cantidad de entradas (máx ${
          maxEntradasPorUsuario - entradasCompradas
        }):</label>
        <input type="number" id="swal-cantidad" class="swal2-input" min="1" max="${
          maxEntradasPorUsuario - entradasCompradas
        }" value="1">
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Mercado Pago",
      denyButtonText: "Transferencia",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        const cantidadInput = document.getElementById("swal-cantidad");
        cantidadInput.addEventListener("input", () => {
          let cantidad = parseInt(cantidadInput.value) || 1;
          if (cantidad > maxEntradasPorUsuario - entradasCompradas)
            cantidad = maxEntradasPorUsuario - entradasCompradas;
        });
      },
    });

    if (metodo === null) return;

    const cantidadInput = document.getElementById("swal-cantidad");
    const cantidad = parseInt(cantidadInput.value) || 1;

    const entradaData = {
      nombre: e.nombre,
      precio: Number(e.precio),
      cantidad,
      fecha: e.fecha,
      lugar: e.lugar,
    };

    // =============================
    // MERCADO PAGO
    // =============================
    if (metodo === true) {
      const prefPayload = {
        items: [
          {
            title: e.nombre,
            quantity: cantidad,
            unit_price: Number(e.precio),
            category_id: "entradas",
            fecha: e.fecha,
            lugar: e.lugar,
            imagenEventoUrl: e.imagenUrl,
          },
        ],
        payer: {
          name: auth.currentUser.displayName || "Usuario",
          email: auth.currentUser.email,
        },
        external_reference: `${usuarioId}_${eventoId}_${Date.now()}`,
      };

      const resp = await fetch("/api/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefPayload),
      });

      const data = await resp.json();
      if (!data.init_point)
        return Swal.fire("Error", "No se pudo crear el pago.", "error");

      // Abrir checkout en nueva ventana
      const mpWindow = window.open(data.init_point, "_blank");

      // Contador de 5 minutos
      let tiempo = 300; // segundos
      Swal.fire({
        title: "Esperando confirmación...",
        html: `Tienes <strong>5:00</strong> minutos para completar el pago.`,
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          const timerInterval = setInterval(() => {
            const minutos = Math.floor(tiempo / 60);
            const segundos = tiempo % 60;
            Swal.update({
              html: `Tienes <strong>${minutos}:${segundos
                .toString()
                .padStart(2, "0")}</strong> minutos para completar el pago.`,
            });
            tiempo--;
            if (tiempo < 0) clearInterval(timerInterval);
          }, 1000);
        },
      });

      setTimeout(() => {
        Swal.fire({
          title: "Tiempo expirado",
          text: "No se confirmó el pago dentro de los 5 minutos. Por favor, intenta nuevamente.",
          icon: "warning",
          confirmButtonText: "Aceptar",
        });
        if (mpWindow && !mpWindow.closed) mpWindow.close();
      }, 300000);

      // ❗ Entrada se genera solo desde Webhook de Mercado Pago
    }

    // =============================
    // TRANSFERENCIA
    // =============================
    else if (metodo === false) {
      const cuenta = "Banco XYZ\nCBU: 1234567890123456789012\nAlias: MI_ALIAS";
      const monto = cantidad * e.precio;

      await Swal.fire({
        title: "Transferencia",
        html: `
          <p>Debe transferir <strong>$${monto}</strong> a la siguiente cuenta:</p>
          <pre style="background:#f2f2f2; padding:10px; border-radius:5px;">${cuenta}</pre>
          <p>Envía comprobante por WhatsApp para recibir tus QR de ingreso.</p>
        `,
        showCancelButton: true,
        showConfirmButton: true,
        confirmButtonText: "Enviar comprobante por WhatsApp",
        cancelButtonText: "Salir",
        focusConfirm: false,
      }).then(async (result) => {
        if (result.isConfirmed) {
          const mensaje = encodeURIComponent(
            `Hola, ya realicé la transferencia de $${monto} para el evento "${e.nombre}".`
          );
          window.open(`https://wa.me/5491123456789?text=${mensaje}`, "_blank");
          await crearEntrada(eventoId, entradaData);
        }
      });
    }
  } catch (err) {
    console.error("❌ Error en pedirEntrada:", err);
    Swal.fire("Error", "Ocurrió un error al procesar el pago.", "error");
  }
}
