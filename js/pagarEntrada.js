export async function pagarEntrada(nombreEvento, precio, cantidad) {
  try {
    const response = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreEvento, precio, cantidad }),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }

    // Log completo de la respuesta antes de redirigir
    console.log("🔹 Respuesta completa del API:", data);

    if (!response.ok) {
      throw new Error(data.error || "Error desconocido");
    }

    console.log("🔹 Redirigiendo a MercadoPago init_point:", data.init_point);
    window.location.href = data.init_point;
  } catch (error) {
    console.error("❌ Error al pagar:", error);
    alert("Ocurrió un error: " + error.message);
  }
}
