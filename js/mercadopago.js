// /js/mercadopago.js
// =====================================================
// MÓDULO CENTRALIZADO DE MERCADO PAGO
// Para Entradas y Compras en Tienda
// =====================================================

export async function crearPreferenciaEntrada({
  usuarioId,
  eventoId,
  nombreEvento,
  cantidad,
  precio,
  imagenEventoUrl,
}) {
  try {
    // ----------------------------------------
    // Construcción del TÍTULO profesional
    // ----------------------------------------
    const titulo = `${cantidad} Entrada${
      cantidad > 1 ? "s" : ""
    } — ${nombreEvento}`;

    // ----------------------------------------
    // Descripción extendida
    // (MP no lo muestra en pantalla pero queda registrado)
    // ----------------------------------------
    const descripcion = `Evento: ${nombreEvento}
Cantidad: ${cantidad}
Precio unitario: $${precio}
Total: $${precio * cantidad}
Usuario: ${usuarioId}`;

    const body = {
      title: titulo, // <<------ TITULO MEJORADO
      items: [
        {
          title: titulo, // Se usa en la pantalla de MP
          quantity: cantidad,
          unit_price: Number(precio),
          currency_id: "ARS",
          picture_url: imagenEventoUrl || "",
          description: descripcion, // Registro interno
        },
      ],
      external_reference: `${usuarioId}_${eventoId}`,
    };

    const res = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data.init_point;
  } catch (err) {
    console.error("❌ Error crearPreferenciaEntrada:", err);
    return null;
  }
}

// =====================================================
// 2) CREAR PREFERENCIA PARA COMPRA EN TIENDA
// =====================================================

export async function crearPreferenciaCompra({ carrito, ticketId }) {
  try {
    // Construir título amigable
    const cantidadTotal = carrito.reduce((acc, p) => acc + p.enCarrito, 0);

    let resumen = carrito
      .map((p) => `${p.nombre} (x${p.enCarrito})`)
      .join(", ");

    if (resumen.length > 70) resumen = resumen.slice(0, 67) + "...";

    const tituloPreferencia = `${cantidadTotal} producto${
      cantidadTotal > 1 ? "s" : ""
    } — ${resumen}`;

    // Descripción
    const descripcion = carrito
      .map(
        (p) =>
          `• ${p.nombre} x${p.enCarrito} — $${Number(p.precio) * p.enCarrito}`
      )
      .join("\n");

    const items = carrito.map((p) => ({
      title: p.nombre,
      quantity: p.enCarrito,
      unit_price: Number(p.precio),
      currency_id: "ARS",
    }));

    const res = await fetch("/api/crear-preferencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: tituloPreferencia,
        description: descripcion, // ← ESTA ES LA LÍNEA CORRECTA
        external_reference: ticketId,
        items,
      }),
    });

    const data = await res.json();
    console.log("Preferencia creada:", data);

    return data.init_point || null;
  } catch (err) {
    console.error("❌ Error en crearPreferenciaCompra:", err);
    return null;
  }
}
