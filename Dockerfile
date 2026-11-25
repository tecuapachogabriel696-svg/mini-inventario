# Imagen de Mini Inventario: Node 22 en su versión ligera (Debian slim).
FROM node:22-slim

# Carpeta de trabajo dentro del contenedor.
WORKDIR /app

# Modo producción: Express y npm se comportan como en un servidor real.
ENV NODE_ENV=production

# Primero solo los archivos de dependencias, para que Docker reutilice
# esta capa mientras package.json y package-lock.json no cambien.
COPY package.json package-lock.json ./

# Instala exactamente las versiones del lock, sin las de desarrollo (Playwright).
RUN npm ci --omit=dev

RUN npm run no-existe

# Copia solo lo que la app necesita para correr. Nada de .env ni llaves:
# SUPABASE_URL y SUPABASE_KEY llegan como variables de entorno al arrancar.
COPY server.js ./
COPY public ./public

# No correr como root: la imagen oficial trae el usuario "node".
USER node

# Puerto de referencia. El real lo define process.env.PORT
# (3000 en local; Render asigna el suyo, 10000 por defecto).
EXPOSE 3000

CMD ["node", "server.js"]
