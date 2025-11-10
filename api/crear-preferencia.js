require("dotenv").config();
const mercadopago = require("mercadopago");

// Versión 2.x workaround para configurar el Access Token
mercadopago.configurations = { access_token: process.env.MP_ACCESS_TOKEN };

module.exports = async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Método no permitido" });

  try {
    const { nombreEvento, precio, cantidad } = req.body;

    if (!nombreEvento || !precio || !cantidad) {
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

    const response = await mercadopago.preferences.create(preference);
    return res.status(200).json({ init_point: response.body.init_point });
  } catch (error) {
    console.error("Error al crear preferencia:", error);
    return res.status(500).json({ error: error.message });
  }
};
