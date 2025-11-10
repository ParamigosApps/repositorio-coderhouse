const mercadopago = require("mercadopago");

// Configuración del Access Token desde Vercel
if (!process.env.MP_ACCESS_TOKEN) {
  console.error("❌ No se encontró MP_ACCESS_TOKEN en Vercel");
} else {
  mercadopago.configurations = { access_token: process.env.MP_ACCESS_TOKEN };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { nombreEvento, precio, cantidad } = req.body;
    if (!nombreEvento || !precio || !cantidad) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    console.log("Creando preferencia:", { nombreEvento, precio, cantidad });

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

    const response = await mercadopago.preferences.create(preference);

    console.log("Preferencia creada:", response.body.init_point);
    return res.status(200).json({ init_point: response.body.init_point });
  } catch (error) {
    console.error("Error al crear preferencia:", error);
    return res
      .status(500)
      .json({ error: "Ocurrió un error al crear la preferencia." });
  }
};
