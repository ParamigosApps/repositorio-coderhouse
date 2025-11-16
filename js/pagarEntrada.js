// pagarEntrada.js

const mp = new window.MercadoPago(
  "APP_USR-f4fe9a32-7655-4fd7-a910-dbc8811aaf7a", // 🔑 misma que enviaste
  { locale: "es-AR" }
);

const bricksBuilder = mp.bricks();

export async function initBrick() {
  const container = document.getElementById("cardPaymentBrick_container");
  if (!container) return console.error("❌ Contenedor del Brick no encontrado");
  container.innerHTML = "";

  try {
    await bricksBuilder.create("cardPayment", "cardPaymentBrick_container", {
      initialization: {
        amount: 1000, // valor de prueba
      },
      callbacks: {
        onReady: () => console.log("✅ Brick listo"),
        onSubmit: async (cardData) => {
          console.log("📤 Enviando pago al backend...");

          try {
            const res = await fetch("http://127.0.0.1:5504/api/crear-orden", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                description: "Entrada VIP",
                price: 1000,
                token: cardData.token,
              }),
            });

            const data = await res.json();
            if (res.ok) {
              alert("✅ Pago exitoso. ID: " + data.id);
              console.log("Preferencia:", data);
            } else {
              alert("❌ Error: " + (data.error || "Fallo en el pago"));
            }
          } catch (err) {
            console.error("💥 Error al llamar al backend:", err);
          }
        },
        onError: (err) => console.error("💣 Error en Brick:", err),
      },
    });
  } catch (err) {
    console.error("💥 Error general al crear Brick:", err);
  }
}

// Inicializar al hacer clic en botón
document.getElementById("btnMostrarPago").addEventListener("click", initBrick);
