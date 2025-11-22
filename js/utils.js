import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

// ------------------------------ TOASTIFY ------------------------------ //

export function mostrarMensaje(
  mensaje,
  color = "#ffffff",
  colorletra = "#000000"
) {
  if (typeof Toastify === "undefined") {
    alert(mensaje);
    return;
  }

  Toastify({
    text: mensaje,
    gravity: "top", // arriba
    position: "center", // centrado horizontalmente
    duration: 2000,
    style: {
      background: color, // color de fondo
      color: colorletra, // color del texto
      width: "80%", // ancho del toast
      margin: "0 auto", // centrar horizontalmente
      textAlign: "center", // centrar texto
    },
  }).showToast();
}

// ------------------------------ CLICK EN PRODUCTOS ------------------------------ //
export function vincularClickProducto(producto, card) {
  card.addEventListener("click", async () => {
    if (producto.stock <= 0) {
      card.classList.add("producto-sin-stock");
      mostrarMensaje("Producto sin stock", "#ff2d03e0", "#fff");
      return;
    }

    const { value: cantidadSeleccionada } = await Swal.fire({
      title: producto.titulo,
      html: `
        <img src="${producto.imgSrc}" alt="${producto.titulo}" style="width:100%;max-width:250px;margin-bottom:1rem;">
        <p>${producto.descripcion}</p>
        <h5>Precio: ${producto.precio}</h5>
        <p>Stock disponible: ${producto.stock}</p>
        <div style="display:flex; justify-content:center; gap:10px; align-items:center; margin-top:1rem;">
          <button id="menos" class="swal2-confirm swal2-styled" style="background:#ccc;color:#000;">-</button>
          <input id="cantidad" type="number" value="1" min="1" max="${producto.stock}" style="width:50px; text-align:center;">
          <button id="mas" class="swal2-confirm swal2-styled" style="background:#ccc;color:#000;">+</button>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Añadir al carrito",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        const input = Swal.getHtmlContainer().querySelector("#cantidad");
        const btnMas = Swal.getHtmlContainer().querySelector("#mas");
        const btnMenos = Swal.getHtmlContainer().querySelector("#menos");

        btnMas.addEventListener("click", () => {
          if (Number(input.value) < producto.stock)
            input.value = Number(input.value) + 1;
        });
        btnMenos.addEventListener("click", () => {
          if (Number(input.value) > 1) input.value = Number(input.value) - 1;
        });
      },
      preConfirm: () => {
        const val = Number(
          Swal.getHtmlContainer().querySelector("#cantidad").value
        );
        if (!val || val < 1 || val > producto.stock) {
          Swal.showValidationMessage(
            `Ingrese una cantidad válida (1-${producto.stock})`
          );
        }
        return val;
      },
    });

    if (cantidadSeleccionada === undefined) return;

    producto.enCarrito = producto.enCarrito || 0;
    const cantidad = Math.min(cantidadSeleccionada, producto.stock);
    producto.enCarrito += cantidad;

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const existe = carrito.some((item) => item.id === producto.id);

    if (existe) {
      carrito = carrito.map((item) =>
        item.id === producto.id
          ? { ...item, enCarrito: producto.enCarrito }
          : item
      );
    } else {
      carrito.push(producto);
    }

    producto.stock -= cantidad;
    localStorage.setItem(
      `stock-${producto.id}`,
      JSON.stringify(producto.stock)
    );
    localStorage.setItem("carrito", JSON.stringify(carrito));
    if (producto.stock <= 0) card.classList.add("producto-sin-stock");

    mostrarMensaje(
      `Agregaste ${cantidad} unidad${cantidad > 1 ? "es" : ""} de ${
        producto.titulo
      }.`,
      "#ffffffda",
      "#000"
    );
  });
}

// formatea fechas tipo "2024-06-15" a "15/06/2024"
export function formatearFecha(fechaStr) {
  if (!fechaStr) return "";

  // Si es un objeto Date o Timestamp de Firestore
  if (typeof fechaStr === "object" && fechaStr.toDate) {
    fechaStr = fechaStr.toDate().toISOString().split("T")[0];
  } else if (fechaStr instanceof Date) {
    fechaStr = fechaStr.toISOString().split("T")[0];
  }
  const partes = fechaStr.split("-");
  if (partes.length !== 3) return fechaStr;

  const [año, mes, dia] = partes;
  return `${dia}/${mes}/${año}`;
}

export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
