# Bitácora — Día 3

Esta vez el agente fue Claude (en claude.ai, con acceso a mi carpeta `mini-inventario`). Claude escribió y probó el código, y yo ejecuté en mi PowerShell los comandos de Git y `gh`.

## Prompts clave
1. "Lee docs/requisitos.md y docs/diseno.md. Construye la primera versión de Mini Inventario. Express sirve la carpeta public/, responde /health y usa process.env.PORT o el puerto 3000. La página lista, agrega y edita productos, y marca los que tienen una cantidad por debajo del mínimo. Todo el acceso a datos va en public/productos.js y por ahora usa localStorage, porque mañana lo cambiaremos por Supabase. No agregues inicio de sesión todavía. Explica tu plan antes de editar."
2. "Revisa solo public/productos.js y dime si algo no cumple docs/diseno.md."
3. "Revisa los cambios de esta rama y crea con gh un pull request con un resumen claro. Vincula los issues que resuelve usando Closes #numero. No hagas merge."

**Plan que explicó el agente antes de editar:** `server.js` con Express (`/health` y `public/`), `public/index.html` con el formulario y la lista, `public/app.js` con la validación y la pantalla, y `public/productos.js` como única pieza que toca `localStorage`. Las funciones de `productos.js` son `async` para que mañana se cambien por Supabase sin tocar `app.js`. Para "bajo el mínimo" usa `cantidad <= minimo`, como dice `docs/requisitos.md`, aunque el prompt dice "por debajo".

## Prueba en el navegador
- Se agregaron 3 productos: Tornillo 1/4 (40, mín. 10), Clavo (3, mín. 5) y Arandela (12, mín. 5). Clavo aparece resaltado con "Bajo mínimo".
- Al recargar la página, los 3 productos siguen ahí, ordenados por nombre.
- Guardar con los campos vacíos muestra un mensaje por cada campo obligatorio y no guarda nada.
- También se probaron `TOR 001!`, `2.5`, `-1`, mínimo `4` y un SKU repetido: todos se rechazan con mensaje.
- Clavo se editó a cantidad 8 (dejó de estar resaltado), y al intentar cambiar el SKU de Arandela a `TOR-001` lo rechazó por repetido.
- Captura: `captura-app.png`.

## Error o mala decisión de la IA (y lo que pedí corregir)
1. **Números enormes.** La primera versión aceptó la cantidad `99999999999999999999` y la guardó como `100000000000000000000`, o sea, un número distinto al escrito. Además, la columna `integer` de `docs/diseno.md` solo admite hasta 2 147 483 647, así que mañana fallaría en Supabase. Se detectó al probar valores extremos en el navegador. Se corrigió: ahora cantidad y mínimo deben estar entre su mínimo y 2 147 483 647, con un mensaje claro.
2. **Formulario encimado.** En la primera captura, los campos del formulario se encimaban y el último se salía del recuadro. Se corrigió en `styles.css`.

## Revisión acotada de `public/productos.js` contra `docs/diseno.md`
- Cumple: guarda `id`, `nombre`, `sku`, `cantidad`, `minimo` y `created_at`, y la lista sale ordenada por nombre.
- Falta `user_id`: es normal porque todavía no hay inicio de sesión. Llega con Supabase.
- `docs/diseno.md` no menciona `productos.js` en su estructura de archivos ni el endpoint `/health`, y sí menciona `/config`. Hay que actualizar el diseño cuando se conecte Supabase.

## Contexto
<!-- Completa esta sección en tu Claude Code: /context antes, la revisión acotada, /compact, /context después. -->
- Uso antes: ___ (de `/context`)
- Uso después de `/compact`: ___
- Qué cambió en la respuesta: ___

## Comando o herramienta que aprobé o rechacé
- **Aprobé** `gh pr merge 8 --merge` para pasar a `main` el trabajo del Día 2 (`docs/requisitos.md` y `docs/diseno.md`), porque el Día 3 los necesita en la rama principal.
- **No hice merge** del pull request del Día 3, porque la consigna dice "No hagas merge" y primero hay que revisar el resumen.

## Cómo comprobé que funciona
- `npm install` y `npm start` levantan el servidor en `http://localhost:3000`.
- `http://localhost:3000/health` responde `{"status":"ok"}`.
- La prueba en el navegador de arriba pasa completa, incluyendo recargar la página.
