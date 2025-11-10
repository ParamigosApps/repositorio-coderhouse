// api/crear-preferencia.js
import mercadopago from "mercadopago";

const MP_TOKEN = process.env.MP_ACCESS_TOKEN;

if (!MP_TOKEN) {
  console.error("❌ MP_ACCESS_TOKEN no definido en el servidor");
} else {
  mercadopago.configurations.setAccessToken(MP_TOKEN);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { nombreEvento, precio, cantidad } = req.body;

  if (!nombreEvento || !precio || !cantidad) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const BACK_URL = "https://repositorio-coderhouse.vercel.app/index.html";

  const preference = {
    items: [
      {
        title: nombreEvento,
        quantity: Number(cantidad),
        currency_id: "ARS",
        unit_price: Number(precio),
      },
    ],
    back_urls: { success: BACK_URL, failure: BACK_URL, pending: BACK_URL },
    auto_return: "approved",
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    if (!response || !response.body) {
      return res
        .status(500)
        .json({ error: "Respuesta inesperada de MercadoPago" });
    }

    return res.status(200).json({
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
      full_response: response.body,
    });
  } catch (err) {
    console.error("❌ Error MercadoPago:", err);
    return res.status(500).json({ error: "Error al crear preferencia" });
  }
}
