// /api/crear-preferencia.js
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN_TEST, // tu token de prueba
});

export default async function handler(req, res) {
  try {
    console.log("📌 Body recibido:", req.body);

    // Asegurar que 'items' sea siempre un array
    let items = req.body.items;
    if (!Array.isArray(items)) {
      // Si no llega como array, creamos uno con los datos enviados directamente
      const {
        title,
        quantity,
        price,
        fecha,
        lugar,
        picture_url,
        imagenEventoUrl,
      } = req.body;

      if (!title) {
        console.warn("⚠️ No se enviaron items válidos:", req.body);
        return res.status(400).json({ error: "No se enviaron items válidos" });
      }

      items = [
        {
          title,
          quantity: Number(quantity ?? 1),
          unit_price: Number(price ?? 0),
          currency_id: "ARS",
          picture_url: picture_url ?? imagenEventoUrl ?? "",
          description: `Evento: ${title}
Fecha: ${fecha ?? "No especificada"}
Lugar: ${lugar ?? "No especificado"}
Cantidad: ${quantity ?? 1}
Precio u.: $${price ?? 0}
Total: $${((price ?? 0) * (quantity ?? 1)).toFixed(2)}`,
        },
      ];
    }

    // Mapear items para MP
    const formattedItems = items.map((item) => ({
      title: item.title,
      quantity: Number(item.quantity ?? 1),
      unit_price: Number(item.unit_price ?? item.price ?? 0),
      currency_id: item.currency_id ?? "ARS",
      picture_url: item.picture_url ?? "",
      description: item.description ?? item.title,
    }));

    console.log("📌 Items formateados:", formattedItems);

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: formattedItems,
        payer: req.body.payer || { email: "test_user_123456@testuser.com" },
        external_reference: req.body.external_reference || null,
        back_urls: {
          success: "https://tusitio.com/pago-exitoso",
          failure: "https://tusitio.com/pago-fallido",
          pending: "https://tusitio.com/pago-pendiente",
        },
        auto_return: "approved",
      },
    });

    console.log("✅ Preferencia creada:", result);

    res.status(200).json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      preference: result,
    });
  } catch (error) {
    console.error("❌ Error creando preferencia MP:", error);
    res.status(500).json({ error: error.message });
  }
}
