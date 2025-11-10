const mercadopago = require("mercadopago");

// ✅ Configuración correcta del token
if (!process.env.MP_ACCESS_TOKEN) {
  console.error(
    "⚠️ MP_ACCESS_TOKEN no está definido en las variables de entorno"
  );
}

mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.warn(`Método no permitido: ${req.method}`);
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { nombreEvento, precio, cantidad } = req.body;

    if (!nombreEvento || !precio || !cantidad) {
      console.warn("Faltan datos obligatorios:", req.body);
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // ⚠️ Cambia esta URL por tu URL pública de ngrok
    const NGROK_URL = "https://abcd1234.ngrok.io";

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
        success: `${NGROK_URL}/success.html`,
        failure: `${NGROK_URL}/failure.html`,
        pending: `${NGROK_URL}/pending.html`,
      },
      auto_return: "approved",
    };

    console.log("🔹 Objeto de preferencia creado:", preference);

    const response = await mercadopago.preferences.create(preference);

    console.log("✅ Preferencia creada:", response.body);

    return res.status(200).json({ init_point: response.body.init_point });
  } catch (err) {
    console.error("❌ Error al crear preferencia:", err);

    if (err.response && err.response.body) {
      console.error("🔸 Detalles del error MercadoPago:", err.response.body);
    }

    return res
      .status(500)
      .json({ error: "Error interno al crear preferencia" });
  }
}
