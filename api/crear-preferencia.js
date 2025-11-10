const mercadopago = require("mercadopago");

// ✅ Configuración correcta del token
if (!process.env.MP_ACCESS_TOKEN) {
  console.error(
    "⚠️ MP_ACCESS_TOKEN no está definido en las variables de entorno"
  );
}

mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

export default async function handler(req, res) {
  console.log("📥 Llamada entrante a crear-preferencia");

  if (req.method !== "POST") {
    console.warn(`Método no permitido: ${req.method}`);
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { nombreEvento, precio, cantidad } = req.body;
    console.log("📝 Datos recibidos:", req.body);

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

    let response;
    try {
      response = await mercadopago.preferences.create(preference);
    } catch (mpErr) {
      console.error("❌ Error interno de MercadoPago:", mpErr);
      if (mpErr.response && mpErr.response.body) {
        console.error("🔸 Detalles de MercadoPago:", mpErr.response.body);
      }
      return res
        .status(500)
        .json({ error: "Error de MercadoPago al crear preferencia" });
    }

    // Verificamos si la respuesta tiene body
    if (!response || !response.body) {
      console.error("❌ Respuesta inesperada de MercadoPago:", response);
      return res
        .status(500)
        .json({ error: "Respuesta inesperada de MercadoPago" });
    }

    console.log("✅ Preferencia creada correctamente:", response.body);

    return res.status(200).json({ init_point: response.body.init_point });
  } catch (err) {
    console.error("❌ Error general en handler:", err);
    return res
      .status(500)
      .json({ error: "Error interno al crear preferencia" });
  }
}
