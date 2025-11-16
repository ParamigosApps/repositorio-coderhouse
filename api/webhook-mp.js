// /api/webhook-mercadopago.js
import admin from "firebase-admin";
import fetch from "node-fetch";

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

    const webhookData = req.body;
    console.log("📩 Webhook recibido:", webhookData);

    // Extraer paymentId
    const paymentId = webhookData?.data?.id;
    if (!paymentId) {
      console.warn("⚠ No se recibió paymentId en el webhook");
      return res.status(200).json({ ok: true }); // no crashea, solo ignora
    }

    // Obtener pago completo desde MP
    const mpToken = process.env.MP_ACCESS_TOKEN;
    const resp = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${mpToken}` },
      }
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("❌ Error consultando MP:", errorText);
      return res
        .status(200)
        .json({ ok: false, error: "Error al obtener pago de MP" });
    }

    const pago = await resp.json();
    console.log("💳 Pago completo desde MP:", pago);

    // Solo crear entrada si el pago está aprobado
    if (pago?.status !== "approved") {
      console.log("⏸ Pago no aprobado o incompleto, no se crea entrada.");
      return res.status(200).json({ ok: true });
    }

    // Validar external_reference
    const externalReference = pago?.external_reference;
    if (!externalReference || !externalReference.includes("_")) {
      console.warn("⚠ Pago aprobado pero external_reference inválido");
      return res.status(200).json({ ok: true });
    }

    const [usuarioId, eventoId] = externalReference.split("_");
    if (!usuarioId || !eventoId) {
      console.warn("⚠ External_reference mal formado:", externalReference);
      return res.status(200).json({ ok: true });
    }

    // Obtener item comprado
    const item = pago?.items?.[0] || pago?.additional_info?.items?.[0];
    if (!item) {
      console.warn("⚠ Pago aprobado pero sin items");
      return res.status(200).json({ ok: true });
    }

    // Crear datos de la entrada
    const entradaData = {
      nombre: item.title || "Entrada",
      precio: Number(item.unit_price || 0),
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

    // Registrar pago procesado
    await firestore.collection("pagosProcesados").add({
      ticketId: docRef.id,
      usuarioId,
      eventoId,
      creadoEn: new Date().toISOString(),
    });

    console.log("💾 Pago registrado en pagosProcesados");

    return res.status(200).json({ ok: true, entradaId: docRef.id });
  } catch (err) {
    console.error("❌ Error webhook MP:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
