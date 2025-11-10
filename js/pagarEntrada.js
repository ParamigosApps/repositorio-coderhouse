export async function pagarEntrada(nombreEvento, precio, cantidad) {
  try {
    const response = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreEvento, precio, cantidad }),
    });

    // Leer siempre como texto primero
    const text = await response.text();

    // Intentar parsear a JSON, si falla usamos el texto como error
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }

    if (!response.ok) {
      console.error("🔹 Respuesta no OK del API:", data);
      throw new Error(data.error || "Error desconocido");
    }

    console.log("🔹 Redirigiendo a MercadoPago:", data.init_point);
    window.location.href = data.init_point;
  } catch (error) {
    console.error("❌ Error al pagar:", error);
    alert("Ocurrió un error: " + error.message);
  }
}
