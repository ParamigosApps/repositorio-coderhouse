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

export function formatearFecha(fecha) {
  if (!fecha) return "Fecha inválida";

  const d = fecha instanceof Date ? fecha : new Date(fecha);

  // Fecha: dd/mm/yyyy
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const año = d.getFullYear();

  // Hora: hh:mm
  const horas = String(d.getHours()).padStart(2, "0");
  const minutos = String(d.getMinutes()).padStart(2, "0");

  return `${dia}/${mes}/${año} - ${horas}:${minutos} hs`;
}

export function popupAñadido(nombre, cantidad) {
  return Swal.fire({
    title: "¡Producto añadido!",
    html: `<p style="font-size:18px;font-weight:600;">${nombre} x${cantidad} agregado al carrito 🛒</p>`,
    icon: "success",
    showCancelButton: true,
    confirmButtonText: "Ir al carrito",
    cancelButtonText: "Seguir comprando",
    reverseButtons: true,
    customClass: {
      popup: "swal-popup-custom",
      confirmButton: "swal-btn-confirm",
      cancelButton: "swal-btn-cancel",
    },
    buttonsStyling: false,
  });
}

export function obtenerFechaCompra() {
  const fecha = new Date().toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  });

  // "23/11/2025, 19:46" → ["23/11/2025", " 19:46"]
  const [soloFecha, soloHora] = fecha.split(",");

  return `${soloFecha} - ${soloHora.trim()} HS`;
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
