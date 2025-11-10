const evento = {
  nombre: "Fiesta en la terraza",
  precio: 1500,
  maxEntradasPorUsuario: 2,
};

document
  .getElementById("btnConseguirEntrada")
  .addEventListener("click", async () => {
    const { nombre, precio, maxEntradasPorUsuario } = evento;

    if (precio === 0) {
      alert(`Entrada gratuita para "${nombre}" confirmada ✅`);
      return;
    }

    const cantidad = prompt(
      `¿Cuántas entradas querés? (Máx: ${maxEntradasPorUsuario})`,
      1
    );

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
        window.location.href = data.init_point;
      } else {
        alert("Error al generar el pago.");
      }
    } catch (error) {
      console.error("Error al conectar con Mercado Pago:", error);
      alert("Hubo un problema al iniciar el pago.");
    }
  });
