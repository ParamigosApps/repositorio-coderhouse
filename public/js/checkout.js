const form = document.getElementById("form-contenedor");
const btnFinalizar = document.getElementById("btn-finalizarcompra");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  Swal.fire({
    title: "¡Compra éxitosa!",
    text: "Le enviaremos a su mail toda la información necesaria.",
    icon: "success",
    confirmButtonColor: "#3085d6",
    confirmButtonText: "Aceptar",
  });
  console.log(camposvacios);
});
