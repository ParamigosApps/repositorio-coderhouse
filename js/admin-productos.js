// /js/admin-productos.js
import { db, storage } from "./firebase.js";
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.js";

// util
const $ = (sel) => document.querySelector(sel);

// elementos
const formCrearProducto = $("#form-crear-producto");
const btnGuardarProducto = $("#btnGuardarProducto");
const mensajeErrorProducto = $("#mensajeErrorProducto");
const contenedorCatalogo = $("#contenedorCatalogo");

const inputNombre = $("#nombreProducto");
const inputPrecio = $("#precioProducto");
const inputDescripcion = $("#descripcionProducto");
const inputCategoria = $("#categoriaProducto");
const inputImagen = $("#imagenProducto");
const inputStock = $("#stockProducto");
const inputDestacado = $("#destacadoProducto");
const contadorDescripcion = $("#contadorDescripcion");

// state
let editingProductId = null;
let editingProductImagePath = null;
let actualizarContador = null;

// init
export function initAdminProductos() {
  if (btnGuardarProducto)
    btnGuardarProducto.addEventListener("click", guardarProducto);

  // Contador de caracteres para descripción
  if (inputDescripcion && contadorDescripcion) {
    actualizarContador = () => {
      const longitud = inputDescripcion.value.length;
      const maximo = 120;
      contadorDescripcion.textContent = `${longitud}/${maximo} caracteres`;

      // Cambiar color si está cerca del límite
      if (longitud > maximo * 0.9) {
        contadorDescripcion.classList.remove("text-muted");
        contadorDescripcion.classList.add("text-warning");
      } else if (longitud >= maximo) {
        contadorDescripcion.classList.remove("text-muted", "text-warning");
        contadorDescripcion.classList.add("text-danger");
      } else {
        contadorDescripcion.classList.remove("text-warning", "text-danger");
        contadorDescripcion.classList.add("text-muted");
      }
    };

    inputDescripcion.addEventListener("input", actualizarContador);
    inputDescripcion.addEventListener("keyup", actualizarContador);
    formCrearProducto.addEventListener("reset", actualizarContador);
    actualizarContador(); // Inicializar contador
  }

  escucharProductos();
}

// validación
function validarFormulario() {
  mensajeErrorProducto.style.display = "none";

  const nombre = inputNombre.value.trim();
  const descripcion = inputDescripcion.value.trim();
  const precio = Number(inputPrecio.value);
  const categoria = inputCategoria.value.trim();
  const stock = Number(inputStock.value);

  if (!nombre) return { ok: false, msg: "El nombre es obligatorio" };
  if (!categoria) return { ok: false, msg: "Seleccioná una categoría" };
  if (!Number.isFinite(precio) || precio < 0)
    return { ok: false, msg: "Precio inválido" };
  if (!Number.isFinite(stock) || stock < 0)
    return { ok: false, msg: "Stock inválido" };

  if (
    !editingProductId &&
    (!inputImagen.files || inputImagen.files.length === 0)
  )
    return { ok: false, msg: "Subí una imagen" };

  return { ok: true };
}

// subir imagen a Storage
async function subirImagenAStorage(file, productId) {
  const path = `productos/${productId}/${Date.now()}_${file.name}`;
  const refFile = storageRef(storage, path);
  const snapshot = await uploadBytes(refFile, file);
  const url = await getDownloadURL(snapshot.ref);
  return { url, path };
}

// guardar / editar
async function guardarProducto() {
  try {
    const v = validarFormulario();
    if (!v.ok) {
      mensajeErrorProducto.innerText = v.msg;
      mensajeErrorProducto.style.display = "block";
      return;
    }

    const data = {
      nombre: inputNombre.value.trim(),
      descripcion: inputDescripcion.value.trim(),
      precio: Number(inputPrecio.value),
      categoria: inputCategoria.value.trim(),
      stock: Number(inputStock.value),
      destacado: !!inputDestacado.checked,
      actualizadoEn: serverTimestamp(),
    };

    // edición
    if (editingProductId) {
      const ref = doc(db, "productos", editingProductId);

      if (inputImagen.files.length > 0) {
        const file = inputImagen.files[0];
        const up = await subirImagenAStorage(file, editingProductId);

        data.imagen = up.url;
        data.imagenPath = up.path;

        // eliminar imagen anterior si existe
        if (editingProductImagePath) {
          try {
            await deleteObject(storageRef(storage, editingProductImagePath));
          } catch (err) {
            console.warn("No se pudo eliminar imagen anterior:", err);
          }
        }
      }

      await updateDoc(ref, data);
      Swal.fire("Actualizado", "El producto se actualizó", "success");
      setFormCreateMode();
      return;
    }

    // nuevo producto
    const docRef = await addDoc(collection(db, "productos"), {
      ...data,
      imagen: "",
      imagenPath: "",
      creadoEn: serverTimestamp(),
    });

    if (inputImagen.files.length > 0) {
      const file = inputImagen.files[0];
      const up = await subirImagenAStorage(file, docRef.id);
      await updateDoc(doc(db, "productos", docRef.id), {
        imagen: up.url,
        imagenPath: up.path,
      });
    }

    Swal.fire("Creado", "Producto agregado", "success");
    formCrearProducto.reset();
    formCrearProducto.style.display = "none";
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo guardar el producto", "error");
  }
}

// snapshot
function escucharProductos() {
  const q = query(collection(db, "productos"), orderBy("creadoEn", "desc"));
  onSnapshot(q, (snap) => {
    renderizarListaProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// render
function renderizarListaProductos(productos) {
  if (!contenedorCatalogo) return;
  contenedorCatalogo.innerHTML = "";
  if (!productos.length)
    return (contenedorCatalogo.innerHTML = `<p>No hay productos</p>`);

  const row = document.createElement("div");
  row.className = "row g-3";

  productos.forEach((p) => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div style="height:160px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f7f7f7">
          <img src="${
            p.imagen || "../Assets/img/placeholder.png"
          }" style="width:100%;height:100%;object-fit:cover">
        </div>
        <div class="card-body d-flex flex-column">
          ${
            p.destacado
              ? `<span class="badge bg-warning text-dark mb-2">DESTACADO</span>`
              : ""
          }
          <h5>${p.nombre}</h5>
          <p class="small text-muted">${p.categoria} – Stock ${p.stock}</p>
          <h6>$${p.precio}</h6>
          <div class="mt-auto d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm flex-fill" onclick="window.__editProducto('${
              p.id
            }')">Editar</button>
            <button class="btn btn-outline-danger btn-sm flex-fill" onclick="window.__deleteProducto('${
              p.id
            }', '${p.nombre}', '${p.imagenPath ?? ""}')">Eliminar</button>
          </div>
        </div>
      </div>
    `;

    row.appendChild(col);
  });

  contenedorCatalogo.appendChild(row);
}

// eliminar
window.__deleteProducto = async (productId, nombre, imagenPath) => {
  const confirm = await Swal.fire({
    title: `Eliminar ${nombre}?`,
    icon: "warning",
    showCancelButton: true,
  });

  if (!confirm.isConfirmed) return;

  await deleteDoc(doc(db, "productos", productId));

  if (imagenPath) {
    try {
      await deleteObject(storageRef(storage, imagenPath));
    } catch (err) {
      console.warn("No se pudo eliminar imagen:", err);
    }
  }

  Swal.fire("Eliminado", `${nombre} fue eliminado`, "success");
};

// edit
window.__editProducto = async (id) => {
  const snap = await getDoc(doc(db, "productos", id));
  if (!snap.exists())
    return Swal.fire("Error", "Producto no encontrado", "error");

  const p = snap.data();
  inputNombre.value = p.nombre;
  inputDescripcion.value = p.descripcion;
  inputPrecio.value = p.precio;
  inputCategoria.value = p.categoria;
  inputStock.value = p.stock;
  inputDestacado.checked = !!p.destacado;

  editingProductId = id;
  editingProductImagePath = p.imagenPath ?? null;

  formCrearProducto.style.display = "block";
  btnGuardarProducto.textContent = "Actualizar producto";
  btnGuardarProducto.classList.remove("btn-success");
  btnGuardarProducto.classList.add("btn-primary");
};

// reset
function setFormCreateMode() {
  editingProductId = null;
  editingProductImagePath = null;

  if (formCrearProducto) formCrearProducto.reset();
  if (btnGuardarProducto) {
    btnGuardarProducto.textContent = "Guardar producto";
    btnGuardarProducto.classList.remove("btn-primary");
    btnGuardarProducto.classList.add("btn-success");
  }
  if (mensajeErrorProducto) mensajeErrorProducto.style.display = "none";

  if (actualizarContador) actualizarContador();
}

document.addEventListener("DOMContentLoaded", () => {
  setFormCreateMode(); // ahora el formulario ya existe
  initAdminProductos(); // inicializa listeners y contadores
});
