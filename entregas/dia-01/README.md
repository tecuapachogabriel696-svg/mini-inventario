# Bitácora — Día 1

## Prompts clave
1. "Crea en esta carpeta un repositorio Git llamado mini-inventario. Usa gh para publicarlo como repositorio público en mi cuenta. Agrega un README corto que diga que requiere Node.js 22 y Python 3.12, y un .gitignore para Node y Python que excluya .env, .venv y node_modules. Antes de ejecutar cada comando, explícame qué hace."
2. "Crea el archivo de instrucciones de este proyecto (CLAUDE.md si eres Claude Code, AGENTS.md si eres Codex). Explica que Mini Inventario es una web de inventario, que el proyecto usa Node.js 22 y Python 3.12, que cada cambio va en una rama con pull request, que nunca se suben llaves ni archivos .env, y que debes pedir aprobación antes de borrar datos o desplegar. Máximo 20 líneas."
3. "No agregues la regla de .env.example; deja solo las reglas que te pedí y crea CLAUDE.md sin esa línea."
4. "Sube CLAUDE.md a GitHub siguiendo las reglas del proyecto: en una rama con pull request. Luego fusiona el pull request a main."

## Error o mala decisión de la IA
Al crear CLAUDE.md, el agente agregó una regla que no pedí (usar `.env.example`). Lo detecté al leer el archivo antes de aprobarlo. Además, dijo que el archivo tenía 17 líneas cuando en pantalla tenía 18. Rechacé la escritura y le pedí que dejara solo las reglas de la consigna.

## Comando o herramienta que aprobé o rechacé
- **Rechacé** la escritura de `CLAUDE.md` porque incluía una regla extra que no pedí.
- **Aprobé** `git branch -d docs/claude-md` porque la rama ya estaba fusionada y `-d` no borra ramas con cambios sin fusionar. El agente pidió permiso antes de borrarla, como indica la regla de CLAUDE.md.

## Otros problemas que resolví
- `gh repo create` y `git push` terminaron con código 255, aunque sí funcionaron. El agente lo comprobó con `gh repo view` y `git ls-remote` antes de reintentar.
- `node --version` mostraba v25.6.1 porque ya tenía nvm for Windows. Lo detecté con `Get-Command node` y cambié a Node 22 con `nvm install 22` y `nvm use 22.23.5`.

## Cómo comprobé que funciona
- Versiones: `node` v22.23.5, `npm` 10.9.9, `python3` 3.12.10.
- Cloné el repositorio en otra carpeta (`prueba-inventario`). `git ls-files` muestra `.gitignore`, `CLAUDE.md` y `README.md`, y `cat README.md` muestra los requisitos. Ver `captura-prueba-limpio.png`.
