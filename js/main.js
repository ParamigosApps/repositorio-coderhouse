//NOMBRE USUARIO
const nombreGuardado = localStorage.getItem("nombreUsuario");
let nombre = "";
const h2 = document.querySelector("#h2-nav-user");

if (nombreGuardado) {
  nombre = nombreGuardado;
} else {
  nombre = prompt("Bienvenido, ingresá tu nombre:");

  if (nombre != null) localStorage.setItem("nombreUsuario", nombre);
  else nombre = prompt("Por favor, ingresá tu nombre:");
}

if (nombre) {
  h2.textContent = `Hola, ${nombre}`;
} else {
  h2.textContent = "Hola, Invitado";
}
//CARRITO DE COMPRAS

let carrito = [];
let carritoTotal = 0;
let carritoTexto = "";

let stock = [
  { nombre: "GrapeFruit - Lost Mary 30K", cantidad: 1 },
  { nombre: "Peach Lemonade - Nasty 5K", cantidad: 3 },
  { nombre: "Menta - Elfbar 40K", cantidad: 4 },
  { nombre: "Frutilla - Elfbar 40K", cantidad: 1 },
];

const botones = document.querySelectorAll(".btn-agregar");
botones.forEach((boton) => {
  boton.addEventListener("click", (e) => {
    const productCard = e.target.closest(".product-card");
    const nombre = productCard.querySelector(
      ".product-description-title"
    ).textContent;
    const precio = parseInt(
      productCard
        .querySelector(".product-price")
        .textContent.replace(/[^0-9]+/g, ""),
      10
    );

    const productoStock = stock.find((item) => item.nombre === nombre);

    if (!productoStock || productoStock.cantidad <= 0) {
      alert(
        `Lo sentimos, ${nombre} se encuentra sin stock. Por favor, elige otro producto.`
      );
      return;
    }
    productoStock.cantidad -= 1;
    const index = carrito.findIndex((item) => item.nombre === nombre);

    if (index !== -1) {
      carrito[index].cantidad += 1;
      carrito[index].subtotal = carrito[index].precio * carrito[index].cantidad;
    } else {
      carrito.push({ nombre, precio, cantidad: 1, subtotal: precio });
    }
    carritoTotal += precio;
    actualizarCarrito(nombre);
  });
});

function actualizarCarrito(nombre) {
  carritoTexto = carrito
    .map((item, index) => {
      return `${index + 1}. ${item.nombre} - Cantidad: ${
        item.cantidad
      } - Subtotal: $${item.subtotal.toLocaleString()}`;
    })
    .join("\n");

  carritoTexto += `\n\nTotal: $${carritoTotal}`;

  const opcion = confirm(
    `${nombre} se añadió al carrito!\n\nCARRITO ACTUAL:\n${carritoTexto}\n\nACEPTAR: Ir al carrito\nCANCELAR: Seguir comprando`
  );
  if (opcion) finalizarCompra();
  else console.log("${nombre} agregado, sigue comprando.");
}

function finalizarCompra() {
  alert(
    `Felicitaciones por tu compra!\n\n ${carritoTexto}\n\n\nGracias por elegirnos, ${nombre}!
  `
  );
  carrito = [];
  carritoTotal = 0;
  console.log("El carrito ha sido vaciado después de la compra.");
}
