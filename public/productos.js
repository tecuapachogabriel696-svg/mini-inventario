// Acceso a datos de Mini Inventario.
// Todo lo que lee o escribe productos (y la sesión) pasa por este archivo.
// Usa Supabase; las reglas de quién ve qué las aplica RLS en la base de datos.
// window.CONFIG viene de /config.js y window.supabase de /vendor/supabase.js.

const { SUPABASE_URL, SUPABASE_KEY } = window.CONFIG ?? {};

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Falta configurar SUPABASE_URL y SUPABASE_KEY en .env.');
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const COLUMNAS = 'id, nombre, sku, cantidad, minimo, created_at';

// Traduce los errores de Postgres/Supabase a mensajes para el usuario.
function errorLegible(error) {
  if (error.code === '23505') return new Error('Ya tienes un producto con ese SKU.');
  if (error.code === '23514') return new Error('Algún valor no cumple las reglas del producto.');
  return new Error(error.message);
}

// ---- Sesión ----

export async function obtenerUsuario() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export function alCambiarSesion(callback) {
  supabase.auth.onAuthStateChange((_evento, sesion) => callback(sesion?.user ?? null));
}

export async function iniciarSesion(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Correo o contraseña incorrectos.');
}

// Regresa true si ya quedó con sesión; false si Supabase pide confirmar el correo.
export async function registrarse(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return Boolean(data.session);
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// ---- Productos ----
// user_id lo pone la base de datos (default auth.uid()) y RLS lo verifica.

export async function listarProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select(COLUMNAS)
    .order('nombre', { ascending: true });
  if (error) throw errorLegible(error);
  return data;
}

export async function agregarProducto({ nombre, sku, cantidad, minimo }) {
  const { data, error } = await supabase
    .from('productos')
    .insert({ nombre, sku, cantidad, minimo })
    .select(COLUMNAS)
    .single();
  if (error) throw errorLegible(error);
  return data;
}

export async function editarProducto(id, { nombre, sku, cantidad, minimo }) {
  const { data, error } = await supabase
    .from('productos')
    .update({ nombre, sku, cantidad, minimo })
    .eq('id', id)
    .select(COLUMNAS)
    .maybeSingle();
  if (error) throw errorLegible(error);
  if (!data) throw new Error('El producto ya no existe.');
  return data;
}
