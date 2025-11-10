/*
import mercadopago from "mercadopago";

// Configurá tu access token de MercadoPago aquí
mercadopago.configurations.setAccessToken("TU_ACCESS_TOKEN_AQUI");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { nombreEvento, precio, cantidad } = req.body;

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
}*/
