# Bitácora — Día 10: incidente de principio a fin

- **Issue:** https://github.com/tecuapachogabriel696-svg/mini-inventario/issues/18
- **Pull request:** https://github.com/tecuapachogabriel696-svg/mini-inventario/pull/19
- **URL pública:** https://mini-inventario-2z06.onrender.com

Agente: **Claude Code** en modo manual (pide aprobación antes de cada acción). Claude (en claude.ai) analizó el código, escribió la prueba, la corrección y la migración, las probó en un Postgres local y me ayudó con esta bitácora.

## 1. El reporte
El primer reporte («Pude guardar un producto con cantidad -5») **ya estaba bloqueado**: la web rechaza `cantidad < 0` y la base tiene `check (cantidad >= 0)` desde el día 4. Por eso usé el segundo:

> «Pude registrar dos productos con el mismo SKU».

**Lo que creí que pasaba antes de pedir ayuda:** **[COMPLETAR con tu hipótesis, con tus palabras.]**

## 2. Reproducción e investigación
- Con `playwright-cli`, en la URL pública y con el usuario de prueba, el agente registró `DUP-D10-ABC` y luego `dup-d10-abc`: **se guardaron los dos sin ningún aviso**. Captura: `produccion-duplicado.png`.
- **Datos (supabase-lectura, solo lectura):** la restricción real era `productos_user_sku_unico UNIQUE (user_id, sku)`, que compara el texto exacto. Agrupando por `user_id` y `lower(sku)`, el único par repetido era el de la prueba.
- **Logs de Render:** no se pudieron leer. El conector de Render de mi cuenta solo ve mi workspace («Jimena's workspace», con `erp-nova-web` y ProyectERP), y el servicio `mini-inventario` está en la cuenta de Render de mi compañero. De todos modos no habría un error en los logs: la app no falla, guarda el dato.

**Causa:** la regla «SKU único por usuario» se aplicaba en dos capas, y las dos distinguían mayúsculas y minúsculas:
1. **Navegador** (`public/app.js:52`): `p.sku === valores.sku`, así que `"DUP-D10-ABC" === "dup-d10-abc"` es falso.
2. **Base:** `unique (user_id, sku)` sobre `text` compara exacto, así que Postgres no devolvía el error 23505.

Además nada normalizaba el SKU al guardarlo; en los datos hay SKU mezclados como `Gom-003` y `GOM-002`.

## 3. Issue (#18)
Creado con `gh issue create`: título «SKU duplicado si cambian mayúsculas y minúsculas», con pasos para reproducir, esperado y actual, causa en las dos capas con la línea exacta, y 4 criterios de aceptación como casillas (web, base, prueba de Playwright y URL pública). No incluye el correo ni la contraseña de prueba, solo los nombres de las variables.

## 4. Prueba primero
- Rama `dia-10-incidente`. Prueba nueva: `tests/sku-duplicado.spec.js`. Registra un SKU en mayúsculas, intenta el mismo en minúsculas y espera el mensaje «Ya tienes un producto con el SKU» y una sola fila.
- **Antes de corregir: `1 failed`** (`prueba-antes.txt`). Después de guardar el SKU en minúsculas, la web no mostró ningún error (`Received string: ""`): aceptó el repetido.
- La prueba se guardó en su propio commit (`2df162d`) antes de la corrección.

## 5. Corrección en la web y en la base
**Web (`public/app.js`):**
- El SKU se guarda siempre en mayúsculas (`.trim().toUpperCase()`).
- La revisión de repetidos compara sin distinguir mayúsculas (`p.sku.toUpperCase() === valores.sku`), lo que también cubre los SKU antiguos guardados en minúsculas.

**Base (`supabase/migrations/20261125163055_sku_unico_sin_mayusculas.sql`):**
```sql
create unique index productos_user_sku_sin_mayusculas_unico
  on public.productos (user_id, upper(sku));
```

**Filas que incumplían la regla:** antes de aplicar el SQL, el agente corrió la consulta de repetidos con `supabase-lectura`: **1 grupo con 2 filas**, `DUP-D10-ABC` y `dup-d10-abc`, las dos creadas hoy para reproducir el incidente. Propuso borrar las dos (o solo la de minúsculas, como mínimo). **Aprobé borrar las dos** por id, porque eran datos de prueba y la evidencia ya estaba en la captura y en el issue. El `delete` borró exactamente esas 2 filas. Los SKU antiguos en minúsculas que **no** se repiten se quedaron como están: siguen siendo válidos y el índice evita que se repitan.

**Migración:** aplicada con el MCP de Supabase. Supabase la registró como `20261125163055`, así que el archivo local se renombró para que coincida. El agente comprobó que el índice existe.

Antes de entregarla, Claude la probó en un Postgres local: con un `cho-001` repetido, el índice **no se dejó crear** (`Key (user_id, upper(sku))=(…, CHO-001) is duplicated`); sin repetidos se creó, `TOR-777` seguido de `tor-777` fue rechazado con `duplicate key value violates unique constraint`, y otro usuario sí pudo usar el mismo SKU.

- **Después de corregir: `7 passed`** (`prueba-despues.txt`), incluida `sku-duplicado`.
- `docs/diseno.md` quedó actualizado con la nueva regla.

## 6. Publicación y verificación
- PR #19 con `Closes #18`. **CI en verde**. Lo fusioné con `gh pr merge 19 --merge` y el issue #18 se cerró solo (`"state": "CLOSED"`).
- Render despliega solo desde `main` (Auto-Deploy On Commit), así que al hacer el merge yo aprobé el despliegue.
- **Verificación en la URL pública:** registré `VER-001` y luego `ver-001`. **[COMPLETAR con el mensaje que salió.]** Captura: `produccion-corregido.png`. Después borré `VER-001`.

## 7. Cierre del ciclo
**Qué aprendió el sistema:** los identificadores que escribe una persona (como el SKU) se tienen que normalizar antes de compararlos. Validar solo el texto exacto deja pasar repetidos. Y la regla tiene que estar en la base, no solo en la web, porque la web se puede saltar.

**Siguiente requisito:** **H4, borrar productos con confirmación** (issue #6, que sigue abierto). Después vendría H5, el historial de movimientos (#7). También quedaría normalizar a mayúsculas los SKU antiguos con una migración revisada, y agregar una prueba que intente el duplicado directo contra la base, saltándose la web.

**Qué le delegaría a un agente:** reproducir el error con Playwright, leer logs y datos en solo lectura, proponer la prueba y el SQL, contar las filas afectadas y abrir el issue y el PR.

**Qué seguiría revisando yo:** cualquier cambio a datos que ya existen (borrar o corregir filas), el SQL antes de aplicarlo en producción, que la corrección quede en la web **y** en la base, el merge que dispara el despliegue, y la verificación final en la URL pública.

## Prompts clave
1. **Reproducción:** "Tenemos este reporte de producción: «Pude registrar dos productos con el mismo SKU». Usa playwright-cli en la URL pública https://mini-inventario-2z06.onrender.com para reproducirlo con el usuario de TEST_EMAIL y TEST_PASSWORD de .env: intenta registrar un SKU y luego el mismo SKU escrito con otras mayúsculas y minúsculas. Toma una captura y guárdala en entregas/dia-10/produccion-duplicado.png. Revisa los logs recientes del servicio mini-inventario con el conector claude.ai Render y consulta los datos con supabase-lectura en solo lectura. Explica la causa. No cambies nada todavía."
2. **Issue:** "No borres nada todavía. Crea un issue con gh para este incidente. Incluye: pasos para reproducir en la URL pública, la causa en las dos capas (app.js y la restricción unique en la base), y criterios de aceptación como lista de tareas […]. Muéstrame el texto antes de crearlo."
3. **Corrección:** "Corrige el issue #18. […] Antes de aplicarla, usa el MCP de Supabase para mostrarme cuántas filas incumplen la regla y propón qué hacer con ellas. Espera mi aprobación antes de modificar datos o aplicar el SQL. Después corre todas las pruebas."
4. **Aprobación:** "Apruebo borrar las dos filas por id, con el delete que propusiste. Después aplica […] con el MCP de Supabase y, si Supabase registra otra versión, renombra el archivo local para que coincida. Actualiza docs/diseno.md […]. No hagas commit todavía."
5. **PR:** "Haz commit de los cambios […] y abre con gh un pull request a main que diga "Closes #18" […]. No hagas merge."

## Error o mala decisión de la IA
1. **Supusimos que el conector de Render vería el servicio.** Claude (en claude.ai) me sugirió usar el conector «claude.ai Render» para los logs, pero ese conector solo ve mi workspace, y el servicio está en la cuenta de mi compañero. Lo detecté porque el agente listó los servicios del workspace y no estaba `mini-inventario`. La causa se respaldó con los datos de Supabase y la reproducción.
2. **La primera captura cortaba las filas duplicadas.** El agente lo notó al revisar la imagen y la repitió a página completa.
3. **El agente ofreció adjuntar la captura al issue con `--attach`**, pero `gh issue create` no tiene esa opción. Decidí dejar solo la ruta, que funciona una vez fusionado el PR.

## Comando o herramienta que aprobé o rechacé
- **Rechacé** que el agente borrara los productos de prueba cuando lo ofreció al final de la reproducción: eran justo las filas que había que revisar antes de la migración.
- **Aprobé** el `delete` de exactamente 2 filas por id y el `apply_migration`, después de ver la consulta de repetidos y el SQL.
- **Mantuve desactivado** el MCP `supabase` (el que escribe) durante la investigación; solo lo activé para la corrección y lo volví a desactivar después.
- **No dejé** que el agente hiciera merge ni desplegara: el merge lo hice yo con el CI en verde.

## Otros problemas que resolví
- `prueba-antes.txt` se guardó en UTF-16 por `Tee-Object` en PowerShell y GitHub lo marcaba como binario; lo convertí a UTF-8.
- La consola mostraba los acentos rotos (`may├║sculas`); lo arreglé con `[Console]::OutputEncoding = [Text.Encoding]::UTF8` antes de volver a correr la prueba.

## Cómo comprobé que funciona
- La prueba falla antes (`1 failed`) y pasa después (`7 passed`).
- CI en verde en el PR #19, y el issue #18 cerrado automáticamente.
- El índice `productos_user_sku_sin_mayusculas_unico` existe en Supabase.
- La URL pública rechaza el SKU repetido (`produccion-corregido.png`).
