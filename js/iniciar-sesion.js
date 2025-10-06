// VARIABLES
const check = document.getElementById("CheckNuevoUsuario");
const userIngresado = document.getElementById("InputUser");
const passIngresado = document.getElementById("InputPassword");
const submit = document.getElementById("submit");
const aviso = document.getElementById("p-error-inicio-sesion");
const aviso2 = document.getElementById("p-error-inicio-sesion2");

let usuarioRegistrado = false;

//ADMINISTRADOR
const userAdmin = {
  nombre: "Iván",
  usuario: "admin",
  password: "1234",
};
//INICIAR SESION
submit.addEventListener("click", (e) => {
  if (!check.checked) iniciarSesion(e);
  else registrarUsuario(e);
});

function iniciarSesion(e) {
  if (localStorage.getItem("logueado") === "true") {
    e.preventDefault();
    aviso.textContent =
      "Te encuentras en una sesión activa. Cierra sesión para iniciar con otra cuenta.";
    aviso.style.color = "red";
    aviso2.textContent = "";
    return;
  }
  if (!userIngresado.value || !passIngresado.value) {
    e.preventDefault();
    aviso.textContent = "Por favor, completa todos los campos.";
    return;
  }
  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuarioValido = usuarios.find(
    (u) =>
      u.usuario === userIngresado.value && u.password === passIngresado.value
  );

  if (!usuarioValido) {
    e.preventDefault();
    aviso.textContent = "*Usuario o contraseña incorrectos*";
    return;
  }

  e.preventDefault();
  localStorage.setItem("logueado", "true");
  localStorage.setItem("usuarioActual", usuarioValido.usuario);
  aviso.textContent =
    "¡Iniciaste sesión correctamente! Bienvenido " + usuarioValido.usuario;
  aviso.style.color = "green";
  Bienvenido(
    "Iniciaste sesión correctamente. Serás redirigido a la página principal."
  );
}

function registrarUsuario(e) {
  e.preventDefault();

  if (localStorage.getItem("logueado") === "true") {
    e.preventDefault();
    aviso.textContent =
      "Te encuentras en una sesión activa. Cierra sesión para iniciar con otra cuenta.";
    aviso.style.color = "red";
    aviso2.textContent = "";
    return;
  }

  let valido = true;

  // Validar usuario
  if (userIngresado.value.length < 4) {
    aviso.textContent = " *Usuario deben tener al menos 4 caracteres*";
    aviso.style.color = "red";
    valido = false;
  } else {
    aviso.textContent = "Usuario válido.";
    aviso.style.color = "green";
  }

  // Validar contraseña
  if (passIngresado.value.length < 4) {
    aviso2.textContent = "*Contraseña deben tener al menos 4 caracteres*";
    aviso2.style.color = "red";
    valido = false;
  } else {
    aviso2.textContent = "Contraseña válida.";
    aviso2.style.color = "green";
  }

  if (!valido) return;

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const existe = usuarios.some((u) => u.usuario === userIngresado.value);
  if (existe) {
    aviso.textContent = "*El usuario ya existe*";
    aviso.style.color = "red";
    aviso2.textContent = "";

    return;
  }

  // Crear usuario nuevo
  const nuevoUsuario = {
    usuario: userIngresado.value,
    password: passIngresado.value,
    admin: false,
  };

  // Guardar en localStorage
  usuarios.push(nuevoUsuario);
  localStorage.setItem("usuarios", JSON.stringify(usuarios));

  localStorage.setItem("usuarioActual", nuevoUsuario.usuario);
  localStorage.setItem("logueado", "true");

  aviso.textContent = "Usuario registrado correctamente!";
  aviso.style.color = "green";
  Bienvenido(
    "Te registraste correctamente. Serás redirigido a la página principal."
  );
}

// INICIAR SESION / REGISTRARSE ESCUCHAR CAMBIO
check.addEventListener("change", () => {
  if (check.checked) {
    submit.textContent = "Registrarse";
    userIngresado.placeholder = "Crea tu usuario";
    passIngresado.placeholder = "Crea tu contraseña";
    aviso.textContent = "Usuario min: 4 caracteres.";
    aviso2.textContent = "Contraseña min: 4 caracteres.";
    aviso.style.color = "black";
  } else {
    submit.textContent = "Iniciar sesión";
    userIngresado.placeholder = "Ingresa tu usuario";
    passIngresado.placeholder = "Ingresa tu contraseña";
    aviso.textContent = "";
    aviso2.textContent = "";
    aviso.style.color = "red";
  }
});

function Bienvenido(mensaje) {
  Swal.fire({
    title: "Bienvenido/a " + localStorage.getItem("usuarioActual"),
    text: mensaje,
    confirmButtonText: "Ir al inicio",
    icon: "success",
    draggable: true,
  }).then(() => {
    window.location.href = "/index.html";
  });
}

function NuevoRegistro(mensaje) {
  Swal.fire({
    title: "Bienvenido/a " + localStorage.getItem("usuarioActual"),
    text: mensaje,
    confirmButtonText: "Ir al inicio",
    icon: "success",
    draggable: true,
  }).then(() => {
    window.location.href = "/index.html";
  });
}
