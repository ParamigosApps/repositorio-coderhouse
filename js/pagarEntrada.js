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
    window.location.href = data.init_point;
  } catch (error) {
    console.error("Error al pagar:", error);
    alert("Ocurrió un error: " + error.message);
  }
}
