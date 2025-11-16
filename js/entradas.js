// /js/entradas.js
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";
import { db } from "/js/firebase.js";
import { formatearFecha } from "./utils.js";
import {
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// =======================================================
// GENERADOR DE QR - EXPORTADO
// =======================================================
export function generarQr(ticketId, entradaData) {
  console.log("🟦 generarQr() ejecutado con:", ticketId, entradaData);

  const qrcodeContainer = document.getElementById("qrcode");
  const ticketInfo = document.getElementById("ticketInfo");
  const downloadLink = document.getElementById("downloadQr");
  const qrModalEl = document.getElementById("qrModal");

  if (!qrcodeContainer || !ticketInfo || !downloadLink || !qrModalEl) {
    return console.warn("⚠ Faltan elementos del DOM para mostrar el QR");
  }

  qrcodeContainer.innerHTML = "";

  ticketInfo.innerHTML = `
    🧾 Ticket: ${ticketId}<br>
    🎟 Evento: ${entradaData.nombreEvento}<br>
    📅 Fecha: ${
      entradaData.fecha ? formatearFecha(entradaData.fecha) : "Sin fecha"
    }<br>
    📍 Lugar: ${entradaData.lugar}<br>
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
// PEDIR ENTRADA
// =======================================================
export async function pedirEntrada(eventoId, e) {
  console.log("🎟 Iniciando pedido de entrada para:", eventoId, e);

  try {
    // Abrir SweetAlert para seleccionar cantidad y método de pago
    const { value: metodo } = await Swal.fire({
      title: `${e.nombre}`,
      html: `
        <p>Precio por entrada: $${e.precio}</p>
        <label for="swal-cantidad">Cantidad de entradas:</label>
        <input type="number" id="swal-cantidad" class="swal2-input" min="1" value="1">
        <p>Total a pagar: $<span id="swal-total">${e.precio}</span></p>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Mercado Pago",
      denyButtonText: "Transferencia",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        const cantidadInput = document.getElementById("swal-cantidad");
        const totalSpan = document.getElementById("swal-total");

        cantidadInput.addEventListener("input", () => {
          const cantidad = parseInt(cantidadInput.value) || 1;
          totalSpan.textContent = cantidad * e.precio;
        });
      },
    });

    if (metodo === null) {
      console.log("❌ Usuario canceló la operación");
      return;
    }

    // Obtener cantidad final seleccionada
    const cantidadInput = document.getElementById("swal-cantidad");
    const cantidad = parseInt(cantidadInput.value) || 1;

    const payload = {
      nombre: e.nombre,
      precio: e.precio,
      cantidad,
    };

    if (metodo === true) {
      // Mercado Pago
      console.log("📦 Payload a enviar a MP:", payload);

      const resp = await fetch("/api/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📡 Respuesta del servidor:", resp.status, resp.statusText);

      const text = await resp.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("❌ No se pudo parsear JSON:", err);
        return Swal.fire("Error", "Respuesta inválida del servidor.", "error");
      }

      if (!data.init_point) {
        console.error("❌ init_point no recibido:", data);
        return Swal.fire(
          "Error",
          "MercadoPago no devolvió un link de pago.",
          "error"
        );
      }

      console.log("🔗 Abriendo link de pago:", data.init_point);
      window.open(data.init_point, "_blank");
    } else if (metodo === false) {
      // Transferencia: mostrar datos y botones adicionales
      const cuenta = "Banco XYZ\nCBU: 1234567890123456789012\nAlias: MI_ALIAS";
      const monto = cantidad * e.precio;
      await Swal.fire({
        title: "Transferencia",
        html: `
          <p>Debe transferir <strong>$${monto}</strong> a la siguiente cuenta:</p>
          <pre style="background:#f2f2f2; padding:10px; border-radius:5px;">${cuenta}</pre>
          <p>Enviár comprobante por Whatsapp para recibir los Qr para el ingreso.</p>
        `,
        showCancelButton: true,
        showDenyButton: true,
        showConfirmButton: true,
        confirmButtonText: "Enviar comprobante por WhatsApp",
        cancelButtonText: "Salir",
        focusConfirm: false,
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire("Gracias", "Tu pago será verificado.", "success");
          // Aquí podés agregar lógica para avisar a tu backend que ya pagó
        } else if (result.isDenied) {
          const mensaje = encodeURIComponent(
            `Hola, ya realicé la transferencia de $${monto} para el evento "${e.nombre}".`
          );
          window.open(`https://wa.me/5491123456789?text=${mensaje}`, "_blank");
        }
        // Cancelar solo cierra el popup automáticamente
      });
    }
  } catch (err) {
    console.error("❌ Error en pedirEntrada:", err);
    Swal.fire("Error", "Ocurrió un error al procesar el pago.", "error");
  }
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
    });

    console.log("🧾 Entrada creada con ID:", docRef.id);
    generarQr(docRef.id, entradaData);
  } catch (err) {
    console.error("❌ Error creando entrada en Firestore:", err);
    Swal.fire("Error", "No se pudo guardar la entrada.", "error");
  }
}
