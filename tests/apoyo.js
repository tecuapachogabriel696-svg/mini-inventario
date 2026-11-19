// Ayudas para las pruebas: datos del usuario de prueba y limpieza en Supabase.
const { createClient } = require('@supabase/supabase-js');

try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables que ya tenga el sistema.
}

function credenciales() {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error('Faltan TEST_EMAIL y TEST_PASSWORD en .env.');
  }
  return { email, password };
}

// SKU único por prueba, para no chocar con otros productos.
function skuUnico(prefijo = 'PW') {
  return `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Borra los productos indicados con la sesión del usuario de prueba.
// RLS solo le deja borrar sus propios productos.
async function borrarProductos(skus) {
  if (skus.length === 0) return;
  const { email, password } = credenciales();
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  const { error: errorSesion } = await supabase.auth.signInWithPassword({ email, password });
  if (errorSesion) throw new Error(`No se pudo iniciar sesión para limpiar: ${errorSesion.message}`);
  const { error } = await supabase.from('productos').delete().in('sku', skus);
  if (error) throw new Error(`No se pudieron borrar los productos de prueba: ${error.message}`);
  await supabase.auth.signOut();
}

// Cuenta cuántos productos con ese prefijo de SKU quedan (para comprobar la limpieza).
async function contarProductos(prefijo) {
  const { email, password } = credenciales();
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  await supabase.auth.signInWithPassword({ email, password });
  const { count, error } = await supabase
    .from('productos')
    .select('id', { count: 'exact', head: true })
    .like('sku', `${prefijo}%`);
  await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  return count;
}

module.exports = { credenciales, skuUnico, borrarProductos, contarProductos };
