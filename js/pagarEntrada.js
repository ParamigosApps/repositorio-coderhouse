export async function pagarEntrada(nombreEvento, precio, cantidad) {
  try {
    const response = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreEvento, precio, cantidad }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Error desconocido");
    }

    const data = await response.json();
    window.location.href = data.init_point; // Redirige a MercadoPago
  } catch (error) {
    console.error("Error al pagar la entrada:", error);
    alert("Ocurrió un error al procesar el pago: " + error.message);
  }
}
