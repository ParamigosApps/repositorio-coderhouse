const mercadopago = require("mercadopago");

// Configuración del Access Token
if (!process.env.MP_ACCESS_TOKEN) {
  console.error("❌ MP_ACCESS_TOKEN no definido en entorno");
} else {
  console.log("✅ MP_ACCESS_TOKEN cargado correctamente");
}
mercadopago.configurations = { access_token: process.env.MP_ACCESS_TOKEN };

module.exports = async function handler(req, res) {
  console.log("➡️ Método recibido:", req.method);

  if (req.method !== "POST") {
    console.warn("⚠️ Método no permitido");
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    console.log("📦 req.body recibido:", req.body);

    const { nombreEvento, precio, cantidad } = req.body;
    if (!nombreEvento || !precio || !cantidad) {
      console.warn("❌ Faltan datos obligatorios:", req.body);
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

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
        success: "https://TU-DOMINIO/success.html",
        failure: "https://TU-DOMINIO/failure.html",
        pending: "https://TU-DOMINIO/pending.html",
      },
      auto_return: "approved",
    };

    console.log("💳 Creando preferencia:", preference);

    const response = await mercadopago.preferences.create(preference);

    console.log("✅ Preferencia creada:", response.body.init_point);
    return res.status(200).json({ init_point: response.body.init_point });
  } catch (error) {
    console.error("❌ Error al crear preferencia:", error);
    return res
      .status(500)
      .json({ error: "Error interno al crear preferencia" });
  }
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Método no permitido" });

    // lógica para crear la preferencia
    const preference = await mercadopago.preferences.create({
      items: [
        /* tus items */
      ],
    });

    return res.status(200).json(preference);
  } catch (err) {
    console.error("Error creando preferencia:", err); // esto va a aparecer en logs
    return res
      .status(500)
      .json({ error: "Error interno al crear preferencia" });
  }
}
