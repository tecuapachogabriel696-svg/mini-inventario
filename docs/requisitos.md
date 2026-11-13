# Requisitos — Mini Inventario

Mini Inventario es una web donde una persona inicia sesión, registra productos con nombre, SKU, cantidad y cantidad mínima, y ve cuáles están en o por debajo del mínimo.

## Decisiones del equipo

| Tema | Decisión |
|---|---|
| Inicio de sesión | Solo correo y contraseña. Cualquier persona puede crear su cuenta. |
| Privacidad | Cada usuario ve y modifica solo sus propios productos. |
| SKU | Obligatorio, único por usuario, solo letras, números y guiones. |
| Cantidad | Número entero mayor o igual a 0. |
| Mínimo | Número entero mayor o igual a 5. |
| Producto bajo | `cantidad <= minimo`; se resalta en la misma lista. |
| Borrar | Pide confirmación antes de borrar. |
| Historial | Cada alta, edición y borrado queda registrado con usuario, acción, producto y fecha. |
| Fuera de alcance | Búsqueda y ordenamiento personalizado (la lista sale ordenada por nombre). |

## Historias de usuario

### H1. Crear cuenta e iniciar sesión
Como persona, quiero crear una cuenta e iniciar sesión con correo y contraseña para tener mi propio inventario.

- [ ] Puedo registrarme con un correo y una contraseña.
- [ ] Con datos correctos entro a la página de mi inventario.
- [ ] Con una contraseña incorrecta veo un mensaje de error y no entro.
- [ ] Si no he iniciado sesión y abro la página del inventario, me manda al inicio de sesión.
- [ ] Puedo cerrar sesión y ya no veo mis productos.

### H2. Registrar un producto
Como usuario, quiero registrar un producto con nombre, SKU, cantidad y mínimo para llevar su control.

- [ ] El formulario pide nombre, SKU, cantidad y mínimo; los cuatro son obligatorios.
- [ ] El SKU solo acepta letras, números y guiones: `TOR-001` se acepta y `TOR 001!` se rechaza con un mensaje.
- [ ] Si el SKU ya existe en mis productos, se rechaza con un mensaje; otro usuario sí puede usar el mismo SKU.
- [ ] La cantidad es un entero mayor o igual a 0; `-1` y `2.5` se rechazan.
- [ ] El mínimo es un entero mayor o igual a 5; `4` se rechaza.
- [ ] Al guardar, el producto aparece en mi lista sin recargar la página.

### H3. Ver mi inventario y los productos bajos
Como usuario, quiero ver mis productos y distinguir los que necesitan resurtido.

- [ ] Solo veo mis productos, nunca los de otro usuario.
- [ ] La lista muestra nombre, SKU, cantidad y mínimo, ordenada por nombre.
- [ ] Los productos con cantidad menor o igual al mínimo se ven resaltados: cantidad 5 y mínimo 5 se resalta; cantidad 6 y mínimo 5 no.
- [ ] Si no tengo productos, veo un mensaje de inventario vacío.

### H4. Editar y borrar un producto
Como usuario, quiero corregir o eliminar mis productos.

- [ ] Puedo editar cualquier campo con las mismas reglas de H2.
- [ ] Al dar clic en borrar aparece «¿Seguro que quieres borrar [nombre]?».
- [ ] Si cancelo, el producto sigue en la lista.
- [ ] Si confirmo, el producto desaparece de la lista.
- [ ] No puedo editar ni borrar productos de otro usuario.

### H5. Historial de movimientos
Como usuario, quiero ver qué cambios se hicieron en mi inventario y quién los hizo.

- [ ] Cada alta, edición y borrado guarda un registro con usuario, acción, producto y fecha.
- [ ] En la sección «Historial» veo esos registros del más reciente al más antiguo.
- [ ] Al borrar un producto, su registro de borrado sigue en el historial.
- [ ] Solo veo el historial de mis propios productos.
