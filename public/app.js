// Lógica de la página: formulario, validación y lista.
// No toca localStorage: todo el acceso a datos está en productos.js.
import { listarProductos, agregarProducto, editarProducto } from './productos.js';

const form = document.getElementById('form-producto');
const tituloForm = document.getElementById('titulo-form');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');
const errores = document.getElementById('errores');
const lista = document.getElementById('lista');
const tabla = document.getElementById('tabla');
const vacio = document.getElementById('vacio');

let editandoId = null;

function leerFormulario() {
  const datos = new FormData(form);
  return {
    nombre: datos.get('nombre').trim(),
    sku: datos.get('sku').trim(),
    cantidad: datos.get('cantidad').trim(),
    minimo: datos.get('minimo').trim(),
  };
}

// Máximo de una columna integer de Postgres (docs/diseno.md).
const ENTERO_MAX = 2147483647;

function esEntero(texto) {
  return /^-?\d+$/.test(texto) && Math.abs(Number(texto)) <= ENTERO_MAX;
}

// Reglas de docs/requisitos.md (H2). Regresa la lista de mensajes de error.
function validar(valores, productos) {
  const mensajes = [];

  if (!valores.nombre) mensajes.push('El nombre es obligatorio.');

  if (!valores.sku) {
    mensajes.push('El SKU es obligatorio.');
  } else if (!/^[A-Za-z0-9-]+$/.test(valores.sku)) {
    mensajes.push('El SKU solo acepta letras, números y guiones.');
  } else if (productos.some((p) => p.sku === valores.sku && p.id !== editandoId)) {
    mensajes.push(`Ya tienes un producto con el SKU ${valores.sku}.`);
  }

  if (!valores.cantidad) {
    mensajes.push('La cantidad es obligatoria.');
  } else if (!esEntero(valores.cantidad) || Number(valores.cantidad) < 0) {
    mensajes.push(`La cantidad debe ser un número entero entre 0 y ${ENTERO_MAX}.`);
  }

  if (!valores.minimo) {
    mensajes.push('El mínimo es obligatorio.');
  } else if (!esEntero(valores.minimo) || Number(valores.minimo) < 5) {
    mensajes.push(`El mínimo debe ser un número entero entre 5 y ${ENTERO_MAX}.`);
  }

  return mensajes;
}

function mostrarErrores(mensajes) {
  errores.replaceChildren(
    ...mensajes.map((texto) => {
      const li = document.createElement('li');
      li.textContent = texto;
      return li;
    }),
  );
}

function celda(texto, clase) {
  const td = document.createElement('td');
  td.textContent = texto;
  if (clase) td.className = clase;
  return td;
}

async function pintarLista() {
  const productos = await listarProductos();
  tabla.hidden = productos.length === 0;
  vacio.hidden = productos.length !== 0;

  lista.replaceChildren(
    ...productos.map((p) => {
      const tr = document.createElement('tr');
      const bajo = p.cantidad <= p.minimo;
      if (bajo) tr.className = 'bajo';

      const nombre = celda(p.nombre);
      if (bajo) {
        const marca = document.createElement('span');
        marca.className = 'marca';
        marca.textContent = 'Bajo mínimo';
        nombre.append(' ', marca);
      }

      const acciones = document.createElement('td');
      const editar = document.createElement('button');
      editar.type = 'button';
      editar.textContent = 'Editar';
      editar.addEventListener('click', () => empezarEdicion(p));
      acciones.append(editar);

      tr.append(nombre, celda(p.sku), celda(p.cantidad, 'num'), celda(p.minimo, 'num'), acciones);
      return tr;
    }),
  );
}

function empezarEdicion(producto) {
  editandoId = producto.id;
  form.nombre.value = producto.nombre;
  form.sku.value = producto.sku;
  form.cantidad.value = producto.cantidad;
  form.minimo.value = producto.minimo;
  tituloForm.textContent = `Editar ${producto.nombre}`;
  btnGuardar.textContent = 'Guardar cambios';
  btnCancelar.hidden = false;
  mostrarErrores([]);
  form.nombre.focus();
}

function terminarEdicion() {
  editandoId = null;
  form.reset();
  tituloForm.textContent = 'Agregar producto';
  btnGuardar.textContent = 'Agregar';
  btnCancelar.hidden = true;
  mostrarErrores([]);
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const valores = leerFormulario();
  const mensajes = validar(valores, await listarProductos());
  if (mensajes.length > 0) {
    mostrarErrores(mensajes);
    return;
  }

  const producto = {
    nombre: valores.nombre,
    sku: valores.sku,
    cantidad: Number(valores.cantidad),
    minimo: Number(valores.minimo),
  };

  if (editandoId) {
    await editarProducto(editandoId, producto);
  } else {
    await agregarProducto(producto);
  }
  terminarEdicion();
  await pintarLista();
});

btnCancelar.addEventListener('click', terminarEdicion);

pintarLista();
