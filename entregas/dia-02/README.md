# Bitácora — Día 2

## Prompts clave
1. "Vamos a planear Mini Inventario, una web donde una persona inicia sesión, registra productos con nombre, SKU, cantidad y cantidad mínima, y ve cuáles están por debajo del mínimo. No escribas código. Hazme preguntas sobre lo que no esté claro y luego propone 5 historias de usuario, cada una con criterios de aceptación que se puedan comprobar."
2. Mis respuestas a sus preguntas: solo correo y contraseña; cada quien ve sus propios productos; SKU único por usuario; mínimo de 5; resaltar cuando cantidad = mínimo en la misma lista; confirmar antes de borrar y registrar qué usuario hizo cada cambio.
3. "Propón el diseño técnico de Mini Inventario y guárdalo en docs/diseno.md. Usa Node.js con Express para servir la página, HTML y JavaScript sin framework, y Supabase para base de datos e inicio de sesión. Define la tabla productos con id, user_id, nombre, sku, cantidad, minimo y created_at. Explica qué valida cada capa."
4. "Crea un issue en GitHub por cada historia de docs/requisitos.md usando gh. Pon los criterios de aceptación como lista de tareas. Muéstrame cada comando antes de ejecutarlo."

## Mis 2 correcciones al agente
1. **SKU con números.** Al principio dije que el SKU fuera solo de letras y guiones. El agente señaló que casi todos los SKU reales llevan números (por ejemplo `TOR-001`). Cambié la regla a letras, números y guiones, porque si no, no podríamos registrar productos reales.
2. **Historial de movimientos.** La consigna solo pedía la tabla `productos`. Agregué que cada alta, edición y borrado quede registrado (quién, qué y cuándo), porque así se puede saber quién hizo cada cambio. Esto se volvió la historia H5 y agregó la tabla `movimientos` al diseño.

## Error o mala decisión de la IA
El agente supuso que **cualquier persona puede registrarse**, aunque yo no contesté esa pregunta. Lo detecté al leer la sección "Cómo interpreté tus respuestas" antes de aprobar las historias. Lo dejé así porque sí es lo que queremos, pero lo revisé en vez de aceptarlo sin leer.

## Comando o herramienta que aprobé o rechacé
**Aprobé** `gh issue create --title "H1. Crear cuenta e iniciar sesión" --body-file issues\H1.md`. Este comando crea un issue en nuestro repositorio de GitHub con ese título, y usa como descripción el contenido del archivo `H1.md`, que trae la historia y sus criterios como lista de tareas (`- [ ]`). Lo aprobé porque solo crea un issue, no borra ni cambia código.

## Cómo comprobé que funciona
- `gh issue list` muestra los 5 issues (H1 a H5).
- Abrí cada issue en GitHub y los criterios aparecen como casillas de tareas.
- `git ls-files docs` muestra `docs/requisitos.md` y `docs/diseno.md`.
- El pull request de la rama `dia-02-planeacion` muestra los documentos y los diagramas Mermaid de `docs/diseno.md` se ven en GitHub.

## Otros problemas que resolví
- `gh` no estaba instalado: PowerShell marcó "El término gh no se reconoce". Tampoco tenía Scoop. Instalé Scoop con `irm get.scoop.sh | iex` y luego `scoop install gh`.
- Inicié sesión con `gh auth login` (GitHub.com, HTTPS, navegador) y lo comprobé con `gh auth status`.
- Como el repositorio es de Gab, el agente no tenía permiso para subir cambios. Decidí que el agente preparara los archivos y los comandos, y yo los ejecuté en mi PowerShell leyendo cada uno antes.
- Los issues quedaron como #3 a #7.


   Pull request: https://github.com/tecuapachogabriel696-svg/mini-inventario/pull/8
