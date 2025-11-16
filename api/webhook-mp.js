// /api/webhook-mercadopago.js
import admin from "firebase-admin";

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const firestore = admin.firestore();

export default async function handler(req, res) {
  try {
    // Solo permitir POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const mpData = req.body;
    console.log("📩 Webhook recibido:", mpData);

    // Validar pago aprobado
    const pago = mpData.data ? mpData.data : mpData;
    if (!pago || pago.status !== "approved") {
      console.log("⏸ Pago no aprobado, no se crea entrada.");
      return res.status(200).json({ ok: true });
    }

    // Recuperar info de la preferencia (external_reference)
    // Formato esperado: "usuarioId_eventoId_timestamp"
    const externalReference = pago.external_reference;
    if (!externalReference) {
      console.warn("⚠ Sin external_reference en el pago");
      return res.status(400).json({ error: "Falta external_reference" });
    }

    const [usuarioId, eventoId, timestamp] = externalReference.split("_");
    if (!usuarioId || !eventoId) {
      console.warn("⚠ External_reference mal formado:", externalReference);
      return res.status(400).json({ error: "External_reference inválido" });
    }

    // Obtener el item comprado
    const item = pago.items?.[0] || pago.additional_info?.items?.[0];
    if (!item) return res.status(400).json({ error: "No hay item en pago" });

    // Datos de la entrada
    const entradaData = {
      nombre: item.title,
      precio: Number(item.unit_price),
      cantidad: item.quantity || 1,
      fecha: item.fecha || null,
      lugar: item.lugar || null,
      creadaEn: new Date().toISOString(),
      pagado: true,
      usado: false,
      usuarioId,
    };

    // Guardar entrada en Firestore
    const docRef = await firestore.collection("entradas").add({
      eventoId,
      ...entradaData,
    });

    console.log("✅ Entrada creada con ID:", docRef.id);

    // ---------------------------------------------
    // REGISTRAR PAGO PROCESADO para evitar duplicados
    // ---------------------------------------------
    const eventoPagoRef = await firestore.collection("pagosProcesados").add({
      ticketId: docRef.id,
      usuarioId,
      eventoId,
      creadoEn: new Date().toISOString(),
    });

    console.log(
      "💾 Pago registrado en pagosProcesados con ID:",
      eventoPagoRef.id
    );

    return res.status(200).json({ ok: true, entradaId: docRef.id });
  } catch (err) {
    console.error("❌ Error webhook MP:", err);
    return res.status(500).json({ error: err.message });
  }
}
