// /api/cleanupPedidosPendientes.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (req.headers["authorization"] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const ahora = Date.now();
    const QUINCE_MIN = 15 * 60 * 1000;

    console.log("⏳ Ejecutando cleanupPedidosPendientes...");

    const pendientesSnap = await db
      .collection("compras")
      .where("estado", "==", "pendiente")
      .get();

    let pedidosEliminados = [];
    let eliminados = 0;

    for (const docSnap of pendientesSnap.docs) {
      const pedido = docSnap.data();

      const creadoEn = pedido.creadoEn?.toDate
        ? pedido.creadoEn.toDate().getTime()
        : new Date(pedido.fecha).getTime();

      if (ahora - creadoEn >= QUINCE_MIN) {
        pedidosEliminados.push({
          pedidoId: docSnap.id,
          usuarioId: pedido.usuarioId,
        });

        await db.collection("compras").doc(docSnap.id).delete();
        eliminados++;
      }
    }

    // ================================
    // 🔔 NOTIFICACIÓN ÚNICA POR USUARIO
    // ================================
    const porUsuario = {};

    pedidosEliminados.forEach((p) => {
      if (!porUsuario[p.usuarioId]) porUsuario[p.usuarioId] = 0;
      porUsuario[p.usuarioId]++;
    });

    for (const [usuarioId, cantidad] of Object.entries(porUsuario)) {
      await db.collection("notificaciones").add({
        usuarioId,
        tipo: "pedidos_vencidos",
        cantidad,
        creadoEn: admin.firestore.FieldValue.serverTimestamp(),
        visto: false,
      });
    }

    return res.status(200).json({
      ok: true,
      eliminados,
      message: `Eliminados ${eliminados} pedidos pendientes`,
    });
  } catch (err) {
    console.error("❌ Error en cron:", err);
    return res.status(500).json({ error: err.message });
  }
}
