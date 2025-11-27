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
    const DOCE_HORAS = 12 * 60 * 60 * 1000;

    console.log("⏳ Ejecutando cleanupPedidosRetirados...");

    const retiradosSnap = await db
      .collection("compras")
      .where("estado", "==", "retirado")
      .get();

    let eliminados = 0;

    for (const docSnap of retiradosSnap.docs) {
      const pedido = docSnap.data();

      const creadoEn = pedido.creadoEn?.toDate
        ? pedido.creadoEn.toDate().getTime()
        : new Date(pedido.fecha).getTime();

      if (ahora - creadoEn >= DOCE_HORAS) {
        await db.collection("compras").doc(docSnap.id).delete();
        eliminados++;
      }
    }

    // 🔥 Registrar log
    await db
      .collection("logsCron")
      .doc(`${new Date().toISOString()}_retirados`)
      .set({
        tipo: "retirados",
        timestamp: new Date().toISOString(),
        eliminados,
        detalle: `Eliminados ${eliminados} pedidos retirados`,
      });

    return res.status(200).json({
      ok: true,
      eliminados,
      message: `Eliminados ${eliminados} pedidos retirados`,
    });
  } catch (err) {
    console.error("❌ Error en cron retirados:", err);
    return res.status(500).json({ error: err.message });
  }
}
