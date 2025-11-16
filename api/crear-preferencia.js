import mercadopago from "mercadopago";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  console.log("📩 Request recibido en crear-preferencia");

  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      console.error("❌ MP_ACCESS_TOKEN no definido");
      return res.status(500).json({ error: "MP_ACCESS_TOKEN faltante" });
    }

    // Configurar MP correctamente
    mercadopago.configure({
      access_token: process.env.MP_ACCESS_TOKEN,
    });

    console.log("🔐 MP configurado OK");

    const { nombre, precio, cantidad } = req.body;

    console.log("🧾 Datos recibidos:", req.body);

    const preference = await mercadopago.preferences.create({
      items: [
        {
          title: nombre,
          unit_price: Number(precio),
          quantity: Number(cantidad),
        },
      ],
      auto_return: "approved",
      back_urls: {
        success: "https://app-para-bares.vercel.app/success",
        failure: "https://app-para-bares.vercel.app/error",
      },
    });

    console.log("💳 Preference creada OK:", preference.body.init_point);

    return res.status(200).json({
      init_point: preference.body.init_point,
    });
  } catch (error) {
    console.error("❌ Error en crear-preferencia:", error);
    return res.status(500).json({ error: error.message });
  }
}
