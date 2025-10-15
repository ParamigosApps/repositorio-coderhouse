const linkSesion = document.getElementById("linkSesion");
const textoSesion = document.getElementById("textoSesion");

// Cambia el nombre del usuario a Cerrar sesion y permite acceder a la funcion
textoSesion.addEventListener("mouseover", () => {
  if (localStorage.getItem("logueado") === "true")
    textoSesion.textContent = "Cerrar sesión";
});
// Cuando se quita el mouse de encima
textoSesion.addEventListener("mouseout", () => {
  actualizarBotonSesion();
});

//Mostramos el nombre del usuario iniciado o el "iniciar sesion"
function actualizarBotonSesion() {
  const logueado = localStorage.getItem("logueado");

  if (logueado === "true") {
    textoSesion.textContent = localStorage.getItem("usuarioActual");

    linkSesion.onclick = () => {
      event.preventDefault();
      ConfirmarCerrarSesion();
    };
  } else {
    textoSesion.textContent = "Iniciar sesión";
    linkSesion.setAttribute("href", "/pages/iniciar-sesion.html");
    linkSesion.onclick = null;
  }
}

// Animamos el icono de carrito si contiene productos
function actualizarCarritoVisual() {
  let imgCarrito = document.getElementById("img-carrito");
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  if (carrito.length > 0) {
    imgCarrito.classList.add("con-productos");
  } else {
    imgCarrito.classList.remove("con-productos");
  }
}

function ConfirmarCerrarSesion() {
  if (localStorage.getItem("logueado") != "true") return;
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
      const formulario = document.querySelector(".inicio-sesion");
      const cerrarSesionSection = document.getElementById(
        "cerrar-sesion-section"
      );
      formulario.style.display = "block";
      cerrarSesionSection.style.display = "block";
    }
  });
}

actualizarBotonSesion();
actualizarCarritoVisual();
