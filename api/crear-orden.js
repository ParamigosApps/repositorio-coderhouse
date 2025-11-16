// api/crear-orden.js
import { MercadoPagoConfig, Order } from "mercadopago";

export default async function handler(req, res) {
  console.log("📩 Llamada recibida en /api/crear-orden");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_TOKEN) {
    console.error("❌ MP_ACCESS_TOKEN no definido");
    return res.status(500).json({ error: "Falta MP_ACCESS_TOKEN en entorno" });
  }

  try {
    const { email, nombreEvento, precio, cantidad, cardToken } = req.body;
    console.log("📝 Datos recibidos:", req.body);

    if (!email || !nombreEvento || !precio || !cantidad || !cardToken) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const client = new MercadoPagoConfig({
      accessToken: MP_TOKEN,
      options: { timeout: 5000 },
    });

    const order = new Order(client);

    const body = {
      type: "online",
      processing_mode: "automatic",
      total_amount: Number(precio) * Number(cantidad),
      external_reference: nombreEvento,
      payer: { email },
      transactions: {
        payments: [
          {
            amount: Number(precio) * Number(cantidad),
            payment_method: {
              type: "credit_card",
              token: cardToken,
              installments: 1,
              statement_descriptor: "App para Bares",
            },
          },
        ],
      },
    };

    const requestOptions = {
      idempotencyKey: `order-${Date.now()}`,
    };

    console.log("📦 Enviando orden a Mercado Pago...");
    const result = await order.create({ body, requestOptions });

    console.log("✅ Orden creada:", result.id);
    return res.status(200).json(result);
  } catch (err) {
    console.error("💥 Error al crear la orden:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
