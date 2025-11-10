const evento = {
  nombre: "Fiesta en la terraza",
  precio: 1500, // 0 si es gratis
  maxEntradasPorUsuario: 2,
};

document
  .getElementById("btnConseguirEntrada")
  .addEventListener("click", async () => {
    const { nombre, precio, maxEntradasPorUsuario } = evento;

    // Si es gratis
    if (precio === 0) {
      alert(`Entrada gratuita para "${nombre}" confirmada ✅`);
      // acá podés guardar en tu base de datos o mostrar el QR directamente
      return;
    }

    // Si hay que pagar
    const cantidad = prompt(
      `¿Cuántas entradas querés? (Máx: ${maxEntradasPorUsuario})`,
      1
    );

    // Validar cantidad
    if (
      !cantidad ||
      isNaN(cantidad) ||
      cantidad < 1 ||
      cantidad > maxEntradasPorUsuario
    ) {
      alert("Cantidad inválida.");
      return;
    }

    try {
      const response = await fetch("/api/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreEvento: nombre, precio, cantidad }),
      });

      const data = await response.json();

      if (data.init_point) {
        // Redirige a la página de pago de Mercado Pago
        window.location.href = data.init_point;
      } else {
        alert("Error al generar el pago.");
      }
    } catch (error) {
      console.error("Error al conectar con Mercado Pago:", error);
      alert("Hubo un problema al iniciar el pago.");
    }
  });
