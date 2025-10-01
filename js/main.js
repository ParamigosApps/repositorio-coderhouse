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
    textoSesion.textContent = "Ingreso/Registro";
    linkSesion.setAttribute("href", "pages/iniciar-sesion.html");
    linkSesion.onclick = null;
  }
}

actualizarBotonSesion();
