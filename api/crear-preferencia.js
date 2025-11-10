import mercadopago from "mercadopago";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    mercadopago.configure({
      access_token: process.env.MP_ACCESS_TOKEN, // ✅ usa variable de entorno segura
    });

    const { nombreEvento, precio, cantidad } = req.body;

    const preference = {
      items: [
        {
          title: nombreEvento,
          unit_price: Number(precio),
          quantity: Number(cantidad),
          currency_id: "ARS",
        },
      ],
      back_urls: {
        success: `${req.headers.origin}/success.html`,
        failure: `${req.headers.origin}/failure.html`,
        pending: `${req.headers.origin}/pending.html`,
      },
      auto_return: "approved",
    };

    const response = await mercadopago.preferences.create(preference);
    res.status(200).json({ init_point: response.body.init_point });
  } catch (error) {
    console.error("Error al crear preferencia:", error);
    res.status(500).json({ error: "Error al crear la preferencia" });
  }
}
