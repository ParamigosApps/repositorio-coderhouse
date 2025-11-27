// /api/webhook-mercadopago.js
import admin from "firebase-admin";
import fetch from "node-fetch";

// Inicializar Firebase Admin solo una vez
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

    // ---------------------------------------------
    // 1) Obtener paymentId
    // ---------------------------------------------
    const paymentId = webhookData?.data?.id;
    if (!paymentId) {
      console.warn("⚠ No se recibió paymentId");
      return res.status(200).json({ ok: true });
    }

    // ---------------------------------------------
    // 2) Consultar pago completo
    // ---------------------------------------------
    const resp = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!resp.ok) {
      console.error("❌ Error al obtener pago desde MP");
      return res.status(200).json({ ok: false });
    }

    const pago = await resp.json();
    console.log("💳 Pago desde MP:", pago);

    // ---------------------------------------------
    // 3) Verificar estado
    // ---------------------------------------------
    if (pago.status !== "approved") {
      console.log("⏸ Pago no aprobado, ignorando.");
      return res.status(200).json({ ok: true });
    }

    // ---------------------------------------------
    // 4) external_reference
    // ---------------------------------------------
    const externalReference = pago.external_reference;
    if (!externalReference || !externalReference.includes("_")) {
      console.warn("⚠ external_reference inválido:", externalReference);
      return res.status(200).json({ ok: true });
    }

    const [usuarioId, eventoId] = externalReference.split("_");
    console.log("👤 Usuario:", usuarioId, "🎉 Evento:", eventoId);

    // ---------------------------------------------
    // 5) Obtener item comprado
    // ---------------------------------------------
    const item = pago.items?.[0] || pago.additional_info?.items?.[0] || null;

    if (!item) {
      console.warn("⚠ Pago sin items");
      return res.status(200).json({ ok: true });
    }

    // ---------------------------------------------
    // 6) Prevenir entradas duplicadas
    //    MP puede mandar 2 o 3 webhooks por el mismo pago
    // ---------------------------------------------
    const existe = await firestore
      .collection("pagosProcesados")
      .where("paymentId", "==", paymentId)
      .get();

    if (!existe.empty) {
      console.log("⏭ Ya procesado, evitando duplicado");
      return res.status(200).json({ ok: true });
    }

    // ---------------------------------------------
    // 7) Crear la entrada
    // ---------------------------------------------
    const entradaData = {
      nombre: item.title || "Entrada",
      precio: Number(item.unit_price || 0),
      cantidad: item.quantity || 1,
      creadaEn: new Date().toISOString(),
      pagado: true,
      usado: false,
      usuarioId,
      eventoId,
    };

    const docRef = await firestore.collection("entradas").add(entradaData);

    console.log("🎟 Entrada generada →", docRef.id);

    // ---------------------------------------------
    // 8) Registrar pago procesado + avisar al front
    // ---------------------------------------------
    await firestore.collection("pagosProcesados").add({
      paymentId,
      ticketId: docRef.id,
      usuarioId,
      eventoId,
      creadoEn: new Date().toISOString(),
    });

    console.log("🔔 Pago registrado → se notificará al usuario");

    // ---------------------------------------------
    return res.status(200).json({
      ok: true,
      entradaId: docRef.id,
    });
  } catch (err) {
    console.error("❌ Error webhook MP:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
