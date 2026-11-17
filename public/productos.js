// Acceso a datos de Mini Inventario.
// Todo lo que lee o escribe productos pasa por este archivo.
// Por ahora usa localStorage; después se cambiará por Supabase
// sin tocar el resto de la página. Por eso las funciones son async.

const CLAVE = 'mini-inventario:productos';

function leer() {
  const texto = localStorage.getItem(CLAVE);
  return texto ? JSON.parse(texto) : [];
}

function escribir(productos) {
  localStorage.setItem(CLAVE, JSON.stringify(productos));
}

export async function listarProductos() {
  return leer().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export async function agregarProducto({ nombre, sku, cantidad, minimo }) {
  const productos = leer();
  const producto = {
    id: crypto.randomUUID(),
    nombre,
    sku,
    cantidad,
    minimo,
    created_at: new Date().toISOString(),
  };
  productos.push(producto);
  escribir(productos);
  return producto;
}

export async function editarProducto(id, { nombre, sku, cantidad, minimo }) {
  const productos = leer();
  const producto = productos.find((p) => p.id === id);
  if (!producto) {
    throw new Error('El producto ya no existe.');
  }
  Object.assign(producto, { nombre, sku, cantidad, minimo });
  escribir(productos);
  return producto;
}
