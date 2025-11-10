const evento = {
  nombre: "Fiesta en la terraza",
  precio: 1500,
  maxEntradasPorUsuario: 2,
};

document
  .getElementById("btnConseguirEntrada")
  .addEventListener("click", async () => {
    const evento = {
      nombre: "Fiesta en la terraza",
      precio: 1500,
      maxEntradasPorUsuario: 2,
    };
    const cantidad = prompt(
      `¿Cuántas entradas querés? (Máx: ${evento.maxEntradasPorUsuario})`,
      1
    );

    if (
      !cantidad ||
      isNaN(cantidad) ||
      cantidad < 1 ||
      cantidad > evento.maxEntradasPorUsuario
    ) {
      alert("Cantidad inválida");
      return;
    }

    try {
      const res = await fetch("/api/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreEvento: evento.nombre,
          precio: evento.precio,
          cantidad,
        }),
      });

      const data = await res.json();
      if (data.init_point) window.location.href = data.init_point;
      else alert("Error al generar el pago");
    } catch (err) {
      console.error(err);
      alert("Error al conectar con MercadoPago");
    }
  });
