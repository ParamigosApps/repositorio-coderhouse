import { MercadoPagoConfig, Preference } from "mercadopago";

// Inicializar con tu access token
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  try {
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: "Entrada Evento",
            quantity: 1,
            unit_price: 4000,
          },
        ],
      },
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
