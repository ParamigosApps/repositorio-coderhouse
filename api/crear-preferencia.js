// /api/crear-preferencia.js
/*
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN_TEST,
});

export default async function handler(req, res) {
  try {
    const { items, payer, external_reference } = req.body;

    // Transformar cada item para incluir más info en description
    items.forEach((item) => {
      item.unit_price = Number(item.unit_price);

      // Construir una descripción rica
      const cantidad = item.quantity ?? 1;
      const precioTotal = (item.unit_price * cantidad).toFixed(2);

      item.description = `Evento: ${item.title}  
Fecha: ${item.fecha ?? "No especificada"}  
Lugar: ${item.lugar ?? "No especificado"}  
Cantidad: ${cantidad}  
Precio u.: $${item.unit_price}  
Total: $${precioTotal}`;

      // Si querés una imagen del evento
      if (!item.picture_url && item.imagenEventoUrl) {
        item.picture_url = item.imagenEventoUrl;
      }

      // Agregar moneda si no está
      if (!item.currency_id) {
        item.currency_id = "ARS"; // cambiar si usás otra moneda
      }
    });

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items,
        payer,
        external_reference,
        back_urls: {
          success: "https://tusitio.com/pago-exitoso",
          failure: "https://tusitio.com/pago-fallido",
          pending: "https://tusitio.com/pago-pendiente",
        },
        auto_return: "approved",
      },
    });

    res.status(200).json({
      id: result.id,
      init_point: result.init_point,
      preference: result,
    });
  } catch (error) {
    console.error("❌ Error creando preferencia MP:", error);
    res.status(500).json({ error: error.message });
  }
}
*/

import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN_TEST, // tu token de prueba
});

export default async function handler(req, res) {
  try {
    const { items, payer, external_reference } = req.body;

    // Transformar items
    const formattedItems = items.map((item) => {
      const cantidad = item.quantity ?? 1;
      const unit_price = Number(item.unit_price ?? 0);
      return {
        title: item.title,
        quantity: cantidad,
        unit_price,
        currency_id: item.currency_id ?? "ARS",
        picture_url: item.picture_url ?? item.imagenEventoUrl ?? "",
        description: `Evento: ${item.title}
Fecha: ${item.fecha ?? "No especificada"}
Lugar: ${item.lugar ?? "No especificado"}
Cantidad: ${cantidad}
Precio u.: $${unit_price}
Total: $${(unit_price * cantidad).toFixed(2)}`,
      };
    });

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: formattedItems,
        payer: payer || { email: "test_user_123456@testuser.com" },
        external_reference,
        back_urls: {
          success: "https://tusitio.com/pago-exitoso",
          failure: "https://tusitio.com/pago-fallido",
          pending: "https://tusitio.com/pago-pendiente",
        },
        auto_return: "approved",
      },
    });

    // Sandbox: enviar sandbox_init_point
    res.status(200).json({
      id: result.id,
      sandbox_init_point: result.sandbox_init_point,
      preference: result,
    });
  } catch (error) {
    console.error("❌ Error creando preferencia MP:", error);
    res.status(500).json({ error: error.message });
  }
}
