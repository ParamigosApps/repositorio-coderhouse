const variableSelect = document.getElementById("variableProducto");
const subVariableInput = document.getElementById("subVariableInput");
const addSubVariableBtn = document.getElementById("addSubVariable");
const subVariableList = document.getElementById("subVariableList");
const alertaVariable = document.getElementById("alertaVariable");

const cantSubVariables = 10;
let subVariables = {
  color: [],
  talle: [],
  sabor: [],
};

const colores = {
  color: "bg-primary text-white",
  talle: "bg-success text-white",
  sabor: "bg-warning text-dark",
};

function renderTags(variable) {
  let tag = Array.from(subVariableList.children).find(
    (t) => t.dataset.variable === variable
  );

  if (!tag) {
    tag = document.createElement("span");
    tag.dataset.variable = variable;
    tag.className = `badge ${colores[variable]} p-3 fs-5 fw-bold rounded-pill d-inline-flex align-items-center gap-2`;
    tag.style.margin = "2px";
    subVariableList.appendChild(tag);
  }

  // Limpiar contenido
  tag.innerHTML = "";

  // Añadir título
  const title = document.createElement("strong");
  title.textContent =
    variable.charAt(0).toUpperCase() + variable.slice(1) + ": ";
  tag.appendChild(title);

  // Añadir subvariables
  subVariables[variable].forEach((subVal) => {
    const subSpan = document.createElement("span");
    subSpan.textContent = subVal;
    subSpan.style.cursor = "pointer";
    subSpan.style.marginRight = "6px";

    const closeBtn = document.createElement("span");
    closeBtn.textContent = "×";
    closeBtn.style.marginLeft = "4px";
    closeBtn.style.fontWeight = "bold";
    closeBtn.style.cursor = "pointer";

    closeBtn.addEventListener("click", () => {
      subVariables[variable] = subVariables[variable].filter(
        (v) => v !== subVal
      );
      if (subVariables[variable].length === 0) {
        tag.remove();
      } else {
        renderTags(variable);
      }
    });

    subSpan.appendChild(closeBtn);
    tag.appendChild(subSpan);
  });
}

function addSubVariable(value) {
  const variable = variableSelect.value;
  value = value.trim();

  if (!variable || !value) {
    alertaVariable.textContent = !variable
      ? "Debe seleccionar una variable primero."
      : "Escriba el color, talle o sabor que desea añadir.";
    alertaVariable.classList.remove("d-none");
    return;
  }

  if (subVariables[variable].length >= cantSubVariables) {
    alertaVariable.textContent = `No se puede agregar más de ${cantSubVariables} ${variable}es.`;
    alertaVariable.classList.remove("d-none");
    return;
  }

  alertaVariable.classList.add("d-none");

  // Evitar duplicados
  if (!subVariables[variable].includes(value)) {
    subVariables[variable].push(value);
    renderTags(variable);
  }

  subVariableInput.value = "";
}

// Botón y Enter
addSubVariableBtn.addEventListener("click", () =>
  addSubVariable(subVariableInput.value)
);
subVariableInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addSubVariable(subVariableInput.value);
  }
});
