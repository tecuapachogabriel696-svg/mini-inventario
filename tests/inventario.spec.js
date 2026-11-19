// @ts-check
const { test, expect } = require('@playwright/test');
const { credenciales, skuUnico, borrarProductos } = require('./apoyo');

// SKU creados por cada prueba; se borran al terminar, pase o falle.
let creados = [];

test.afterEach(async () => {
  await borrarProductos(creados);
  creados = [];
});

async function iniciarSesion(page, password = credenciales().password) {
  await page.goto('/');
  await page.locator('#form-acceso [name=email]').fill(credenciales().email);
  await page.locator('#form-acceso [name=password]').fill(password);
  await page.locator('#btn-entrar').click();
}

async function agregarProducto(page, { nombre, sku, cantidad, minimo }) {
  creados.push(sku);
  await page.locator('#form-producto [name=nombre]').fill(nombre);
  await page.locator('#form-producto [name=sku]').fill(sku);
  await page.locator('#form-producto [name=cantidad]').fill(String(cantidad));
  await page.locator('#form-producto [name=minimo]').fill(String(minimo));
  await page.locator('#btn-guardar').click();
  return page.locator('#lista tr', { hasText: sku });
}

test('inicia sesión con el usuario de prueba', async ({ page }) => {
  await iniciarSesion(page);
  await expect(page.locator('#vista-inventario')).toBeVisible();
  await expect(page.locator('#usuario-email')).toHaveText(credenciales().email);
  await expect(page.locator('#vista-acceso')).toBeHidden();
});

test('rechaza una contraseña incorrecta', async ({ page }) => {
  await iniciarSesion(page, `${credenciales().password}-incorrecta`);
  await expect(page.locator('#errores-acceso')).toHaveText('Correo o contraseña incorrectos.');
  await expect(page.locator('#vista-inventario')).toBeHidden();
});

test('agrega un producto', async ({ page }) => {
  await iniciarSesion(page);
  await expect(page.locator('#vista-inventario')).toBeVisible();

  const sku = skuUnico();
  const fila = await agregarProducto(page, { nombre: 'Prueba agregar', sku, cantidad: 20, minimo: 5 });

  await expect(fila).toBeVisible();
  await expect(fila.locator('td')).toHaveText(['Prueba agregar', sku, '20', '5', 'Editar']);
  await expect(fila).not.toHaveClass(/bajo/);
});

test('marca un producto bajo el mínimo', async ({ page }) => {
  await iniciarSesion(page);
  await expect(page.locator('#vista-inventario')).toBeVisible();

  // Cantidad igual al mínimo: según docs/requisitos.md (cantidad <= minimo) sí se marca.
  const enElMinimo = await agregarProducto(page, {
    nombre: 'Prueba en el mínimo',
    sku: skuUnico(),
    cantidad: 5,
    minimo: 5,
  });
  await expect(enElMinimo).toHaveClass(/bajo/);
  await expect(enElMinimo).toContainText('Bajo mínimo');

  // Una unidad arriba del mínimo: no se marca.
  const arriba = await agregarProducto(page, {
    nombre: 'Prueba arriba del mínimo',
    sku: skuUnico(),
    cantidad: 6,
    minimo: 5,
  });
  await expect(arriba).toBeVisible();
  await expect(arriba).not.toHaveClass(/bajo/);
  await expect(arriba).not.toContainText('Bajo mínimo');
});
