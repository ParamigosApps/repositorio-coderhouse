import mercadopago from "mercadopago";

const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
if (!MP_TOKEN) console.error("❌ MP_ACCESS_TOKEN no definido");

mercadopago.configurations.setAccessToken(MP_TOKEN);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { nombreEvento, precio, cantidad } = req.body || {};
  if (!nombreEvento || !precio || !cantidad) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
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
        success: "https://repositorio-coderhouse.vercel.app/index.html",
        failure: "https://repositorio-coderhouse.vercel.app/index.html",
        pending: "https://repositorio-coderhouse.vercel.app/index.html",
      },
      auto_return: "approved",
    };

    const response = await mercadopago.preferences.create(preference);
    return res.status(200).json({ init_point: response.body.init_point });
  } catch (err) {
    console.error("❌ Error MercadoPago:", err);
    return res.status(500).json({ error: "Error al crear preferencia" });
  }
}
