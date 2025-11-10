const inputBuscador = document.getElementById("buscador");
const contenedorProductos = document.getElementById("productos-container");
const avisoBuscador = document.getElementById("aviso-buscador");

// Evitamos recargar la pagina y perder la busqueda
inputBuscador.addEventListener("keydown", (e) => {
  if (e.key === "Enter") e.preventDefault();
});

inputBuscador.addEventListener("input", () => {
  const valorBuscado = inputBuscador.value.toLowerCase().trim();

  // Si no hay texto, restauramos vista normal
  if (valorBuscado === "") {
    avisoBuscador.style.display = "none";
    botonMostrarMas.style.display = "block";
    window.mostrarTodo = false;
    cargarProductos();
    ordenarPorPrecio();
    return;
  }

  // Ocultamos el botón de "mostrar más" mientras se filtra
  botonMostrarMas.style.display = "none";

  // Mostramos todos los productos temporalmente para filtrar
  window.mostrarTodo = true;
  cargarProductos();
  ordenarPorPrecio();
  const productos = contenedorProductos.getElementsByClassName(
    "product-description-title"
  );

  let sinResultados = true;
  Array.from(productos).forEach((producto) => {
    const card = producto.closest(".product-card");
    const textoProducto = producto.textContent.toLowerCase();

    if (textoProducto.includes(valorBuscado)) {
      card.style.display = "";
      sinResultados = false;
    } else {
      card.style.display = "none";
    }
  });

  if (sinResultados) {
    avisoBuscador.textContent = `Sin coincidencias para "${valorBuscado}"`;
    avisoBuscador.style.display = "block";
  } else {
    avisoBuscador.style.display = "none";
  }
});

//Ordenar por precio
const ordenPrecio = document.getElementById("orden-precio");

ordenPrecio.addEventListener("change", ordenarPorPrecio);

function ordenarPorPrecio() {
  const cards = Array.from(contenedorProductos.children);

  cards.sort((a, b) => {
    const precioA = Number(
      a.querySelector(".product-price").textContent.replace(/\D/g, "")
    );
    const precioB = Number(
      b.querySelector(".product-price").textContent.replace(/\D/g, "")
    );

    if (ordenPrecio.value === "asc") return precioA - precioB;
    else if (ordenPrecio.value === "desc") return precioB - precioA;
  });

  cards.forEach((card) => contenedorProductos.appendChild(card));
}
