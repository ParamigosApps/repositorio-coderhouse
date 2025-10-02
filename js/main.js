const linkSesion = document.getElementById("linkSesion");
const textoSesion = document.getElementById("textoSesion");

function actualizarBotonSesion() {
  const logueado = localStorage.getItem("logueado");

  if (logueado === "true") {
    textoSesion.textContent = "Cerrar sesión";
    linkSesion.removeAttribute("href");
    linkSesion.onclick = () => {
      localStorage.removeItem("logueado");
      localStorage.removeItem("usuarioActual");
      actualizarBotonSesion();
    };
  } else {
    textoSesion.textContent = "Iniciar sesión";
    linkSesion.setAttribute("href", "pages/iniciar-sesion.html");
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
