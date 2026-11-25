-- Día 10: el SKU debe ser único por usuario sin importar mayúsculas y minúsculas.
-- Antes: unique (user_id, sku) dejaba guardar "TOR-001" y "tor-001" como productos distintos.
--
-- ANTES de aplicar, revisar si ya hay filas que incumplen la regla
-- (si esta consulta regresa filas, el índice no se puede crear hasta resolverlas):
--
--   select user_id, upper(sku) as sku_normalizado, count(*) as repetidos,
--          string_agg(sku || ' (' || nombre || ')', ', ') as productos
--   from public.productos
--   group by user_id, upper(sku)
--   having count(*) > 1;
--
-- La web ahora guarda los SKU en mayúsculas. Los SKU antiguos en minúsculas siguen
-- siendo válidos; este índice evita que se repitan con otra combinación de mayúsculas.

create unique index productos_user_sku_sin_mayusculas_unico
  on public.productos (user_id, upper(sku));
