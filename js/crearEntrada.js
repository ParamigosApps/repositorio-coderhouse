// js/crearEntrada.js
import { generarQr } from "./generarQr.js";

export async function crearEntrada(eventoId, nombreEvento) {
  // acá usás los datos reales
  const entrada = {
    id: crypto.randomUUID(),
    eventoId,
    nombreEvento: nombreEvento || "Evento sin nombre",
    usuario: "Invitado",
    fecha: new Date().toLocaleString(),
    lugar: "Lugar a definir",
  };

  // genera el QR con los datos correctos
  generarQr(entrada);

  console.log("Entrada generada:", entrada);
}
