const mercadopago = require("mercadopago");

// Configuramos el Access Token desde la variable de entorno de Vercel
if (!process.env.MP_ACCESS_TOKEN) {
  console.error("❌ No se encontró la variable MP_ACCESS_TOKEN en Vercel.");
} else {
  mercadopago.configurations = { access_token: process.env.MP_ACCESS_TOKEN };
}

module.exports = async function handler(req, res) {
  // Solo aceptamos POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { nombreEvento, precio, cantidad } = req.body;

    if (!nombreEvento || !precio || !cantidad) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Debug: mostrar datos recibidos
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

    // Crear preferencia
    const response = await mercadopago.preferences.create(preference);

    console.log("Preferencia creada:", response.body.init_point);

    return res.status(200).json({ init_point: response.body.init_point });
  } catch (error) {
    console.error("Error al crear preferencia:", error);

    // Enviar mensaje amigable al front
    return res
      .status(500)
      .json({
        error: "Ocurrió un error al crear la preferencia. Revisa los logs.",
      });
  }
};
