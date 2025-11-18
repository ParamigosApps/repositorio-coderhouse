import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDkQEN7UMAVQQvOmWZjABmVYgVMMC4g9g0",
  authDomain: "appbar-24e02.firebaseapp.com",
  projectId: "appbar-24e02",
  storageBucket: "appbar-24e02.appspot.com",
  messagingSenderId: "339569084121",
  appId: "1:339569084121:web:be83a06de71c21f5bea0c8",
  measurementId: "G-GMHEKEPVJC",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const video = document.getElementById("camara");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const qrResultado = document.getElementById("qr-resultado");
const qrInfo = document.getElementById("qr-info-adicional");

const ticketsProcesados = new Set();

// Acceder a la cámara
navigator.mediaDevices
  .getUserMedia({ video: { facingMode: "environment" } })
  .then((stream) => {
    video.srcObject = stream;
    requestAnimationFrame(scanQR);
  })
  .catch((err) => {
    console.error("Error cámara:", err);
    qrResultado.textContent = "No se pudo acceder a la cámara.";
    qrResultado.className = "qr-resultado invalid";
  });

// Función para escanear QR
function scanQR() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      const ticketId = code.data;
      if (!ticketsProcesados.has(ticketId)) {
        ticketsProcesados.add(ticketId);
        validarTicket(ticketId);
      }
    }
  }
  requestAnimationFrame(scanQR);
}

// Validar ticket
async function validarTicket(ticketId) {
  try {
    const ticketRef = doc(db, "entradas", ticketId);
    const ticketSnap = await getDoc(ticketRef);

    // Limpiar info anterior
    qrInfo.textContent = "";

    if (!ticketSnap.exists()) {
      qrResultado.textContent = "❌ Ticket inválido";
      qrResultado.className = "qr-resultado invalid";
    } else {
      const ticketData = ticketSnap.data();
      if (ticketData.usado) {
        qrResultado.textContent = "⚠ Ticket ya usado";
        qrResultado.className = "qr-resultado used";
      } else {
        qrResultado.textContent = "✅ Ticket válido - Permitido el ingreso";
        qrResultado.className = "qr-resultado valid";
        await updateDoc(ticketRef, { usado: true });
      }

      // Mostrar información adicional
      qrInfo.textContent = `Evento: ${
        ticketData.nombre || "Sin nombre"
      } | Usuario: ${ticketData.usuarioNombre || "Desconocido"}`;
    }
  } catch (err) {
    console.error(err);
    qrResultado.textContent = "Error validando ticket";
    qrResultado.className = "qr-resultado invalid";
  }

  setTimeout(() => {
    qrResultado.textContent = "Esperando QR...";
    qrResultado.className = "qr-resultado";
    qrInfo.textContent = "";
    ticketsProcesados.delete(ticketId);
  }, 3000);
}
