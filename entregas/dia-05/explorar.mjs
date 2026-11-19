// Exploración del Día 5: abre la app en un navegador real, inicia sesión,
// agrega un producto bajo el mínimo, toma capturas en escritorio y móvil,
// y anota los errores de consola. Al final borra el producto que creó.
// Uso: node entregas/dia-05/explorar.mjs
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import apoyo from '../../tests/apoyo.js';

const { credenciales, skuUnico, borrarProductos, contarProductos } = apoyo;

const carpeta = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(carpeta, '..', '..');
const URL = 'http://localhost:3000';
const notas = [];
const consola = [];
const nota = (texto) => {
  notas.push(texto);
  console.log(texto);
};

async function servidorListo() {
  try {
    return (await fetch(`${URL}/health`)).ok;
  } catch {
    return false;
  }
}

async function arrancarServidor() {
  if (await servidorListo()) return null;
  const proceso = spawn(process.execPath, ['server.js'], { cwd: raiz, stdio: 'inherit' });
  for (let i = 0; i < 30; i++) {
    if (await servidorListo()) return proceso;
    await new Promise((r) => setTimeout(r, 500));
  }
  proceso.kill();
  throw new Error('El servidor no respondió en /health.');
}

function vigilarConsola(page, vista) {
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consola.push(`[${vista}] console.${msg.type()}: ${msg.text()}`);
    }
  });
  page.on('pageerror', (error) => consola.push(`[${vista}] error de página: ${error.message}`));
  page.on('requestfailed', (req) =>
    consola.push(`[${vista}] petición fallida: ${req.method()} ${req.url()} (${req.failure()?.errorText})`),
  );
  page.on('response', (res) => {
    if (res.status() >= 400) consola.push(`[${vista}] respuesta ${res.status()}: ${res.request().method()} ${res.url()}`);
  });
}

async function iniciarSesion(page) {
  const { email, password } = credenciales();
  await page.locator('#form-acceso [name=email]').fill(email);
  await page.locator('#form-acceso [name=password]').fill(password);
  await page.locator('#btn-entrar').click();
  await page.locator('#vista-inventario').waitFor({ state: 'visible', timeout: 15000 });
}

async function desbordeHorizontal(page) {
  return page.evaluate(() => ({
    anchoPagina: document.documentElement.scrollWidth,
    anchoVentana: document.documentElement.clientWidth,
  }));
}

const servidor = await arrancarServidor();
const navegador = await chromium.launch();
const sku = skuUnico('EXP');

try {
  // Escritorio 1280x800
  const escritorio = await navegador.newContext({ viewport: { width: 1280, height: 800 } });
  const pe = await escritorio.newPage();
  vigilarConsola(pe, 'escritorio');
  await pe.goto(URL);
  await pe.locator('#vista-acceso').waitFor({ state: 'visible', timeout: 15000 });
  await pe.screenshot({ path: path.join(carpeta, 'escritorio-1-acceso.png'), fullPage: true });
  nota('Escritorio: se ve el formulario de inicio de sesión.');

  await iniciarSesion(pe);
  nota('Escritorio: inicio de sesión correcto con TEST_EMAIL (la contraseña no se imprime).');

  await pe.locator('#form-producto [name=nombre]').fill('Exploración bajo mínimo');
  await pe.locator('#form-producto [name=sku]').fill(sku);
  await pe.locator('#form-producto [name=cantidad]').fill('2');
  await pe.locator('#form-producto [name=minimo]').fill('5');
  await pe.locator('#btn-guardar').click();
  const fila = pe.locator('#lista tr', { hasText: sku });
  await fila.waitFor({ state: 'visible', timeout: 15000 });
  const marcado = (await fila.getAttribute('class'))?.includes('bajo');
  nota(`Escritorio: producto ${sku} agregado (cantidad 2, mínimo 5); marcado bajo mínimo: ${marcado ? 'sí' : 'NO'}.`);
  await pe.screenshot({ path: path.join(carpeta, 'escritorio-2-inventario.png'), fullPage: true });
  const de = await desbordeHorizontal(pe);
  nota(`Escritorio: ancho de página ${de.anchoPagina}px en ventana de ${de.anchoVentana}px.`);

  // Móvil 390x844
  const movil = await navegador.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const pm = await movil.newPage();
  vigilarConsola(pm, 'móvil');
  await pm.goto(URL);
  await pm.locator('#vista-acceso').waitFor({ state: 'visible', timeout: 15000 });
  await pm.screenshot({ path: path.join(carpeta, 'movil-1-acceso.png'), fullPage: true });
  await iniciarSesion(pm);
  await pm.locator('#lista tr', { hasText: sku }).waitFor({ state: 'visible', timeout: 15000 });
  await pm.screenshot({ path: path.join(carpeta, 'movil-2-inventario.png'), fullPage: true });
  const dm = await desbordeHorizontal(pm);
  nota(`Móvil: ancho de página ${dm.anchoPagina}px en ventana de ${dm.anchoVentana}px${dm.anchoPagina > dm.anchoVentana ? ' (hay desplazamiento horizontal)' : ''}.`);
} finally {
  await navegador.close();
  await borrarProductos([sku]);
  const quedan = await contarProductos('EXP-');
  nota(`Limpieza: producto ${sku} borrado; productos EXP- que quedan: ${quedan}.`);
  if (servidor) servidor.kill();
}

const reporte = [
  '# Reporte de exploración — Día 5',
  '',
  `Fecha: ${new Date().toLocaleString('es-MX')}`,
  '',
  '## Recorrido',
  ...notas.map((n) => `- ${n}`),
  '',
  '## Consola y red',
  ...(consola.length ? consola.map((c) => `- ${c}`) : ['- Sin errores ni advertencias de consola, sin peticiones fallidas.']),
  '',
  '## Capturas',
  '- escritorio-1-acceso.png, escritorio-2-inventario.png (1280x800)',
  '- movil-1-acceso.png, movil-2-inventario.png (390x844)',
  '',
].join('\n');
writeFileSync(path.join(carpeta, 'reporte-exploracion.md'), reporte);
console.log('\nReporte guardado en entregas/dia-05/reporte-exploracion.md');
