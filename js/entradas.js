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
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

export async function crearEntrada(eventoId, entradaData) {
  try {
    const docRef = await addDoc(collection(db, "entradas"), {
      eventoId,
      ...entradaData,
      creadaEn: new Date().toISOString(),
      usado: false,
      pagado: true,
      usuarioId: auth.currentUser.uid,
    });

    generarQr({
      ticketId: docRef.id,
      nombreEvento: entradaData.nombre || "Evento sin nombre",
      usuario: auth.currentUser.displayName || "Usuario",
      fecha: entradaData.fecha,
      lugar: entradaData.lugar,
      precio: entradaData.precio ?? 0,
    });
  } catch (err) {
    console.error("❌ Error creando entrada en Firestore:", err);
    Swal.fire("Error", "No se pudo guardar la entrada.", "error");
  }
}

export async function pedirEntrada(eventoId, e) {
  try {
    if (!auth.currentUser) {
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
    const eventoRef = doc(db, "eventos", eventoId);
    const eventoSnap = await getDoc(eventoRef);
    if (!eventoSnap.exists())
      return Swal.fire("Error", "No se encontró el evento.", "error");

    const entradasPorUsuario = eventoSnap.data().entradasPorUsuario || 5;

    const snapshot = await getDocs(
      query(
        collection(db, "entradas"),
        where("eventoId", "==", eventoId),
        where("usuarioId", "==", usuarioId)
      )
    );

    const entradasCompradas = snapshot.docs.reduce(
      (total, doc) => total + (doc.data().cantidad || 1),
      0
    );

    if (entradasCompradas >= entradasPorUsuario) {
      return Swal.fire(
        "Límite alcanzado",
        `Ya compraste el máximo de ${entradasPorUsuario} entradas para este evento.`,
        "warning"
      );
    }

    // Entrada gratuita
    if (!e.precio || e.precio === 0) {
      return crearEntrada(eventoId, {
        nombre: e.nombre || "Evento sin nombre",
        precio: 0,
        cantidad: 1,
        fecha: e.fecha,
        lugar: e.lugar,
      });
    }

    const { value: metodo } = await Swal.fire({
      title: e.nombre || "Evento sin nombre",
      html: `
        <p>Precio por entrada: $${e.precio}</p>
        <label for="swal-cantidad">Cantidad de entradas (máx ${
          entradasPorUsuario - entradasCompradas
        }):</label>
        <input type="number" id="swal-cantidad" class="swal2-input" min="1" max="${
          entradasPorUsuario - entradasCompradas
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
          if (cantidad > entradasPorUsuario - entradasCompradas)
            cantidadInput.value = entradasPorUsuario - entradasCompradas;
          else if (cantidad < 1) cantidadInput.value = 1;
        });
      },
    });

    if (metodo === null) return;

    const cantidad =
      parseInt(document.getElementById("swal-cantidad").value) || 1;

    const entradaData = {
      nombre: e.nombre || "Evento sin nombre",
      precio: Number(e.precio),
      cantidad,
      fecha: e.fecha,
      lugar: e.lugar,
    };

    // Aquí puedes seguir con tu integración de Mercado Pago o Transferencia
    await crearEntrada(eventoId, entradaData);
  } catch (err) {
    console.error("❌ Error en pedirEntrada:", err);
    Swal.fire("Error", "Ocurrió un error al procesar la entrada.", "error");
  }
}

// Escuchar pagos pendientes
export function escucharEntradasPendientes(usuarioId, callback) {
  const q = query(
    collection(db, "pagosProcesados"),
    where("usuarioId", "==", usuarioId),
    orderBy("creadoEn", "desc"),
    limit(1)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        callback(change.doc.data().ticketId);
      }
    });
  });

  return unsubscribe;
}
