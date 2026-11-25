# Bitácora — Día 10: incidente de principio a fin

- Issue: **[COMPLETAR]**
- Pull request: **[COMPLETAR]**
- URL pública: **[COMPLETAR]**

> ⚠️ Borrador. Las partes marcadas con **[COMPLETAR]** dependen de lo que pase en producción, en Render y en Supabase. Llénalas con lo que realmente ocurra y borra esta nota.

## 1. El reporte
El primer reporte («Pude guardar un producto con cantidad -5») **ya estaba bloqueado**: la web rechaza `cantidad < 0` y la base tiene `check (cantidad >= 0)` desde el día 4. Por eso usé el segundo:

> «Pude registrar dos productos con el mismo SKU».

**Lo que creí que pasaba antes de pedir ayuda:** **[COMPLETAR con tu hipótesis, con tus palabras.]**

## 2. Reproducción e investigación
- En la URL pública registré `TOR-001` y luego `tor-001`, y la app guardó los dos. Captura: `produccion-duplicado.png`. **[COMPLETAR]**
- Logs de Render: **[COMPLETAR: qué mostraron; probablemente nada de error, porque la app no falla, guarda el dato.]**
- Datos (Supabase en solo lectura): **[COMPLETAR: resultado de la consulta de repetidos.]**

**Causa:** el SKU se comparaba distinguiendo mayúsculas y minúsculas en las dos capas:
- Web (`public/app.js`): `p.sku === valores.sku`, así que `"TOR-001" === "tor-001"` es falso.
- Base: `unique (user_id, sku)` compara el texto exacto, así que tampoco lo detecta.

En los datos se nota el desorden: hay SKU como `Gom-003` y `GOM-002`, `Cho-001` y `CHO-003`, sin un criterio fijo.

## 3. Issue
Creado con `gh issue create`: **[COMPLETAR: enlace.]** Incluye pasos para reproducir, causa y criterios de aceptación.

## 4. Prueba primero
- Rama `dia-10-incidente`. Prueba nueva: `tests/sku-duplicado.spec.js`. Registra un SKU en mayúsculas, intenta el mismo en minúsculas y espera el mensaje «Ya tienes un producto con el SKU» y una sola fila.
- **Antes de corregir falla:** **[COMPLETAR con el resultado, por ejemplo `1 failed`, y guarda la salida en `prueba-antes.txt`.]**

## 5. Corrección en la web y en la base
**Web (`public/app.js`):**
- El SKU se guarda siempre en mayúsculas (`.trim().toUpperCase()`).
- La revisión de repetidos compara sin distinguir mayúsculas (`p.sku.toUpperCase() === valores.sku`), lo que también cubre los SKU antiguos guardados en minúsculas.

**Base (`supabase/migrations/…_sku_unico_sin_mayusculas.sql`):**
```sql
create unique index productos_user_sku_sin_mayusculas_unico
  on public.productos (user_id, upper(sku));
```
Antes de aplicarla, el agente contó las filas que incumplen la regla:
```sql
select user_id, upper(sku) as sku_normalizado, count(*) as repetidos,
       string_agg(sku || ' (' || nombre || ')', ', ') as productos
from public.productos
group by user_id, upper(sku)
having count(*) > 1;
```
- Resultado: **[COMPLETAR: cuántas filas y cuáles.]**
- Qué hicimos con ellas: **[COMPLETAR: por ejemplo, borré el duplicado de prueba con mi aprobación, o "no había ninguna".]**
- Los SKU antiguos en minúsculas que **no** se repiten se quedaron como están: siguen siendo válidos y el índice evita que se repitan.

Antes de entregarlo, Claude lo probó en un Postgres local: con un `cho-001` repetido, el índice **no se dejó crear** (`Key (user_id, upper(sku))=(…, CHO-001) is duplicated`); sin repetidos se creó, y `TOR-777` seguido de `tor-777` fue rechazado con `duplicate key value violates unique constraint`. Otro usuario sí pudo usar el mismo SKU.

- **Después de corregir la prueba pasa:** **[COMPLETAR: por ejemplo `5 passed`, y guarda la salida en `prueba-despues.txt`.]**

## 6. Publicación y verificación
- PR con `Closes #…`: **[COMPLETAR]**. CI en verde: **[COMPLETAR]**.
- Merge, despliegue en Render: **[COMPLETAR: estado del despliegue.]**
- En la URL pública intenté otra vez `tor-001` y salió «Ya tienes un producto con el SKU TOR-001». Captura: `produccion-corregido.png`. **[COMPLETAR]**

## 7. Cierre del ciclo
**Qué aprendió el sistema:** los identificadores que escribe una persona (como el SKU) se tienen que normalizar antes de compararlos. Validar solo el texto exacto deja pasar repetidos. Y la regla tiene que estar en la base, no solo en la web, porque la web se puede saltar.

**Siguiente requisito:** **[COMPLETAR. Ideas: H4 borrar productos (sigue pendiente en el issue #6), H5 historial de movimientos (#7), o normalizar los SKU antiguos a mayúsculas con una migración revisada.]**

**Qué le delegaría a un agente:** reproducir el error con Playwright, leer logs y datos en solo lectura, proponer la prueba y el SQL, y abrir el issue y el PR.

**Qué seguiría revisando yo:** cualquier cambio a datos que ya existen (borrar o corregir filas), el SQL antes de aplicarlo en producción, que la corrección quede en la web **y** en la base, y la verificación final en la URL pública.

## Prompts clave
1. **[COMPLETAR: el prompt de reproducción e investigación.]**
2. **[COMPLETAR: el de crear el issue.]**
3. **[COMPLETAR: el de la prueba.]**
4. **[COMPLETAR: el de la corrección.]**

## Error o mala decisión de la IA
**[COMPLETAR con algo que veas hoy.]**

## Comando o herramienta que aprobé o rechacé
**[COMPLETAR.]** Por ejemplo: aprobé `apply_migration` después de ver que la consulta de repetidos daba 0 filas; rechacé cualquier `update` o `delete` sobre datos reales sin ver antes qué filas eran.

## Cómo comprobé que funciona
- La prueba falla antes y pasa después (`prueba-antes.txt` y `prueba-despues.txt`).
- CI en verde en el PR.
- La URL pública rechaza el SKU repetido (captura).
- **[COMPLETAR]**
