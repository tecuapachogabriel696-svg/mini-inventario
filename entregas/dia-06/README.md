# Bitácora — Día 6

Pull request: https://github.com/tecuapachogabriel696-svg/mini-inventario/pull/12

## Prompts clave
1. (Claude en claude.ai) "Analiza a fondo la actividad del día 5 y del día 6; revisa que el 5 esté completo y realiza el 6." El agente revisó el PR #11 del día 5, preparó `.github/workflows/ci.yml` y ajustó `playwright.config.js` para generar el reporte HTML en CI.
2. (Claude Code) "Las verificaciones de este pull request fallaron. Usa gh pr checks, gh run list y gh run view con --log-failed para encontrar la causa. Explícamela antes de corregir. Cuando la apruebe, corrige, sube el cambio y comprueba que todo pase."
3. (Claude Code) "Lo rechacé por accidente. Sí apruebo la corrección: vuelve a poner <= en public/app.js, haz commit, súbelo y comprueba que pase."

## Flujo de CI (`.github/workflows/ci.yml`)
- Se ejecuta en **cada pull request hacia `main`** (y también se puede lanzar a mano con `workflow_dispatch`).
- Corre en `ubuntu-latest` con **Node 22**: `npm ci`, `npx playwright install --with-deps chromium` y `npx playwright test`.
- Pasa como variables de entorno los secretos `SUPABASE_URL`, `SUPABASE_KEY`, `TEST_EMAIL` y `TEST_PASSWORD`. Antes de las pruebas revisa que existan y, si falta alguno, dice cuál.
- Sube el reporte de Playwright como artefacto `reporte-playwright`, aunque las pruebas fallen.
- Usa `actions/checkout@v6`, `actions/setup-node@v6` y `actions/upload-artifact@v6`, que corren con Node 24 (las v4 usan Node 20, que GitHub ya está retirando).
- Permisos mínimos (`contents: read`), y si subo otro commit al mismo PR se cancela la corrida anterior.
- En `playwright.config.js`, cuando `CI=true`, se agrega el reporte HTML y `forbidOnly`.

## Secretos
- Los guardé yo con `gh secret set`, escribiendo cada valor en mi terminal. No los pegué en la conversación con el agente.
- Al principio escribí mal uno: quedó como `TEST_PASSWOR`. Lo vi en `gh secret list`, lo guardé bien con `gh secret set TEST_PASSWORD` y borré el mal escrito con `gh secret delete TEST_PASSWOR`. Captura: `secretos.png`, con los 4 nombres correctos y sin valores.
- El flujo solo los nombra con `${{ secrets.NOMBRE }}`; no hay ningún valor escrito en el código.

## De verde a rojo y otra vez a verde (mismo PR #12)
| Commit | Qué hace | Resultado |
|---|---|---|
| `0b20d83` Día 6: CI con GitHub Actions | Agrega el flujo | ✅ pasó (36 s) — `ci-verde.png` |
| `b7333be` Ajustar app.js | Rompe una prueba a propósito | ❌ falló (41 s) — `ci-rojo.png` |
| `d022a26` Corrección | Regresa `<=` | ✅ pasó — `ci-verde-otra-vez.png` |

Para romperla cambié a mano `p.cantidad <= p.minimo` por `p.cantidad < p.minimo` en `public/app.js` y usé el mensaje "Ajustar app.js" para no darle pistas al agente.

**Diagnóstico del agente:** con `gh pr checks`, `gh run list` y `gh run view --log-failed` encontró que fallaba "marca un producto bajo el mínimo" (`Expected pattern: /bajo/ — Received string: ""`). Comparó con la corrida anterior, que había pasado, y revisó el último commit, que cambió `<=` por `<`. Concluyó que la que estaba mal era la app y no la prueba, porque `docs/requisitos.md` dice `cantidad <= minimo` (cantidad 5 con mínimo 5 se resalta). Me lo explicó antes de cambiar nada.

## La causa de la falla, con mis palabras
El commit "Ajustar app.js" cambió la regla de producto bajo de "menor o igual" a solo "menor". Con eso, un producto con cantidad 5 y mínimo 5 ya no se marcaba como bajo, aunque los requisitos dicen que sí. La prueba "marca un producto bajo el mínimo" revisa justo ese caso, así que falló en GitHub Actions. Se corrigió regresando el `<=` en `public/app.js`.

## Error o mala decisión de la IA
En el día 5 el agente dejó las pruebas listas, pero en mi computadora fallaron las 4 con `Executable doesn't exist ... chrome-headless-shell.exe`, porque nunca se había instalado el navegador de Playwright aquí (el día 5 se corrió en otra computadora). Tampoco tenía `TEST_EMAIL` y `TEST_PASSWORD` en mi `.env`. Lo detecté por el mensaje de error y lo resolví con `npx playwright install chromium` y agregando las dos variables. En GitHub Actions no pasa porque el flujo instala Chromium en cada corrida.

## Comando o herramienta que aprobé o rechacé
- **Aprobé** `gh run view --log-failed`, porque solo lee el registro de la corrida que falló y no cambia nada.
- **Rechacé por accidente** la primera edición de `public/app.js`. Claude Code se detuvo sin cambiar nada y esperó a que yo confirmara; luego la aprobé. Eso muestra que el modo manual sí me deja frenar cualquier cambio.
- **Aprobé** el commit y el push de la corrección después de leer la explicación de la causa.

## Cómo comprobé que funciona
- `npx playwright test` en mi computadora: **4 passed** antes de empezar.
- El mismo PR #12 aparece en verde, luego en rojo y al final en verde (capturas y la tabla de arriba).
- El reporte de Playwright aparece como artefacto `reporte-playwright` en las corridas de GitHub Actions.
- `gh secret list` muestra exactamente `SUPABASE_KEY`, `SUPABASE_URL`, `TEST_EMAIL` y `TEST_PASSWORD`.
- Busqué llaves en el flujo y en la configuración y no hay ninguna; solo nombres de secretos.
