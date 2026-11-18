const path = require('node:path');
const express = require('express');

// Lee .env si existe (Node 22 lo trae integrado, sin dependencias extra).
try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables que ya tenga el sistema.
}

const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// La llave secreta (service_role) se salta RLS: nunca debe llegar al navegador.
function esLlaveSecreta(llave) {
  if (llave.startsWith('sb_secret_')) return true;
  const partes = llave.split('.');
  if (partes.length !== 3) return false;
  try {
    const datos = JSON.parse(Buffer.from(partes[1], 'base64url').toString());
    return datos.role === 'service_role';
  } catch {
    return false;
  }
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Aviso: faltan SUPABASE_URL o SUPABASE_KEY en .env (ver .env.example).');
}
if (esLlaveSecreta(SUPABASE_KEY)) {
  console.error('Error: SUPABASE_KEY es la llave service_role/secret. Usa la publishable o anon.');
  process.exit(1);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Entrega al navegador solo la URL y la llave pública.
app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.set('Cache-Control', 'no-store');
  res.send(`window.CONFIG = ${JSON.stringify({ SUPABASE_URL, SUPABASE_KEY })};\n`);
});

// Cliente de Supabase servido desde node_modules (versión fijada en package-lock.json).
app.get('/vendor/supabase.js', (req, res) => {
  res.sendFile(require.resolve('@supabase/supabase-js/dist/umd/supabase.js'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Mini Inventario en http://localhost:${PORT}`);
});
