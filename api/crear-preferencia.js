import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN, // ACCESS TOKEN PRIVADA
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { nombre, precio, cantidad } = req.body;

    const preference = {
      items: [
        {
          title: nombre,
          quantity: Number(cantidad),
          currency_id: "ARS",
          unit_price: Number(precio),
        },
      ],
      back_urls: {
        success: "https://tusitio.com/success",
        failure: "https://tusitio.com/error",
        pending: "https://tusitio.com/pendiente",
      },
      auto_return: "approved",
    };

    const result = await mercadopago.preferences.create(preference);
    return res.status(200).json({ init_point: result.body.init_point });
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}
