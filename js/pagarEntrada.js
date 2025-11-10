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
      // Si no es JSON, lo guardamos como error
      data = { error: text };
    }

    console.log("🔹 Respuesta completa del API:", data);

    if (!response.ok) {
      throw new Error(data.error || "Error desconocido");
    }

    // Redirigir al usuario
    window.location.href = data.init_point;
  } catch (error) {
    console.error("❌ Error al pagar:", error);
    alert("Ocurrió un error al intentar el pago: " + error.message);
  }
}
