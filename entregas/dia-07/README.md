# Bitácora — Día 7

Trabajé con Claude Code en la rama `dia-07-skill`, en modo manual (pide aprobación antes de cada cambio). Claude (en claude.ai) me ayudó a revisar lo que generaba Claude Code, a comparar resultados y a escribir esta bitácora. Al abrir Claude Code no activé el MCP de Supabase del proyecto, para que la comparación dependiera solo de la skill.

## Prompts clave
1. **Pedido con y sin skill (idéntico las dos veces, en conversación limpia):** "Escribe una prueba de Playwright para editar un producto"
2. **Skill:** "Crea una skill llamada pruebas-inventario en la ruta correcta para este agente. Debe indicar: usar Playwright en tests/, leer credenciales del entorno, usar un SKU único por prueba, borrar lo creado, seleccionar elementos por rol o etiqueta, y cubrir el caso correcto y un caso de error. La descripción debe activarse cuando se pidan pruebas de Mini Inventario."
3. **Subagente:** "Crea un subagente llamado revisor-pr en el formato correcto para este agente. Su trabajo es revisar git diff main en busca de secretos, cambios sin pruebas y consultas sin protección por usuario. Debe responder con una lista de hallazgos, archivo y gravedad. No debe modificar archivos ni ejecutar comandos que cambien el proyecto."
4. **Ejecución:** "Usa el subagente revisor-pr para revisar esta rama"
5. **Atender el hallazgo:** "Sí, aplica los dos arreglos. En filaDe busca la fila por la celda con el SKU exacto: page.getByRole('row').filter({ has: page.getByRole('cell', { name: sku, exact: true }) }). Actualiza la skill para que recomiende esa forma en lugar de new RegExp(sku). Después corre npx playwright test tests/editar-producto.spec.js"

## Skill `pruebas-inventario`
- Ruta: `.claude/skills/pruebas-inventario/SKILL.md`, con `name` y `description`.
- Se activó sola en el segundo pedido: Claude Code mostró **"Skill(pruebas-inventario) — Successfully loaded skill"**.
- **Revisión antes de usarla:** la primera versión (`skill-version-original.md`) se escribió sin revisar la página, y el propio agente lo admitió. Tenía dos errores: usaba un botón **"Guardar"** que no existe (en la app es "Agregar" o "Guardar cambios") y un ejemplo con **mínimo 2**, que la app rechaza porque el mínimo es 5 o más. Corregí eso, agregué una sección con los nombres reales de la página y una regla para borrar también el SKU nuevo al editar. Además, cambié la descripción para que se active con pedidos como "escribe una prueba de Playwright para editar un producto", aunque no digan "Mini Inventario".

## Comparación: sin skill vs. con skill

| | Sin skill (`sin-skill.diff`) | Con skill (`tests/editar-producto.spec.js`) |
|---|---|---|
| Archivo | Agregó la prueba al final de `tests/inventario.spec.js`, un archivo existente | Creó un archivo nuevo, `tests/editar-producto.spec.js` |
| Selectores | Casi todo con `#id` y CSS (`#titulo-form`, `#btn-guardar`, `#form-producto [name=sku]`); solo un `getByRole` | Todo con `getByRole` y `getByLabel` (`getByLabel('SKU')`, botón `Guardar cambios`, fila por SKU) |
| Casos | Solo el caso correcto (editar y guardar) | Caso correcto **y** caso de error: editar con el SKU de otro producto muestra "Ya tienes un producto con el SKU…" y no cambia los datos. También revisa Cancelar |
| Credenciales | De `.env`, con las ayudas existentes | De `.env`, con `credenciales()` |
| SKU único y limpieza | Sí; registra también el SKU nuevo y usa otro prefijo (`PWE`) | Sí; registra el SKU nuevo, pero con el mismo prefijo `PW` (ver hallazgo) |
| Resultado | 1 prueba, pasó | 2 pruebas, pasaron (y otra vez después del arreglo: 2 passed) |

**Qué mejoró:** la prueba sigue las reglas del proyecto sin pedírselas. Usa un archivo propio, selectores por rol y etiqueta, y cubre el caso de error.

**Qué siguió mal:** buscaba la fila con `new RegExp(sku)`, que acepta el SKU dentro de otro texto. Como el SKU original y el editado tienen el mismo prefijo, la prueba podía fallar de vez en cuando. Curiosamente, la versión sin skill lo evitaba usando otro prefijo.

**Cuánto tuve que corregir:** a la prueba con skill, una función de 3 líneas (`filaDe`), después del hallazgo del revisor. A la versión sin skill habría tenido que reescribirle casi todos los selectores y agregarle el caso de error.

## Subagente `revisor-pr`
- Ruta: `.claude/agents/revisor-pr.md`, con `name`, `description` y `tools: Read, Grep, Glob, Bash`. No incluye `Write` ni `Edit`.
- Sus instrucciones son de solo lectura: con Bash solo puede usar `git diff`, `status`, `log` y `show`, y tiene prohibidos `add`, `commit`, `checkout`, `rm`, las redirecciones, `npx` y las pruebas. Responde con una tabla de gravedad, archivo:línea, categoría y hallazgo.
- Limitación: tiene `Bash` porque lo necesita para `git diff`, así que la restricción de solo lectura depende de sus instrucciones, no de un bloqueo técnico. El propio agente lo advirtió al crearlo.

## Ejecución del revisor
- Como los archivos nuevos todavía no tenían commit, `git diff main` no los mostraba. El agente principal lo notó y le pidió al revisor leerlos directamente.
- **Resultado:** sin secretos y sin consultas sin protección por usuario. Encontró 2 hallazgos leves:
  1. `tests/editar-producto.spec.js:29-31`: `filaDe` con `new RegExp(sku)` puede confundir un SKU con otro que lo contenga (por ejemplo `PW-…-12` dentro de `PW-…-123`), así que `toHaveCount(0)` o `toHaveCount(1)` pueden fallar aunque la app funcione.
  2. `.claude/skills/pruebas-inventario/SKILL.md:37`: la skill enseñaba esa misma búsqueda.
- **`git status` antes y después del revisor:** idénticos (`git-status-antes.txt` y `git-status-despues.txt`), así que el revisor no cambió nada.

## Hallazgo atendido
Atendí los dos. `filaDe` ahora busca la fila por la celda con el SKU exacto (`getByRole('row').filter({ has: getByRole('cell', { name: sku, exact: true }) })`), y la skill recomienda esa forma y advierte contra `new RegExp(sku)`. Al volver a correr, `tests/editar-producto.spec.js` dio **2 passed**.

## Error o mala decisión de la IA
1. **La primera versión de la skill tenía nombres inventados** (botón "Guardar") y un mínimo inválido (2), porque el agente no revisó `public/`. Lo detecté al comparar la skill con `public/index.html` y `public/app.js`.
2. **La búsqueda con `new RegExp(sku)` venía de la skill**, y al corregirla (con ayuda de Claude) la dejé también en la regla 5. El subagente revisor lo encontró, y por eso la prueba con skill heredó el problema.
3. **Sin skill, el agente modificó un archivo de pruebas existente** en lugar de crear uno nuevo.

## Comando o herramienta que aprobé o rechacé
- **Rechacé el MCP de Supabase** ("Continue without using this MCP server"): no hacía falta para escribir pruebas y así el agente no podía tocar la base de datos.
- **No envié** "Sí, haz commit y abre el PR" cuando Claude Code lo sugirió después de crear la skill, porque faltaban el subagente y la comparación.
- **Aprobé** las corridas de `npx playwright test` con `npm start` en otra ventana, que en Windows es necesario para que Playwright termine.

## Cómo comprobé que funciona
- Sin skill: la prueba pasó (1 passed). Guardé su código en `sin-skill.diff` y la descarté con `git restore tests/inventario.spec.js`.
- Con skill: la skill se cargó sola y las 2 pruebas pasaron, antes y después del arreglo.
- El subagente respondió con hallazgos en el formato pedido, y `git status` no cambió con su ejecución.
