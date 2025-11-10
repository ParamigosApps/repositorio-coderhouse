// api/crear-preferencia.js
import mercadopago from "mercadopago";

// ✅ Configuración del token
const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
if (!MP_TOKEN) {
  console.error("❌ MP_ACCESS_TOKEN no definido");
} else {
  console.log(
    "✅ MP_ACCESS_TOKEN definido (primeros 5 caracteres):",
    MP_TOKEN.slice(0, 5),
    "..."
  );
  mercadopago.configurations.setAccessToken(MP_TOKEN);
}

export default async function handler(req, res) {
  console.log("📥 Handler llamado");
  console.log("Env token:", process.env.MP_ACCESS_TOKEN ? "Sí" : "No");
  console.log("Método recibido:", req.method);

  return res
    .status(200)
    .json({ test: "Función serverless corriendo correctamente" });

  if (!MP_TOKEN) {
    console.error("❌ MP_ACCESS_TOKEN no definido - abortando petición");
    return res
      .status(500)
      .json({ error: "MP_ACCESS_TOKEN no definido en el servidor" });
  }

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

    const BACK_URL = "https://repositorio-coderhouse.vercel.app/index.html";

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

    let response;
    try {
      response = await mercadopago.preferences.create(preference);
      console.log("🔹 Respuesta cruda de MercadoPago:", response);
    } catch (mpErr) {
      console.error("❌ Error MercadoPago:", mpErr);

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

    console.log("✅ Preferencia lista para el cliente:", {
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
      full_response: response.body,
    });

    return res.status(200).json({
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
      full_response: response.body,
    });
  } catch (err) {
    console.error("❌ Error general en handler:", err);
    return res
      .status(500)
      .json({ error: "Error interno al crear preferencia" });
  }
}
