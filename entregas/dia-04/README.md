# Bitácora — Día 4

Pull request: (se agrega al abrirlo)

## Prompts clave
1. (Claude en claude.ai) "Analiza a fondo la actividad del día 4 y empieza a trabajar." El agente preparó la migración SQL, el cambio de `public/productos.js` a Supabase, el inicio de sesión, `/config.js` y `.env.example`.
2. (Claude Code, con el MCP) "Usa el MCP de Supabase solo en este proyecto y sigue las skills supabase y supabase-postgres-best-practices. Aplica la migración supabase/migrations/20261117000000_crear_productos.sql, que crea la tabla productos según docs/diseno.md con Row Level Security y políticas para que cada usuario solo pueda leer, crear, editar y borrar sus propios productos. Muéstrame el SQL antes de aplicarlo."
3. "Cascade está bien. Solo aplica cuando se borra un usuario completo en Auth; entonces se borran sus productos con él, en lugar de quedar huérfanos o bloquear el borrado."
4. "Sí, renombra el archivo a 20261117201851_crear_productos.sql y agrega "on delete cascade" de user_id en docs/diseno.md. No hagas commit todavía."

## Uso del MCP
- Lo conecté con `claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=hfatbqeovwzblacqqwbe"`. El `project_ref` en la URL lo limita a mi proyecto `mini-inventario`; quedó guardado en `.mcp.json`.
- Al abrir Claude Code elegí **"Use this MCP server"** y no "Use this and all future MCP servers", para aprobar solo este.
- Claude Code arrancó en **auto mode**. Lo cambié a **manual mode** con Shift+Tab, porque la actividad pide mantener la aprobación manual, y lo autentiqué con `/mcp`.
- Antes de proponer el SQL, el agente solo leyó la base: `public` no tenía tablas ni migraciones.

## SQL que aprobé y qué hace
Aprobé `apply_migration` con nombre `crear_productos` (archivo `supabase/migrations/20261117201851_crear_productos.sql`):
- Crea la tabla `productos` con `id`, `user_id`, `nombre`, `sku`, `cantidad`, `minimo` y `created_at`, como dice `docs/diseno.md`.
- `user_id` se llena solo con `auth.uid()` (el usuario con sesión) y apunta a `auth.users` con `on delete cascade`.
- La base de datos valida: SKU solo con letras, números y guiones; cantidad 0 o más; mínimo 5 o más; y SKU único **por usuario** (`unique (user_id, sku)`).
- `enable row level security` activa RLS: sin una política que lo permita, nadie ve ni cambia nada.
- 4 políticas, una por operación (select, insert, update, delete), todas `to authenticated` y con `(select auth.uid()) = user_id`: cada usuario solo puede tocar sus propias filas. La de editar tiene `using` y `with check`, así nadie puede pasar un producto suyo a otro usuario.

## Error o mala decisión de la IA
El SQL que preparó el agente en claude.ai traía `on delete cascade` en `user_id`, pero `docs/diseno.md` no lo decía. Lo detectó la revisión de Claude Code con las skills antes de aplicarlo, porque comparó la migración con el diseño y me preguntó. Decidí mantenerlo (si se borra un usuario, se borran sus productos) y pedí actualizar `docs/diseno.md` para que coincidan.

También: Supabase registró la migración con la versión `20261117201851`, distinta del nombre del archivo local (`20261117000000`). Claude Code lo notó y renombré el archivo para que no se vean como dos migraciones distintas.

## Comando o herramienta que aprobé o rechacé
- **Aprobé** `apply_migration` después de leer el SQL completo, porque solo crea la tabla, sus reglas y sus políticas; no borra datos.
- **Rechacé** el modo automático de Claude Code y lo dejé en manual, para aprobar yo cada llamada al MCP.
- **No acepté** que hiciera commit y PR antes de tener las capturas y la bitácora.

## Otros problemas que resolví
- `npm install` mostró `EBADENGINE`: tenía Node **v20.11.1** y el proyecto pide 22. Instalé `nodejs22` con Scoop, pero `node --version` seguía en 20 porque `Get-Command node` apuntaba a `C:\Program Files\nodejs`. Desinstalé ese Node viejo y quedó **v22.23.5**.
- `Expand-Archive` no encontraba `dia04.zip` porque no lo había descargado del chat.

## Seguridad
- `.env` tiene la URL y la llave **publishable**. `git check-ignore .env` responde `.env`, así que no se sube; solo se sube `.env.example` sin valores.
- El servidor se niega a arrancar si `SUPABASE_KEY` es la llave `service_role` o una `sb_secret_...`.
- El navegador recibe la URL y la llave pública desde `/config.js`; quien protege los datos es RLS.
- Los avisos de seguridad y rendimiento de Supabase (advisors) no reportaron nada.

## Cómo comprobé que funciona
- `node --version` → v22.23.5; `npm start` levanta la web en http://localhost:3000.
- Claude Code probó RLS en la base con dos usuarios temporales dentro de una transacción que se revirtió: A crea y ve su producto; B ve 0, editar o borrar el de A afecta 0 filas, crear a nombre de A y pasar un producto a otro usuario quedan bloqueados, y sin sesión se ven 0.
- Creé 2 usuarios confirmados en Authentication > Users.
- Usuario 1: agregué Chocolate, Cocacola y Gomitas. Captura: `captura-usuario-1.png`.
- Usuario 2: no ve ningún producto del usuario 1; agregué uno propio. Captura: `captura-usuario-2.png`.
- `git status` no muestra `.env`.
