const inputBuscador = document.getElementById("buscador");
const contenedorProductos = document.getElementById("productos-container");
const avisoBuscador = document.getElementById("aviso-buscador");

inputBuscador.addEventListener("keyup", () => {
  const valorBuscado = inputBuscador.value.toLowerCase();

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

inputBuscador.addEventListener("input", () => {
  if (inputBuscador.value === "") {
    avisoBuscador.style.display = "none";

    const productos = contenedorProductos.getElementsByClassName(
      "product-description-title"
    );

    Array.from(productos).forEach((producto) => {
      const card = producto.closest(".product-card");
      card.style.display = "";
    });
  }
});
