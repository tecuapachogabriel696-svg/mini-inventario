// @ts-check
const { test, expect } = require('@playwright/test');
const { credenciales, skuUnico, borrarProductos } = require('./apoyo');

// SKU creados por cada prueba (incluidos los SKU nuevos tras editar); se borran al terminar, pase o falle.
let creados = [];

test.afterEach(async () => {
  await borrarProductos(creados);
  creados = [];
});

async function iniciarSesion(page) {
  const { email, password } = credenciales();
  await page.goto('/');
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
}

async function llenarFormulario(page, { nombre, sku, cantidad, minimo }) {
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('SKU').fill(sku);
  await page.getByLabel('Cantidad').fill(String(cantidad));
  await page.getByLabel('Mínimo').fill(String(minimo));
}

// Busca la fila por la celda con el SKU exacto, para que un SKU no coincida dentro de otro.
function filaDe(page, sku) {
  return page.getByRole('row').filter({ has: page.getByRole('cell', { name: sku, exact: true }) });
}

async function agregarProducto(page, producto) {
  creados.push(producto.sku);
  await llenarFormulario(page, producto);
  await page.getByRole('button', { name: 'Agregar' }).click();
  const fila = filaDe(page, producto.sku);
  await expect(fila).toBeVisible();
  return fila;
}

test('edita el nombre, SKU y cantidad de un producto', async ({ page }) => {
  await iniciarSesion(page);
  const skuOriginal = skuUnico();
  const fila = await agregarProducto(page, { nombre: 'Prueba editar', sku: skuOriginal, cantidad: 20, minimo: 5 });

  await fila.getByRole('button', { name: 'Editar' }).click();
  await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible();
  await expect(page.getByLabel('SKU')).toHaveValue(skuOriginal);

  const skuNuevo = skuUnico();
  creados.push(skuNuevo);
  await llenarFormulario(page, { nombre: 'Prueba editada', sku: skuNuevo, cantidad: 3, minimo: 5 });
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  const filaEditada = filaDe(page, skuNuevo);
  await expect(filaEditada).toBeVisible();
  await expect(filaEditada.getByRole('cell')).toHaveText(['Prueba editada Bajo mínimo', skuNuevo, '3', '5', 'Editar']);
  await expect(filaDe(page, skuOriginal)).toHaveCount(0);
  // Al guardar, el formulario vuelve al modo de agregar.
  await expect(page.getByRole('button', { name: 'Agregar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar' })).toBeHidden();
});

test('rechaza editar un producto con el SKU de otro', async ({ page }) => {
  await iniciarSesion(page);
  const skuA = skuUnico();
  const skuB = skuUnico();
  const filaA = await agregarProducto(page, { nombre: 'Prueba A', sku: skuA, cantidad: 10, minimo: 5 });
  await agregarProducto(page, { nombre: 'Prueba B', sku: skuB, cantidad: 10, minimo: 5 });

  await filaA.getByRole('button', { name: 'Editar' }).click();
  await page.getByLabel('SKU').fill(skuB);
  await page.getByLabel('Cantidad').fill('99');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page.getByRole('alert')).toContainText(`Ya tienes un producto con el SKU ${skuB}.`);
  // Los datos no cambian: A conserva su SKU y cantidad, y B sigue siendo el único con su SKU.
  await expect(filaA.getByRole('cell')).toHaveText(['Prueba A', skuA, '10', '5', 'Editar']);
  await expect(filaDe(page, skuB)).toHaveCount(1);

  // Cancelar descarta la edición.
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('button', { name: 'Agregar' })).toBeVisible();
  await expect(filaA.getByRole('cell')).toHaveText(['Prueba A', skuA, '10', '5', 'Editar']);
});
