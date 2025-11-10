// api/crear-preferencia.js
import fetch from "node-fetch";

const MP_TOKEN = process.env.MP_ACCESS_TOKEN;

export default async function handler(req, res) {
  console.log("📩 Llamada recibida en /api/crear-preferencia");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (!MP_TOKEN) {
    console.error("❌ MP_ACCESS_TOKEN no definido en Vercel");
    return res
      .status(500)
      .json({ error: "MP_ACCESS_TOKEN no definido en el servidor" });
  }

  try {
    const { nombreEvento, precio, cantidad } = req.body;
    console.log("📝 Datos recibidos:", req.body);

    if (!nombreEvento || !precio || !cantidad) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const BACK_URL = "https://app-para-bares.vercel.app/index.html";

    const preference = {
      items: [
        {
          title: nombreEvento,
          quantity: Number(cantidad),
          currency_id: "ARS",
          unit_price: Number(precio),
        },
      ],
      back_urls: {
        success: BACK_URL,
        failure: BACK_URL,
        pending: BACK_URL,
      },
      auto_return: "approved",
    };

    console.log("📦 Enviando preferencia a MercadoPago...");

    const mpResponse = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preference),
      }
    );

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("❌ Error de MercadoPago:", data);
      return res.status(mpResponse.status).json({
        error: data.message || "Error al crear preferencia",
        detalle: data,
      });
    }

    console.log("✅ Preferencia creada correctamente:", data.id);

    return res.status(200).json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      id: data.id,
    });
  } catch (err) {
    console.error("💥 Error inesperado:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
