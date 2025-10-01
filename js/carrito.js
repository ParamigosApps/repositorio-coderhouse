const carritoItems = document.getElementById("carrito-items");
const montoTotalCarrito = document.getElementById("MontoTotalCarrito");
const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
carritoItems.innerHTML = "";

function calcularTotal() {
  const subtotales = Array.from(
    document.getElementsByClassName("subtotalProducto")
  );
  let totalCarrito = 0;
  subtotales.forEach((td) => {
    const valor = parseInt(td.textContent.replace("$", "").replace(".", ""));
    totalCarrito += valor;
  });
  console.log("Total calculado:", totalCarrito);
  return totalCarrito;
}

carrito.forEach((producto, idbtn) => {
  const card = document.createElement("tr");
  card.innerHTML = `
      <td class="text-start">
        <img src="${producto.imgSrc}" alt="${producto.titulo}" class="img-producto-carrito" />
        ${producto.titulo}
      </td>
      <td>1</td>
      <td class="precioUnitarioProducto">${producto.precio}</td>
      <td class="subtotalProducto">${producto.precio}</td>
      <td>
        <button class="btn btn-danger btn-sm" data-index="${idbtn}">Eliminar</button>
      </td>
    `;
  carritoItems.appendChild(card);
});

montoTotalCarrito.textContent = "$" + calcularTotal();

// ELIMINAR PRODUCTOS
carritoItems.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-danger")) {
    const index = e.target.dataset.index;
    let productoAEliminar = carrito[index];

    // Restaurar stock
    let stockActual = JSON.parse(
      localStorage.getItem(`stock-${productoAEliminar.id}`)
    );
    localStorage.setItem(
      `stock-${productoAEliminar.id}`,
      JSON.stringify(stockActual + 1)
    );

    // Actualizar carrito
    carrito.splice(index, 1);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    location.reload();
  }
});
