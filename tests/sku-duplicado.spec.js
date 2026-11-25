// @ts-check
// Día 10 — Incidente: «Pude registrar dos productos con el mismo SKU».
// Causa: el SKU se comparaba distinguiendo mayúsculas y minúsculas, tanto en la web
// (p.sku === valores.sku) como en la base (unique (user_id, sku)), así que
// "PW-123" y "pw-123" se guardaban como productos distintos.
const { test, expect } = require('@playwright/test');
const { credenciales, skuUnico, borrarProductos } = require('./apoyo');

// Se guardan las dos variantes para poder limpiar aunque la prueba falle.
let creados = [];

test.afterEach(async () => {
  await borrarProductos(creados);
  creados = [];
});

async function iniciarSesion(page) {
  await page.goto('/');
  await page.locator('#form-acceso [name=email]').fill(credenciales().email);
  await page.locator('#form-acceso [name=password]').fill(credenciales().password);
  await page.locator('#btn-entrar').click();
  await expect(page.locator('#vista-inventario')).toBeVisible();
}

async function llenarProducto(page, { nombre, sku, cantidad, minimo }) {
  await page.locator('#form-producto [name=nombre]').fill(nombre);
  await page.locator('#form-producto [name=sku]').fill(sku);
  await page.locator('#form-producto [name=cantidad]').fill(String(cantidad));
  await page.locator('#form-producto [name=minimo]').fill(String(minimo));
  await page.locator('#btn-guardar').click();
}

test('no deja registrar el mismo SKU escrito con otras mayúsculas', async ({ page }) => {
  await iniciarSesion(page);

  const sku = skuUnico('DUP').toUpperCase();
  const skuMinusculas = sku.toLowerCase();
  creados.push(sku, skuMinusculas);

  // Primer producto: se guarda normal.
  await llenarProducto(page, { nombre: 'Prueba SKU original', sku, cantidad: 10, minimo: 5 });
  const filas = page.locator('#lista tr').filter({ hasText: new RegExp(sku, 'i') });
  await expect(filas).toHaveCount(1);

  // Segundo producto: el mismo SKU, pero en minúsculas. Debe rechazarse.
  await llenarProducto(page, { nombre: 'Prueba SKU repetido', sku: skuMinusculas, cantidad: 3, minimo: 5 });

  await expect(page.locator('#errores')).toContainText('Ya tienes un producto con el SKU');
  await expect(filas).toHaveCount(1);
  await expect(page.locator('#lista tr', { hasText: 'Prueba SKU repetido' })).toHaveCount(0);
});
