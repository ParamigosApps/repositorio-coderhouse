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

    // Recuperar info de la preferencia
    const externalReference = pago.external_reference; // "usuarioId_eventoId_timestamp"
    const [usuarioId, eventoId, timestamp] = externalReference.split("_");

    const item = pago.items?.[0] || pago.additional_info?.items?.[0];
    if (!item) return res.status(400).json({ error: "No hay item en pago" });

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

    const docRef = await firestore.collection("entradas").add({
      eventoId,
      ...entradaData,
    });

    console.log("✅ Entrada creada con ID:", docRef.id);

    return res.status(200).json({ ok: true, entradaId: docRef.id });
  } catch (err) {
    console.error("❌ Error webhook MP:", err);
    return res.status(500).json({ error: err.message });
  }
}
