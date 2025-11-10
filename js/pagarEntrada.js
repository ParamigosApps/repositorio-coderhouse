export async function pagarEntrada(nombreEvento, precio, cantidad) {
  try {
    // Llamada al endpoint de creación de preferencia
    const response = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreEvento, precio, cantidad }),
    });

    // Leer siempre como texto
    const text = await response.text();

    // Intentar parsear a JSON, si falla usamos el texto como error
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }

    // Log completo de la respuesta del API
    console.log("🔹 Respuesta completa del API:", data);

    if (!response.ok) {
      throw new Error(data.error || "Error desconocido");
    }

    // Mostrar todos los detalles de la preferencia antes de redirigir
    if (data.full_response) {
      console.log("🔹 Detalles completos de la preferencia MercadoPago:");
      console.log("ID:", data.full_response.id);
      console.log("Items:", data.full_response.items);
      console.log("Init point:", data.full_response.init_point);
      console.log("Sandbox init point:", data.full_response.sandbox_init_point);
      console.log("Back URLs:", data.full_response.back_urls);
      console.log("Status:", data.full_response.status);
    }

    // Redirigir a MercadoPago
    console.log("🔹 Redirigiendo a MercadoPago init_point:", data.init_point);
    window.location.href = data.init_point;
  } catch (error) {
    console.error("❌ Error al pagar:", error);
    alert("Ocurrió un error: " + error.message);
  }
}
