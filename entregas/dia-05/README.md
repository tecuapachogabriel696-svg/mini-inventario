# Bitácora — Día 5

Esta vez el agente fue Claude (en claude.ai, con acceso a mi carpeta `mini-inventario`). Claude escribió el script de exploración, las pruebas y la corrección, y revisó las capturas y resultados. Yo ejecuté los comandos en mi PowerShell, porque Claude no podía escribir en mi terminal.

## Prompts clave
1. "Arranca la app. Usa playwright-cli para abrir http://localhost:3000, iniciar sesión con TEST_EMAIL y TEST_PASSWORD de .env sin mostrarlos, y agregar un producto con cantidad menor al mínimo. Toma capturas en 1280x800 y en 390x844, y revisa los errores de consola. Guarda las capturas en entregas/dia-05/ y reporta lo que encontraste. No corrijas nada todavía."
2. "Escribe pruebas de Playwright en tests/ para: iniciar sesión, rechazar una contraseña incorrecta, agregar un producto y marcar un producto bajo el mínimo. Lee TEST_EMAIL y TEST_PASSWORD del entorno. Cada prueba usa un SKU único y borra lo que creó. Configura webServer para arrancar la app. Corre las pruebas y muéstrame el resultado."

## 1. Herramientas
- Rama `dia-05-pruebas`. `TEST_EMAIL` y `TEST_PASSWORD` en `.env` (no se suben).
- `npm install -g @playwright/cli@latest` y la skill con `npx skills add https://github.com/microsoft/playwright-cli --skill playwright-cli -a claude-code -y` (quedó en `.claude/skills/playwright-cli/`).
- Playwright Test con `npm install -D @playwright/test` y `npx playwright install chromium`. Es lo que hace `npm init playwright@latest`, pero sin preguntas y sin reemplazar la configuración.

## 2. Exploración
Como Claude no podía manejar `playwright-cli` desde mi terminal, la exploración la hizo un script de Playwright (`explorar.mjs`) con un navegador real. El script abre la app, inicia sesión sin imprimir la contraseña, agrega un producto con cantidad 2 y mínimo 5, toma capturas en 1280x800 y 390x844, anota consola y red, y al final borra el producto que creó.

- **Capturas:** `escritorio-1-acceso.png`, `escritorio-2-inventario.png`, `movil-1-acceso.png` y `movil-2-inventario.png`. Las de antes de la corrección son `movil-1-acceso-antes.png` y `movil-2-inventario-antes.png`.
- **Reporte:** `reporte-exploracion-antes.md` (antes de la corrección) y `reporte-exploracion.md` (después).
- **Consola:** sin errores ni advertencias, y sin peticiones fallidas, en escritorio y en móvil.
- **Lo que encontró:** el inicio de sesión funciona y el producto con cantidad 2 y mínimo 5 se marca "Bajo mínimo". En escritorio todo cabe, pero en móvil la página medía **515 px en una pantalla de 390 px**.

## 3. Problema real y corrección
**Problema (visual):** en el celular (390x844), la tabla de productos era más ancha que la pantalla. El navegador alejaba toda la página: el formulario se veía angosto y la tabla quedaba cortada a la derecha, sin borde ni botón completo (ver `movil-2-inventario-antes.png`).

**Corrección** (`public/index.html` y `public/styles.css`):
- La tabla va dentro de un `div.tabla-contenedor` con `overflow-x: auto`, para que, si algo no cabe, se desplace solo la tabla y no toda la página.
- En pantallas de 480 px o menos, la tabla usa letra un poco más chica y menos relleno, y los SKU largos se pueden partir. Los encabezados y el botón "Editar" no se parten.

**Resultado:** la página mide **390 px en una pantalla de 390 px**, y se ven las 5 columnas y el botón Editar (`movil-2-inventario.png`). En escritorio no cambió nada.

## 4. Pruebas permanentes
- **Archivos:** `tests/inventario.spec.js` (4 pruebas), `tests/apoyo.js` (credenciales, SKU único y limpieza) y `playwright.config.js` (con `webServer`).
- **Datos:** cada prueba usa un SKU único (`PW-<fecha>-<aleatorio>`). En `afterEach`, pase o falle, se borran sus productos con la sesión del usuario de prueba. RLS solo le permite borrar los suyos.
- **La prueba de "bajo el mínimo"** revisa el caso límite: cantidad 5 con mínimo 5 sí se marca, porque `docs/requisitos.md` dice `cantidad <= minimo`, y cantidad 6 con mínimo 5 no se marca.
- **Resultado:** `pruebas-2-con-correccion.txt`, con **4 passed**.

## 5. Detección de errores
1. Cambié a mano `p.cantidad <= p.minimo` por `p.cantidad < p.minimo` en `public/app.js` (`falla-provocada.diff`).
2. Corrí las pruebas: **1 failed, 3 passed** (`pruebas-3-falla-provocada.txt`). Falló "marca un producto bajo el mínimo": esperaba la clase `bajo` y recibió `""`. Es exactamente el caso de cantidad igual al mínimo.
3. Revertí con `git restore public/app.js` y volví a correr: **4 passed** (`pruebas-4-revertido.txt`).

Todo el paso 5 quedó en `correr-paso5.ps1`, que siempre regresa `app.js` aunque algo se interrumpa.

## Errores o malas decisiones de la IA
1. **Las pruebas no terminaban.** Las 4 pasaban, pero Playwright se quedaba detenido sin mostrar el resumen, y así pasó 3 veces. Claude primero culpó al cliente de Supabase (desactivó `autoRefreshToken`) y a `npm start` (lo cambió por `node server.js`), pero ninguno de los dos lo arregló. La causa real fue que, en Windows, Playwright no lograba apagar el servidor que él mismo arrancaba. Se resolvió arrancando el servidor aparte con `npm start`: como `reuseExistingServer` está activo, Playwright lo usa y no intenta apagarlo. Lo comprobé porque con eso las tres corridas terminaron con su resumen. Quedó anotado en `playwright.config.js`.
2. **El script de exploración no apagaba el servidor si fallaba la limpieza.** Pasó en la primera corrida, cuando `TEST_EMAIL` y `TEST_PASSWORD` todavía tenían el texto de ejemplo y Supabase respondió *Invalid login credentials*. Se corrigió para que siempre apague el servidor y anote el error en el reporte.

## Comando o herramienta que aprobé o rechacé
- **No usé `npm init playwright@latest`**: hace preguntas y habría reemplazado `playwright.config.js`. En su lugar instalé `@playwright/test` y Chromium con dos comandos.
- **Aprobé `git restore public/app.js`** para revertir la falla provocada, porque `app.js` no tenía otros cambios míos y regresa exactamente a la versión del repositorio.

## Cómo comprobé que funciona
- La exploración inicia sesión, marca el producto con cantidad 2 y mínimo 5, y no muestra errores de consola.
- En móvil, el ancho de la página pasó de 515 px a 390 px después de la corrección.
- Las pruebas quedaron así: 4 passed con la corrección, 1 failed con la falla provocada y 4 passed al revertir.
- Al terminar no quedan productos de prueba: `limpieza.txt` muestra 0 productos con SKU `PW-` y 0 con `EXP-`.

## Cómo correr las pruebas
```powershell
npm start                 # en una ventana aparte 
npx playwright test       # en otra ventana
```
