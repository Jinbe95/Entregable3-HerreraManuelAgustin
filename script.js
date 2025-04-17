// VARIABLES GLOBALES
let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let indicesImagenes = [];

// INICIALIZACION
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("productos.json");
    productos = await res.json();
    indicesImagenes = new Array(productos.length).fill(0);

    mostrarProductos();
    mostrarCarrito();
  } catch (error) {
    Swal.fire("Error", "No se pudieron cargar los productos", "error");
  }

  // Boton: Vaciar carrito
  document.getElementById("vaciar-carrito").addEventListener("click", () => {
    carrito = [];
    guardarCarrito();
    mostrarCarrito();
  });

  // Boton: Finalizar compra
  document.getElementById("finalizar-compra").addEventListener("click", async () => {
    const total = calcularTotal();

    const { value: formValues } = await Swal.fire({
      title: "Completa tus datos",
      html: `
        <input id="swal-nombre" class="swal2-input" placeholder="Nombre">
        <input id="swal-apellido" class="swal2-input" placeholder="Apellido">
        <input id="swal-direccion" class="swal2-input" placeholder="Domicilio">
        <input id="swal-email" type="email" class="swal2-input" placeholder="Email">
        
        <select id="swal-metodo" class="swal2-input" style="margin-top: 15px;">
          <option value="">Método de pago</option>
          <option value="credito">Tarjeta de crédito</option>
          <option value="debito">Tarjeta de débito</option>
          <option value="transferencia">Transferencia</option>
        </select>

        <div id="datos-tarjeta" style="display:none;">
          <input id="tarjeta-numero" class="swal2-input" placeholder="Número de tarjeta">
          <input id="tarjeta-vencimiento" class="swal2-input" placeholder="Vencimiento (MM/AA)">
          <input id="tarjeta-cvv" class="swal2-input" placeholder="CVV">
        </div>

        <div id="datos-transferencia" style="display:none; padding: 5px;">
          <p style="color: #000000;">Transferí al alias: <strong>game.coin.mp</strong> o CVU: <strong>000123456789000</strong></p>
        </div>
      `,
      focusConfirm: false,
      confirmButtonText: "Confirmar pedido",
      showCancelButton: true,
      didOpen: () => {
        const metodoSelect = document.getElementById("swal-metodo");
        metodoSelect.addEventListener("change", () => {
          const tarjetaDiv = document.getElementById("datos-tarjeta");
          const transDiv = document.getElementById("datos-transferencia");

          tarjetaDiv.style.display = (metodoSelect.value === "credito" || metodoSelect.value === "debito") ? "block" : "none";
          transDiv.style.display = metodoSelect.value === "transferencia" ? "block" : "none";
        });
      },
      preConfirm: () => {
        const nombre = document.getElementById("swal-nombre").value;
        const apellido = document.getElementById("swal-apellido").value;
        const direccion = document.getElementById("swal-direccion").value;
        const email = document.getElementById("swal-email").value;
        const metodo = document.getElementById("swal-metodo").value;

        if (!nombre || !apellido || !direccion || !email || !metodo) {
          Swal.showValidationMessage("Por favor completá todos los campos requeridos");
          return false;
        }

        if (metodo === "credito" || metodo === "debito") {
          const num = document.getElementById("tarjeta-numero").value;
          const venc = document.getElementById("tarjeta-vencimiento").value;
          const cvv = document.getElementById("tarjeta-cvv").value;
          if (!num || !venc || !cvv) {
            Swal.showValidationMessage("Completá los datos de la tarjeta");
            return false;
          }
        }

        return { nombre, apellido, direccion, email, metodo };
      }
    });

    if (formValues) {
      carrito = [];
      guardarCarrito();
      mostrarCarrito();

      const metodoTexto = {
        credito: "Tarjeta de crédito",
        debito: "Tarjeta de débito",
        transferencia: "Transferencia"
      };

      Swal.fire({
        icon: "success",
        title: "¡Gracias por tu compra!",
        html: `
          <p><strong>Nombre:</strong> ${formValues.nombre} ${formValues.apellido}</p>
          <p><strong>Domicilio:</strong> ${formValues.direccion}</p>
          <p><strong>Email:</strong> ${formValues.email}</p>
          <p><strong>Método de pago:</strong> ${metodoTexto[formValues.metodo]}</p>
          <p><strong>Total abonado:</strong> $${total}</p>
          <br>
          <p style="font-weight:bold; color:#00fff7;">Tu pedido ha sido reservado 🛍️</p>
        `,
        confirmButtonText: "Cerrar"
      });
    }
  });
});

// MOSTRAR PRODUCTOS
function mostrarProductos() {
  const contenedor = document.getElementById("contenedor-productos");
  contenedor.innerHTML = "";

  productos.forEach((prod, index) => {
    const div = document.createElement("div");
    div.className = "game-card";

    div.innerHTML = `
      <h2>${prod.nombre}</h2>
      <div class="gallery">
        <img id="img-${index}" src="${prod.imagenes[0]}" alt="${prod.nombre}">
        <div>
          <button onclick="cambiarImagen(${index}, -1)" class="prev">⏮️</button>
          <button onclick="cambiarImagen(${index}, 1)" class="next">⏭️</button>
        </div>
      </div>
      <p>Precio: $${prod.precio.toLocaleString()}</p>
      <button onclick="agregarAlCarrito(${index})" class="add-to-cart">Agregar al carrito</button>
    `;

    contenedor.appendChild(div);
  });
}

// CAMBIAR IMAGENES
function cambiarImagen(indice, direccion) {
  const imagenes = productos[indice].imagenes;
  indicesImagenes[indice] = (indicesImagenes[indice] + direccion + imagenes.length) % imagenes.length;
  const img = document.getElementById(`img-${indice}`);
  img.src = imagenes[indicesImagenes[indice]];
}

// AGREGAR AL CARRITO
function agregarAlCarrito(indice) {
  const producto = productos[indice];
  const yaEnCarrito = carrito.find(p => p.nombre === producto.nombre);

  if (yaEnCarrito) {
    Swal.fire("Info", "Este juego ya está en el carrito", "info");
    return;
  }

  carrito.push(producto);
  guardarCarrito();
  mostrarCarrito();

  Swal.fire({
    icon: "success",
    title: "Agregado al carrito",
    text: `"${producto.nombre}" fue agregado correctamente 🛒`,
    timer: 1500,
    showConfirmButton: false
  });
}

// MOSTRAR CARRITO Y TOTAL
function mostrarCarrito() {
  const lista = document.getElementById("carrito-lista");
  const total = document.getElementById("total");
  lista.innerHTML = "";

  const carritoContainer = document.getElementById("carrito-container");
  carritoContainer.classList.add("resaltar");
  setTimeout(() => carritoContainer.classList.remove("resaltar"), 300);

  carrito.forEach((item, i) => {
    const li = document.createElement("li");
    li.textContent = `${item.nombre} - $${item.precio.toLocaleString()}`;
    const btnEliminar = document.createElement("button");
    btnEliminar.innerHTML = "🗑️";
    btnEliminar.className = "eliminar-btn";
    btnEliminar.title = "Eliminar del carrito";
    btnEliminar.onclick = () => {
      carrito.splice(i, 1);
      guardarCarrito();
      mostrarCarrito();
    };
    li.appendChild(btnEliminar);
    lista.appendChild(li);
  });

  let totalPrecio = calcularTotal();
  total.innerHTML = totalPrecio < carrito.reduce((a, b) => a + b.precio, 0)
    ? `Total con descuento: $${totalPrecio.toLocaleString()}`
    : `Total: $${totalPrecio.toLocaleString()}`;
}

// CALCULAR TOTAL CON DESCUENTOS
function calcularTotal() {
  let total = carrito.reduce((acc, el) => acc + el.precio, 0);
  let descuento = 0;

  if (carrito.length >= 5) descuento = 0.4;
  else if (carrito.length >= 3) descuento = 0.3;

  return Math.round(total * (1 - descuento));
}

// GUARDAR CARRITO
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}
