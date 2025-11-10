export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Importa el SDK dinámicamente (funciona en Vercel con ESM)
    const mercadopago = await import("mercadopago");

    // Configurar credenciales
    mercadopago.default.configure({
      access_token: "APP_USR-ddfad398-7b28-4cf3-bd6c-53eaead9f307", // ⚠️ Reemplazá luego por variable de entorno
    });

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
        success: "https://appbar.vercel.app/success.html",
        failure: "https://appbar.vercel.app/failure.html",
        pending: "https://appbar.vercel.app/pending.html",
      },
      auto_return: "approved",
    };

    const mpResponse = await mercadopago.default.preferences.create(preference);

    return res.status(200).json({ init_point: mpResponse.body.init_point });
  } catch (error) {
    console.error("Error al crear preferencia:", error);
    return res.status(500).json({ error: error.message });
  }
}
