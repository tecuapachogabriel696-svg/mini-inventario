// Cuenta los productos de prueba que quedan en Supabase para el usuario de prueba.
// Uso: node entregas/dia-05/verificar-limpieza.js
const { contarProductos } = require('../../tests/apoyo');

(async () => {
  const pw = await contarProductos('PW-');
  const exp = await contarProductos('EXP-');
  console.log(`Productos con SKU PW- que quedan: ${pw}`);
  console.log(`Productos con SKU EXP- que quedan: ${exp}`);
})();
