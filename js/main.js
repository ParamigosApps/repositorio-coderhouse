const linkSesion = document.getElementById("linkSesion");
const textoSesion = document.getElementById("textoSesion");

textoSesion.addEventListener("mouseover", () => {
  if (localStorage.getItem("logueado") === "true")
    textoSesion.textContent = "Cerrar sesión";
});

textoSesion.addEventListener("mouseout", () => {
  actualizarBotonSesion();
});

function actualizarBotonSesion() {
  const logueado = localStorage.getItem("logueado");

  if (logueado === "true") {
    textoSesion.textContent = "Hola, " + localStorage.getItem("usuarioActual");

    linkSesion.onclick = () => {
      ConfirmarCerrarSesion();
    };
  } else {
    textoSesion.textContent = "Iniciar sesión";
    linkSesion.setAttribute("href", "/pages/iniciar-sesion.html");
    linkSesion.onclick = null;
  }
}

actualizarBotonSesion();

function actualizarCarritoVisual() {
  let imgCarrito = document.getElementById("img-carrito");
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  if (carrito.length > 0) {
    imgCarrito.classList.add("con-productos");
  } else {
    imgCarrito.classList.remove("con-productos");
  }
}

actualizarCarritoVisual();

function ConfirmarCerrarSesion() {
  if (localStorage.getItem("logueado") !== "true") return;
  return Swal.fire({
    title:
      "¿Desea cerrar la sesión de " +
      localStorage.getItem("usuarioActual") +
      "?",
    text: "Para realizar esta acción, presione continuar.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Cerrar sesión",
    cancelButtonText: "Mantener sesión",
    draggable: true,
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.setItem("logueado", "false");
      localStorage.removeItem("usuarioActual");
      actualizarBotonSesion();
      Swal.fire(
        "Sesión cerrada",
        "Has cerrado sesión correctamente.",
        "success",
        (confirmButtonText = "Aceptar")
      );
      actualizarCarritoVisual();
    }
  });
}

ConfirmarCerrarSesion();
