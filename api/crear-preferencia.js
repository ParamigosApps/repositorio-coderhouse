import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken:
    process.env.MP_ACCESS_TOKEN_TEST || process.env.MP_ACCESS_TOKEN || "",
});

export default async function handler(req, res) {
  try {
    console.log("📌 Body recibido:", req.body);

    // ---------------------------------------------
    // 🔥 URL BASE INFALIBLE (evita localhost)
    // ---------------------------------------------
    const FALLBACK_PROD = "https://app-para-bares.vercel.app";

    let host = req.headers["x-forwarded-host"] || req.headers.host || null;

    let protocol =
      req.headers["x-forwarded-proto"] ||
      (host && host.includes("localhost") ? "http" : "https");

    let baseUrl;

    if (!host || host.includes("localhost")) {
      baseUrl = FALLBACK_PROD; // ⛔ localhost NO sirve para MP
    } else {
      baseUrl = `${protocol}://${host}`;
    }

    console.log("🌍 BASE URL FINAL:", baseUrl);

    // ---------------------------------------------
    // ASEGURAR ITEMS
    // ---------------------------------------------
    let items = req.body.items;

    if (!Array.isArray(items)) {
      const {
        title,
        quantity,
        price,
        unit_price,
        picture_url,
        imagenEventoUrl,
        description,
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Item inválido" });
      }

      items = [
        {
          title,
          quantity: Number(quantity ?? 1),
          unit_price: Number(unit_price ?? price ?? 0),
          currency_id: "ARS",
          picture_url: picture_url ?? imagenEventoUrl ?? "",
          description:
            description ||
            `${title} - Cantidad: ${quantity ?? 1} - Total: $${
              (unit_price ?? price ?? 0) * (quantity ?? 1)
            }`,
        },
      ];
    }

    // Formatear
    const formattedItems = items.map((item) => ({
      title: item.title,
      quantity: Number(item.quantity ?? 1),
      unit_price: Number(item.unit_price ?? item.price ?? 0),
      currency_id: item.currency_id ?? "ARS",
      picture_url: item.picture_url ?? "",
      description: item.description ?? item.title,
    }));

    console.log("📦 Items formateados:", formattedItems);

    // ---------------------------------------------
    // CREAR PREFERENCIA
    // ---------------------------------------------
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: formattedItems,
        external_reference: req.body.external_reference || null,

        payer: req.body.payer || {
          email: "test_user_123456@test.com",
        },

        back_urls: {
          success: `${baseUrl}/pago-exitoso.html`,
          failure: `${baseUrl}/pago-fallido.html`,
          pending: `${baseUrl}/pago-pendiente.html`,
        },

        auto_return: "approved",
      },
    });

    console.log("✅ Preferencia creada:", result.id);

    return res.status(200).json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error) {
    console.error("❌ Error creando preferencia MP:", error);
    return res.status(500).json({ error: error.message });
  }
}
