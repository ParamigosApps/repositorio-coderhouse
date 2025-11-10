// js/pagarEntrada.js
export async function pagarEntrada(nombreEvento, precio, cantidad) {
  try {
    const res = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreEvento, precio, cantidad }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Error desconocido");

    window.location.href = data.init_point;
  } catch (err) {
    console.error("❌ Error al pagar:", err);
    alert("Ocurrió un error al intentar el pago: " + err.message);
  }
}
