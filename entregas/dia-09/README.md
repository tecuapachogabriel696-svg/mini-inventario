# Bitácora — Día 9

**URL pública:** https://mini-inventario-2z06.onrender.com

Trabajé con Claude Code en modo manual (pide aprobación antes de cada acción). Claude (en claude.ai) escribió el `Dockerfile` y el `.dockerignore`, revisó cada paso y me ayudó con esta bitácora.

## Prompts clave
1. **Contenedor:** "Crea un Dockerfile para Mini Inventario y un .dockerignore que excluya .env, node_modules, tests y entregas. La app debe escuchar en 0.0.0.0 y en process.env.PORT. No copies secretos a la imagen. Explícame cada instrucción."
2. **MCP:** "Usa el MCP de Render para listar mis servicios. No cambies variables ni lances despliegues."
3. **Diagnóstico:** "Usa el MCP de Render para listar el último despliegue de mi servicio y leer sus logs. Explícame la causa exacta de la falla y qué línea la provocó. No cambies variables ni lances despliegues sin preguntarme."
4. **Reparación:** "Sí. Crea la rama dia-09-reparar, quita la línea RUN npm run no-existe del Dockerfile, haz commit, push y abre el pull request hacia main. No hagas merge."

## 1. Contenedor en local (PR #15)
- **`Dockerfile`:** usa `node:22-slim` y `npm ci --omit=dev`, copia **solo** `server.js` y `public/`, y corre con el usuario `node` (no root). Cada instrucción tiene un comentario que la explica.
- **`.dockerignore`:** excluye `.env` (también `mcp-inventario/.env`), `node_modules`, `tests`, `entregas`, `.git` y `.venv`.
- **`server.js`:** ahora escucha en `0.0.0.0` y en `process.env.PORT`.
- **Prueba:** `docker build -t mini-inventario .` y `docker run --rm --init --env-file .env -e PORT=3000 -p 3000:3000 mini-inventario`. Inicié sesión en `http://localhost:3000` y se ve el inventario (`docker-local.png`). Usé `--init` para que Ctrl + C apague el contenedor y `--rm` para que no se acumulen.
- El CI pasó y el PR #15 se fusionó solo cuando salió en verde (`gh pr checks --watch` y luego `gh pr merge`).

## 2. Servicio en Render
- New → Web Service, con el repositorio `mini-inventario`, Language **Docker**, rama `main`, plan **Free**, Auto-Deploy **On Commit** y Health Check `/health`.
- **Secretos:** en el panel de Render solo agregué `SUPABASE_URL` y `SUPABASE_KEY` (la llave publishable), escritas a mano. No usé "Add from .env", porque habría subido también `TEST_EMAIL`, `TEST_PASSWORD` y `PORT`. Las llaves no están en la imagen ni en el repositorio.
- Primer despliegue: **Live**. Inicié sesión en la URL pública (`render-publico.png`).

## 3. MCP de Render
- Instalé el plugin oficial con `/plugin install render@claude-plugins-official`, en **local scope** (solo para mí y este repositorio, sin tocar la configuración que comparto con mi compañero). Luego lo autoricé con `/mcp` → Authenticate.
- El MCP listó el servicio `mini-inventario`: Docker, plan Free, rama `main`, health check `/health` y la URL pública (`mcp-servicios.png`).

## 4. Falla provocada y diagnóstico
- Agregué `RUN npm run no-existe` al `Dockerfile` directamente en `main` (commit `c74ba92`). Render hizo el despliegue automático y falló: **"Exited with status 1 while building your code"** (`render-deploy-fallido.png`).
- **Diagnóstico con el MCP** (`mcp-diagnostico.png`), obtenido de los logs de construcción de Render:
  ```
  #11 [5/7] RUN npm run no-existe
  npm error Missing script: "no-existe"
  ERROR: process "/bin/sh -c npm run no-existe" did not complete successfully: exit code 1
  ```
  - **Causa:** `npm run` ejecuta scripts de `package.json`, y ahí no existe `no-existe`. npm termina con código 1, Docker detiene la construcción y Render marca el despliegue como fallido.
  - **Línea:** el log de Render señala `Dockerfile:17` (`>>> RUN npm run no-existe`).
  - **Impacto:** la URL siguió funcionando, porque Render mantuvo en línea el despliegue anterior.

## 5. Reparación y verificación (PR #16)
- El agente quitó la línea en la rama `dia-09-reparar`, con un commit que solo cambia el `Dockerfile`, y abrió el PR #16. Lo fusioné solo después de que el CI pasó.
- Render desplegó solo el commit `b49e5c6`: **Deploy live** (`render-deploy-reparado.png`).
- Verificación de la URL con el agente: `https://mini-inventario-2z06.onrender.com/health` responde `{"status":"ok"}`, y la página principal carga el formulario de inicio de sesión sin errores de consola.

## Errores o malas decisiones de la IA
1. **URL adivinada:** Claude probó primero `https://mini-inventario.onrender.com` suponiendo que era mi servicio. No lo era: se quedaba "despertando" aunque el mío estaba recién desplegado. Lo detectamos porque no coincidía con el estado del panel, y la URL real resultó ser `mini-inventario-2z06.onrender.com`.
2. **El agente leyó el `Dockerfile` local antes de pedir los logs.** Podría haber "adivinado" la causa desde el archivo. Revisé que el diagnóstico citara el log de Render (`#11 [5/7]`, `Missing script` y `Dockerfile:17`), y sí lo hizo.
3. **`gh pr create` terminó con código 255** aunque el PR sí se creó. El agente lo comprobó con `gh pr list` y `gh pr view` antes de seguir.

## Comandos o herramientas que aprobé o rechacé
- **Aprobé** solo herramientas de lectura del MCP (List workspaces, List services y List logs).
- **No presioné "Rollback"** en Render ni dejé que el agente redesplegara o cambiara variables: la reparación se hizo con un PR, como pide `CLAUDE.md`.
- **Elegí local scope** para el plugin, y no project, porque el plugin trae comandos que pueden desplegar y cambiar variables (`deploy-to-render`, `render-env-vars`) y no quería activarlos para todo el equipo.
- **No envié** la sugerencia "Haz merge del PR #16 y revisa el despliegue": el merge lo hice yo con `gh pr merge` y solo con el CI en verde.

## Cómo comprobé que funciona
- **Local:** `docker run` e inicio de sesión en `localhost:3000`.
- **Render:** inicio de sesión en la URL pública, `/health` con `{"status":"ok"}` y la página principal sin errores de consola.
- **Falla:** el despliegue falló con el error esperado, el MCP lo explicó desde los logs y, tras quitar la línea, el siguiente despliegue quedó **Live**.
