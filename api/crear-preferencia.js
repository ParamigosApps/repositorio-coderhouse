const mercadopago = require("mercadopago");

// ✅ Configuración del token
if (!process.env.MP_ACCESS_TOKEN) {
  console.error(
    "⚠️ MP_ACCESS_TOKEN no está definido en las variables de entorno"
  );
} else {
  console.log(
    "✅ MP_ACCESS_TOKEN definido (mostrando solo los primeros 5 caracteres):",
    process.env.MP_ACCESS_TOKEN.slice(0, 5),
    "..."
  );
}

mercadopago.configurations.setAccessToken(process.env.MP_ACCESS_TOKEN);

export default async function handler(req, res) {
  console.log("📥 Llamada entrante a crear-preferencia");

  if (req.method !== "POST") {
    console.warn(`Método no permitido: ${req.method}`);
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { nombreEvento, precio, cantidad } = req.body;
    console.log("📝 Datos recibidos:", req.body);

    if (!nombreEvento || !precio || !cantidad) {
      console.warn("❌ Faltan datos obligatorios");
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // ✅ URL pública de tu proyecto en Vercel
    const BACK_URL = "https://repositorio-coderhouse.vercel.app/index.html";

    // Verificamos si la URL es válida (HTTPS)
    if (!BACK_URL.startsWith("https://")) {
      console.warn("❌ BACK_URL no es HTTPS:", BACK_URL);
      return res.status(400).json({ error: "URL de retorno inválida" });
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
        success: BACK_URL,
        failure: BACK_URL,
        pending: BACK_URL,
      },
      auto_return: "approved",
    };

    console.log("🔹 Objeto de preferencia creado:", preference);

    // Crear preferencia en MercadoPago
    let response;
    try {
      response = await mercadopago.preferences.create(preference);
      console.log("🔹 Respuesta cruda de MercadoPago:", response);
    } catch (mpErr) {
      console.error("❌ Error completo MercadoPago:", mpErr);

      if (mpErr.response && mpErr.response.body) {
        console.error("🔸 Detalles MercadoPago:", mpErr.response.body);
        return res.status(mpErr.status || 500).json({
          error: mpErr.response.body.message || "Error de MercadoPago",
          raw: mpErr.response.body,
        });
      }

      return res
        .status(500)
        .json({ error: mpErr.message || "Error de MercadoPago" });
    }

    if (!response || !response.body) {
      console.error("❌ Respuesta inesperada de MercadoPago:", response);
      return res
        .status(500)
        .json({ error: "Respuesta inesperada de MercadoPago" });
    }

    // Log completo antes de devolver al cliente
    console.log("✅ Preferencia lista para el cliente:", {
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
      full_response: response.body,
    });

    return res.status(200).json({
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
      full_response: response.body, // para depuración completa
    });
  } catch (err) {
    console.error("❌ Error general en handler:", err);
    return res
      .status(500)
      .json({ error: "Error interno al crear preferencia" });
  }
}
