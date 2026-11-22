---
name: pruebas-inventario
description: Escribe o actualiza pruebas end-to-end de Mini Inventario con Playwright. Úsala cuando se pida escribir una prueba, test, spec o caso de prueba de Playwright en este proyecto, por ejemplo para iniciar sesión, agregar, editar o borrar un producto, o marcar productos bajo el mínimo.
---

# Pruebas de Mini Inventario

Reglas para escribir pruebas de Mini Inventario. Síguelas todas.

## 1. Playwright en `tests/`
- Usa `@playwright/test` (ya está en `devDependencies`) y la configuración de `playwright.config.js`.
- Guarda las pruebas en `tests/` con el nombre `*.spec.js`. Las ayudas compartidas viven en `tests/apoyo.js`.
- Ejecuta con `npx playwright test`.

## 2. Credenciales desde el entorno
- Lee usuario y contraseña con `credenciales()` de `tests/apoyo.js`, que toma `TEST_EMAIL` y `TEST_PASSWORD` de `process.env` (cargado desde `.env`).
- Nunca escribas correos, contraseñas ni llaves en el código de las pruebas.
- Si falta una variable nueva, agrégala vacía a `.env.example`; nunca subas `.env`.

## 3. Un SKU único por prueba
- Genera cada SKU con `skuUnico()` de `tests/apoyo.js`. No reutilices SKU fijos ni los compartas entre pruebas.

## 4. Borrar lo creado
- Registra cada SKU creado en una lista y bórralos en `test.afterEach` con `borrarProductos(skus)`, para que se limpien aunque la prueba falle.
- Borra solo lo que creó la prueba; nunca datos existentes.
- Si la prueba cambia el SKU de un producto (al editarlo), agrega también el SKU nuevo a la lista.

```js
let creados = [];
test.afterEach(async () => {
  await borrarProductos(creados);
  creados = [];
});
```

## 5. Seleccionar por rol o etiqueta
- Usa `page.getByRole(...)` y `page.getByLabel(...)` (por ejemplo `getByRole('button', { name: 'Agregar' })`, `getByLabel('SKU')`).
- Para encontrar la fila de un producto, filtra por la celda con el SKU exacto: `page.getByRole('row').filter({ has: page.getByRole('cell', { name: sku, exact: true }) })`. No uses `getByRole('row', { name: new RegExp(sku) })`: encuentra el SKU en cualquier parte del texto y un SKU puede coincidir dentro de otro (por ejemplo `PW-12` dentro de `PW-123`).
- Evita selectores CSS, `#id` o XPath. Si un elemento no tiene rol o etiqueta accesible, propón agregar el `<label>` o `aria-label` en la app en lugar de usar CSS.

## 6. Caso correcto y caso de error
Cada funcionalidad probada necesita al menos:
- **Caso correcto**: el flujo funciona y se comprueba el resultado visible (por ejemplo, el producto aparece en la lista).
- **Caso de error**: una entrada inválida o no permitida (contraseña incorrecta, SKU duplicado, campo vacío o cantidad negativa) muestra el mensaje de error y no cambia los datos.

## Ejemplo

```js
// @ts-check
const { test, expect } = require('@playwright/test');
const { credenciales, skuUnico, borrarProductos } = require('./apoyo');

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
}

function filaDe(page, sku) {
  return page.getByRole('row').filter({ has: page.getByRole('cell', { name: sku, exact: true }) });
}

test('agrega un producto', async ({ page }) => {
  await iniciarSesion(page);
  const sku = skuUnico();
  creados.push(sku);
  await page.getByLabel('Nombre').fill('Tornillo de prueba');
  await page.getByLabel('SKU').fill(sku);
  await page.getByLabel('Cantidad').fill('10');
  await page.getByLabel('Mínimo').fill('5');
  await page.getByRole('button', { name: 'Agregar' }).click();
  await expect(filaDe(page, sku)).toBeVisible();
});

test('rechaza una cantidad negativa', async ({ page }) => {
  await iniciarSesion(page);
  const sku = skuUnico();
  creados.push(sku);
  await page.getByLabel('Nombre').fill('Producto inválido');
  await page.getByLabel('SKU').fill(sku);
  await page.getByLabel('Cantidad').fill('-1');
  await page.getByLabel('Mínimo').fill('5');
  await page.getByRole('button', { name: 'Agregar' }).click();
  await expect(page.getByRole('alert')).toContainText('La cantidad debe ser un número entero entre 0');
  await expect(filaDe(page, sku)).toHaveCount(0);
});
```

## Nombres reales de la página (`public/index.html` y `public/app.js`)
- Acceso: etiquetas `Correo` y `Contraseña`; botones `Entrar` y `Crear cuenta`; errores en el `alert` del formulario.
- Producto: etiquetas `Nombre`, `SKU`, `Cantidad` y `Mínimo` (el mínimo debe ser 5 o más); botón `Agregar`.
- Editar: botón `Editar` dentro de la fila del producto; luego el botón de guardar dice `Guardar cambios` y aparece `Cancelar`.
- Lista: cada producto es una fila (`row`); los que están bajo el mínimo muestran el texto `Bajo mínimo`.
- Errores de validación: se muestran en el `alert` del formulario de producto (por ejemplo, `Ya tienes un producto con el SKU …`).
- Si cambias la página, revisa estos nombres antes de escribir la prueba.
