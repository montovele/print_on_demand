# Nginx - Plataforma Print on Demand

Configuración exclusiva para la plataforma Print on Demand: sirve el frontend
Vue en `print.ssaxxon.com` y publica la API Express en `api-pod.ssaxxon.com`.
El frontend usa rutas de una sola página y la API escucha localmente en el
puerto `4099`.

## Configuración Nginx

```nginx
# ============================================================
# PRINT ON DEMAND - FRONTEND VUE
# ============================================================

server {
    listen 80;
    listen [::]:80;

    server_name print.ssaxxon.com;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name print.ssaxxon.com;

    # Ajusta esta ruta si el repositorio se instala en otra ubicación.
    root /var/www/ssaxxon/print_on_demand/apps/web/dist;
    index index.html;

    ssl_certificate     /etc/ssl/cloudflare/ssaxxon-origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/ssaxxon-origin.key;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# ============================================================
# PRINT ON DEMAND - API NODE / EXPRESS
# ============================================================

server {
    listen 80;
    listen [::]:80;

    server_name api-pod.ssaxxon.com;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name api-pod.ssaxxon.com;

    ssl_certificate     /etc/ssl/cloudflare/ssaxxon-origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/ssaxxon-origin.key;

    location / {
        proxy_pass http://127.0.0.1:4099;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # El sistema valida y limita los archivos de arte a 5 MB.
        client_max_body_size 10m;
    }
}
```

## Variables de entorno de producción

Configura estas variables en el entorno del servidor antes de iniciar la API:

```dotenv
NODE_ENV=production
API_PORT=4099
WEB_ORIGIN=https://print.ssaxxon.com
COOKIE_SECURE=true
```

La conexión a MySQL y las credenciales de Stripe, UPS y otros proveedores se
configuran por separado en el archivo de entorno del servidor. No las incluyas
en este archivo de Nginx ni en el repositorio.

## Compilación del frontend

Establece la URL pública de la API al compilar Vue:

```powershell
$env:VITE_API_URL = "https://api-pod.ssaxxon.com/api/v1"
npm.cmd run build --workspace @pod/web
```

Publica el contenido generado en `apps/web/dist` bajo la ruta `root` indicada
arriba. La API debe ejecutarse como servicio local en el puerto `4099`; Nginx
solo la expone a través de HTTPS.

## Iniciar la API con PM2

Guarda este archivo como `ecosystem.config.cjs` en la raíz del repositorio del
VPS (`/var/www/ssaxxon/print_on_demand`):

```js
module.exports = {
  apps: [
    {
      name: "print-on-demand-api",
      cwd: "/var/www/ssaxxon/print_on_demand",
      script: "apps/api/dist/server.js",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        API_PORT: "4099",
        WEB_ORIGIN: "https://print.ssaxxon.com",
        COOKIE_SECURE: "true",
      },
    },
  ],
};
```

El archivo `.env` debe estar en la raíz del repositorio y contener la
configuración privada del servidor, incluida `DATABASE_URL` y las credenciales
que realmente uses. La API carga ese archivo al iniciar. No pongas secretos en
`ecosystem.config.cjs`.

Desde la raíz del proyecto, instala dependencias, genera el cliente Prisma,
aplica las migraciones de producción, compila y arranca la API. Instala PM2
globalmente si aún no está disponible en el VPS:

```bash
npm install --global pm2
npm ci
npm run db:generate
npm exec --workspace @pod/api -- prisma migrate deploy
npm run build --workspace @pod/api
pm2 start ecosystem.config.cjs
pm2 startup
```

`pm2 startup` mostrará un comando para habilitar el arranque automático en el
sistema operativo; ejecútalo como indique PM2 y después ejecuta `pm2 save`.
Para revisar el estado y los registros:

```bash
pm2 status
pm2 logs print-on-demand-api
```

Después de publicar una nueva versión de la API, recompila y reinicia el
proceso:

```bash
npm run build --workspace @pod/api
pm2 restart print-on-demand-api
```

Mantén el puerto `4099` accesible solo localmente desde Nginx/firewall; los
clientes deben conectarse por HTTPS a través del dominio de la API.

Después de guardar la configuración, valida y recarga Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```
