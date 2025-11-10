export async function pagarEntrada(nombreEvento, precio, cantidad) {
  try {
    const response = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreEvento, precio, cantidad }),
    });

    let data;
    const text = await response.text(); // <-- leemos como texto primero

    try {
      data = JSON.parse(text); // intentamos parsear a JSON
    } catch {
      data = { error: text }; // si no es JSON, usamos el texto como error
    }

    if (!response.ok) {
      throw new Error(data.error || "Error desconocido");
    }

    window.location.href = data.init_point;
  } catch (error) {
    console.error("Error al pagar:", error);
    alert("Ocurrió un error: " + error.message);
  }
}
