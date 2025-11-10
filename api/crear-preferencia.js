// frontend: cuando el usuario elige Mercado Pago
async function pagarConMercadoPago(
  nombreEvento,
  precio,
  cantidad,
  ticketId = null
) {
  try {
    const res = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreEvento, precio, cantidad, ticketId }),
    });

    const data = await res.json();
    if (res.ok && data.init_point) {
      // redirigir a Mercado Pago
      window.location.href = data.init_point;
    } else {
      console.error("Error backend:", data);
      Swal.fire("Error", "No se pudo generar el link de pago.", "error");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
  }
}
