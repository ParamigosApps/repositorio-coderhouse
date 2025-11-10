// pagarEntrada.js
export async function pagarEntrada(nombreEvento, precio, cantidad) {
  try {
    // Llamada a la API para crear preferencia
    const response = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreEvento, precio, cantidad }),
    });

    const data = await response.json();

    // Si la respuesta no es OK, lanzar error
    if (!response.ok) {
      throw new Error(data.error || "Error desconocido");
    }

    // Log mínimo de depuración (solo init_point)
    console.log("🔹 Init point MercadoPago:", data.init_point);

    // Redirigir al usuario a MercadoPago
    window.location.href = data.init_point;
  } catch (error) {
    console.error("❌ Error al pagar:", error);
    alert("Ocurrió un error al intentar el pago: " + error.message);
  }
}
