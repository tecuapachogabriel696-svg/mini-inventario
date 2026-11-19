# Bitácora — Día 6

Pull request: **[COMPLETAR: enlace del PR]**

> ⚠️ Borrador. Las partes marcadas con **[COMPLETAR]** dependen de lo que pase en GitHub. Llénalas con lo que realmente ocurra y borra esta nota.

## Prompts clave
1. (Claude en claude.ai) "Analiza a fondo los días 5 y 6; revisa que el 5 esté completo y realiza el 6." El agente preparó `.github/workflows/ci.yml` y ajustó `playwright.config.js` para generar el reporte HTML en CI.
2. (Claude Code) "Las verificaciones de este pull request fallaron. Usa gh pr checks, gh run list y gh run view con --log-failed para encontrar la causa. Explícamela antes de corregir. Cuando la apruebe, corrige, sube el cambio y comprueba que todo pase."

## Flujo de CI (`.github/workflows/ci.yml`)
- Se ejecuta en **cada pull request hacia `main`** (y también se puede lanzar a mano con `workflow_dispatch`).
- Corre en `ubuntu-latest` con **Node 22**: `npm ci`, `npx playwright install --with-deps chromium` y `npx playwright test`.
- Pasa como variables de entorno los secretos `SUPABASE_URL`, `SUPABASE_KEY`, `TEST_EMAIL` y `TEST_PASSWORD`. Antes de las pruebas revisa que existan y, si falta alguno, dice cuál.
- Sube el reporte de Playwright como artefacto `reporte-playwright`, aunque las pruebas fallen.
- Usa `actions/checkout@v6`, `actions/setup-node@v6` y `actions/upload-artifact@v6`, que corren con Node 24 (las v4 usan Node 20, que GitHub ya no recomienda).
- Permisos mínimos (`contents: read`), y si subo otro commit al mismo PR se cancela la corrida anterior.
- En `playwright.config.js`, cuando `CI=true`, se agrega el reporte HTML y `forbidOnly` (falla si alguien deja un `test.only`).

## Secretos
- Los guardé yo con `gh secret set SUPABASE_URL`, `SUPABASE_KEY`, `TEST_EMAIL` y `TEST_PASSWORD`, escribiendo cada valor en mi terminal. No los pegué en la conversación con el agente.
- `gh secret list` muestra los 4 nombres (sin valores). **[COMPLETAR: captura `secretos.png`]**
- El flujo solo los nombra con `${{ secrets.NOMBRE }}`; no hay ningún valor escrito en el código.

## De verde a rojo y otra vez a verde
1. **Verde:** el PR pasó la verificación. Captura: `ci-verde.png`. **[COMPLETAR]**
2. **Rojo:** subí un cambio que rompe una prueba: **[COMPLETAR: qué cambiaste, por ejemplo `<=` por `<` en `public/app.js`]**. La verificación falló. Captura: `ci-rojo.png`.
3. **Diagnóstico:** el agente usó `gh pr checks`, `gh run list` y `gh run view --log-failed`. **[COMPLETAR: qué encontró]**
4. **Verde otra vez:** aprobé la corrección, el agente la subió y la verificación pasó. Captura: `ci-verde-otra-vez.png`. **[COMPLETAR]**

## La causa de la falla, con mis palabras
**[COMPLETAR con tus palabras.]**

## Error o mala decisión de la IA
**[COMPLETAR con algo que hayas visto hoy.]**

## Comando o herramienta que aprobé o rechacé
**[COMPLETAR.]** Por ejemplo: aprobé `gh run view --log-failed`, porque solo lee el registro de la corrida que falló y no cambia nada.

## Cómo comprobé que funciona
- `npx playwright test` pasó en mi computadora antes de empezar. **[COMPLETAR: 4 passed]**
- El mismo PR aparece primero en verde, luego en rojo y al final en verde (capturas).
- El reporte de Playwright aparece como artefacto en la corrida de GitHub Actions.
- Busqué llaves en el flujo y no hay ninguna; solo nombres de secretos.
