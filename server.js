import "dotenv/config";
import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Payment } from "mercadopago";

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.MP_ACCESS_TOKEN) {
  console.error("❌ MP_ACCESS_TOKEN no definido en entorno");
  process.exit(1);
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});
console.log("server accesstoken: " + process.env.MP_ACCESS_TOKEN);
app.post("/api/crear-orden", async (req, res) => {
  console.log("📩 Recibido:", req.body);

  try {
    const { description, price, token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Falta token de tarjeta" });
    }

    const payment = new Payment(client);
    const result = await payment.create({
      body: {
        transaction_amount: Number(price),
        token,
        description,
        installments: 1,
        payment_method_id: "visa", // para sandbox podés usar visa
        payer: {
          email: "test_user_123@testuser.com",
        },
      },
    });

    console.log("✅ Pago creado:", result);
    res.json({ id: result.id, status: result.status });
  } catch (err) {
    console.error("💥 Error en backend:", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "Error interno del servidor" });
  }
});

app.listen(5504, () => {
  console.log("✅ Backend corriendo en http://127.0.0.1:5504");
});
