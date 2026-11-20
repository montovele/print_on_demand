# Print on Demand Platform

Monorepo inicial de la plataforma, con API Express/TypeScript, aplicación Vue 3 y persistencia MySQL.

## Requisitos

- Node.js 22 o superior
- npm 10 o superior
- MySQL instalado y ejecutándose localmente (sin Docker)

## Inicio local

1. Configura `.env` con la conexión a MySQL local. La base de datos configurada debe existir y el servicio MySQL debe estar iniciado.
2. Configura un `ENCRYPTION_KEY` de 32 bytes en hexadecimal. Puedes generarla con:

   ```powershell
   node -p "require('node:crypto').randomBytes(32).toString('hex')"
   ```

3. Ejecuta `npm.cmd install` en PowerShell de Windows.
4. Genera el cliente y aplica migraciones:

   ```powershell
   $databaseUrlLine = Get-Content .env | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
   if (-not $databaseUrlLine) { throw "No se encontró DATABASE_URL en .env" }
   $env:DATABASE_URL = ($databaseUrlLine -replace '^DATABASE_URL=', '').Trim().Trim('"')
   npm.cmd run db:generate
   npm.cmd exec --workspace @pod/api -- prisma migrate deploy
   ```

5. (Opcional) Define `SEED_EMAIL` y `SEED_PASSWORD` en `.env`, y ejecuta `npm.cmd run db:seed`.
6. Inicia cada aplicación en una terminal independiente:

   **Backend** (desde la raíz del proyecto):

   ```powershell
   npm.cmd start
   ```

   Este comando compila la API y la inicia en `http://localhost:4099`.

   **Frontend** (en una segunda terminal, desde la raíz):

   ```powershell
   npm.cmd run dev --workspace @pod/web
   ```

   El panel queda disponible en `http://localhost:5177`.

Si la API no alcanza MySQL, revisa `DATABASE_URL`, confirma que MySQL esté iniciado y que la base de datos indicada exista. El backend verifica la conexión a MySQL antes de escuchar en el puerto `4099` y muestra un mensaje de configuración si la base no está disponible. Redis aún no es necesario para los flujos implementados.

Si ya tenías una instalación anterior, aplica la migración aditiva de fabricación propia antes de reiniciar la API:

```powershell
$databaseUrlLine = Get-Content .env | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
if (-not $databaseUrlLine) { throw "No se encontró DATABASE_URL en .env" }
$env:DATABASE_URL = ($databaseUrlLine -replace '^DATABASE_URL=', '').Trim().Trim('"')
npm.cmd exec --workspace @pod/api prisma migrate deploy
npm.cmd start
```

Las migraciones conservan los datos e incorporan el flujo interno de producción, el diseñador de productos y los campos de guías UPS. Aplica las migraciones antes de reiniciar la API después de esta actualización. El bloque carga `DATABASE_URL` desde el `.env` raíz sin mostrarla en pantalla.

### Acceso de usuarios finales y pagos

La tienda para clientes usa cuentas independientes de las tiendas administrativas. Para habilitar la venta de stickers, configura `STOREFRONT_TENANT_ID` con el ID de la cuenta central activa, importa el catálogo desde **Productos**, asigna costo y precio a cada presentación y publica los productos. En **Productos** puedes publicar individualmente o en lote los artículos de fabricación propia que tengan al menos una variante, todas sus variantes con precio mayor que cero y al menos una variante en MXN; los artículos externos, archivados o incompletos no son elegibles. Las plantillas compatibles con compra en tienda incluyen ropa, tazas, termos, bolsas, cojines, rompecabezas, llaveros, placas fotográficas, mandiles, gorras, mouse pads y pósteres. Cada producto publicado con una plantilla compatible aparece como ficha individual, puede personalizarse y comprarse. Los demás tipos publicados aparecen en `/store` como “Próximamente”, sin opción de personalización ni compra hasta que se agregue una plantilla compatible. El checkout vuelve a comprobar precio y disponibilidad en el servidor. Los clientes pueden agregar artículos a la bolsa sin iniciar sesión; al continuar al pago inician sesión o crean una cuenta, y el arte guardado localmente se carga de forma privada antes de crear el pedido en Stripe.

El checkout consulta la tarifa UPS más económica para el destino y vuelve a validarla antes de crear la sesión de Stripe. En **Configuración → UPS · Envíos y rastreo** puedes ver qué datos del servidor faltan; no muestra ni almacena credenciales. Para habilitar cotizaciones configura `UPS_CLIENT_ID`, `UPS_CLIENT_SECRET`, `UPS_ACCOUNT_NUMBER` y el CP de origen. Para habilitar guías, agrega además nombre, teléfono, dirección, ciudad y estado del remitente, y establece las dimensiones y el peso reales del paquete (`UPS_PACKAGE_*`). Los valores iniciales de medidas en `.env.example` son solo de referencia; la compra de guías permanece bloqueada hasta que se definan explícitamente. Mantén las credenciales solo en el gestor de secretos o `.env`, nunca en el repositorio ni en el chat. `UPS_API_BASE_URL` acepta el endpoint de producción predeterminado o el de pruebas de UPS (`https://wwwcie.ups.com`).

Cuando todos los trabajos de fabricación de un pedido llegan a **Empacado**, un usuario puede comprar una guía UPS conjunta (hasta 30 paquetes); se solicita confirmación porque UPS cargará el envío a la cuenta configurada. La guía queda asociada al pedido y puede descargarse desde **Producción** o **Pedidos**. El cliente ve todos los números de paquete y sus enlaces de rastreo en el estado de su pedido. Desde Producción se actualizan los eventos de todos los paquetes; el pedido solo avanza a **Entregado** cuando UPS confirma la entrega de cada paquete. Si la compra devuelve un resultado incierto, el pedido queda bloqueado para evitar cargos duplicados: verifica primero en UPS y reconcilia todos los números de rastreo separados por comas. No vuelvas a comprar una guía hasta confirmar que la solicitud anterior no fue aceptada. Sin las credenciales o el CP de origen, las cotizaciones y el checkout fallan de forma explícita.

Al volver a agregar un producto publicado con la misma variante, opciones y diseño, la bolsa incrementa su cantidad en lugar de duplicar la línea. El arte del frente y de la parte trasera se conserva por separado; si cambia el diseño o alguna opción, se mantiene en una línea distinta para no asociar un archivo de impresión incorrecto. Se permiten hasta 30 unidades por pedido.

Configura también `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` en `.env`. En PowerShell de Windows, Stripe CLI puede reenviar los eventos al webhook:

```powershell
stripe.cmd listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired --forward-to localhost:4099/api/v1/payments/stripe/webhook
```

Mantén Stripe CLI escuchando durante las pruebas de pago. Usa el secreto de firma que Stripe CLI muestra como `STRIPE_WEBHOOK_SECRET` en el `.env` local y reinicia la API después de cambiarlo.

Para producción, registra un webhook desde **Stripe Dashboard → Developers → Webhooks → Add endpoint**. La URL debe ser HTTPS y apuntar al dominio público de la API con la ruta `/api/v1/payments/stripe/webhook` (no al dominio del frontend). Selecciona estos eventos:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Copia el secreto de firma de ese endpoint (`whsec_…`) a `STRIPE_WEBHOOK_SECRET` en el gestor de secretos del servidor; no uses el secreto generado por Stripe CLI en producción. Usa claves y endpoint del mismo modo (prueba o producción), reinicia la API después de actualizar la configuración y confirma que Stripe recibe respuestas HTTP 2xx. El webhook verifica la firma sobre el cuerpo original y actualiza el pedido; el retorno del navegador no confirma el pago. Antes de cobrar en producción, valida las tarifas y el paquete UPS con datos reales y prueba el flujo completo en modo de prueba de Stripe.

### Error de Prisma al iniciar

Si aparece `PrismaClientInitializationError`, revisa en este orden:

1. Confirma que el archivo `.env` exista en la raíz y contenga `DATABASE_URL`. No compartas su contenido, ya que incluye credenciales.
2. Comprueba que el servicio MySQL local esté iniciado y que la base de datos configurada exista.
3. Verifica que usuario, contraseña, host y puerto de `DATABASE_URL` coincidan con tu instancia local.
4. Aplica las migraciones existentes como se indica arriba y luego inicia el backend con `npm.cmd start`.

Si la base todavía no existe, créala desde MySQL Workbench o con un usuario que tenga permisos:

```sql
CREATE DATABASE IF NOT EXISTS print_on_demand;
```

## Funcionalidad implementada

- Registro e inicio de sesión con cookie `HttpOnly`, sesiones revocables en MySQL y protección CSRF para mutaciones autenticadas.
- Creación de tenant y aislamiento de productos, pedidos, proveedor y catálogo.
- Roles iniciales y permisos de lectura/edición.
- CRUD de productos, archivado lógico, snapshot básico de pedido y transiciones internas restringidas.
- Fabricación propia como modo predeterminado: equipos, materiales, recetas de consumo, cola de producción, control de etapas y registro de envíos con rastreo.
- Los pedidos con productos internos crean trabajos de producción automáticamente; el inventario se descuenta una sola vez al iniciar la fabricación y se valida contra existencias disponibles.
- Diseñador propio con plantillas de camisetas, sudaderas, tazas, termos, bolsas, cojines, rompecabezas, llaveros, placas fotográficas, mandiles, gorras, mouse pads, pósteres, fundas de teléfono y una plantilla plana personalizable.
- Editor de mockups con vistas visuales diferenciadas de frente/reverso, color, talla, método de impresión, imagen o texto, escala, rotación y posicionamiento; guarda el diseño y sus variantes como producto de fabricación propia. Al editar se pueden agregar o retirar combinaciones de color/talla y ajustar nombre, SKU, costo y precio por variante sin recrear el producto.
- El guardado del diseñador muestra progreso y errores; las solicitudes del frontend tienen un límite de 15 segundos para evitar que la interfaz espere indefinidamente cuando la API no responde.
- Exportación de mockups PNG desde el navegador. Los artes PNG, JPG y WebP se validan, se limitan a 5 MB/50 MP y se almacenan en archivos privados asociados al tenant.
- Sugerencia de precio basada en costo y margen objetivo.
- Catálogo y productos internos disponibles sin credenciales externas. Printful es opcional y solo se usa para productos marcados explícitamente con fulfillment externo.
- Panel responsive conectado a la API, registro manual de pedidos, gestión de productos y panel de atención al cliente con filtros por estado/prioridad.
- Tickets vinculables a pedidos y trabajos de producción, con historial de creación, comentarios, cambios de estado y prioridad atribuibles al usuario que los realizó.
- Reportes del dashboard para periodos de 7, 30 y 90 días: promedio de primera respuesta y resolución, cumplimiento de SLA y casos fuera de objetivo. Los objetivos iniciales son 4 horas para primera respuesta y 24 horas para resolución; los tickets recientes que aún no alcanzan el vencimiento se excluyen del porcentaje de cumplimiento.
- Panel administrativo para productos, pedidos, ventas, producción, soporte, SLA e integraciones de proveedores.
- Los pedidos pagados conservan snapshots de variante, diseño, dirección y arte; el detalle administrativo y la cola de producción muestran los datos necesarios para revisar y fabricar cada artículo.

Todavía no están implementados el versionado de diseños, la exportación de archivos de producción con perfiles reales de máquina, la publicación WooCommerce, la ingestión automática de pedidos externos, sincronización de envíos con Printful, billing SaaS y administración global. Los artes del diseñador de clientes se conservan de forma independiente para frente y reverso en el pedido; las plantillas son mockups visuales de referencia, por lo que las medidas y áreas imprimibles deben validarse para cada material y equipo antes de fabricar. El catálogo externo Printful requiere una cuenta conectada y no es necesario para la operación propia.

Las credenciales de Printful requieren `ENCRYPTION_KEY` de exactamente 32 bytes en hexadecimal y una credencial autorizada. Las rutas/API deben comprobarse en staging antes de activar órdenes reales.

## Comandos

- `npm.cmd start`: inicia solo el backend.
- `npm.cmd run dev --workspace @pod/web`: inicia solo el frontend.
- `npm.cmd run build`: compila ambos proyectos.
- `npm.cmd run typecheck`: valida tipos.
- `npm.cmd test`: ejecuta pruebas.
- `npm.cmd exec --workspace @pod/api -- prisma migrate deploy`: aplica las migraciones versionadas (carga primero `DATABASE_URL` desde `.env` como se indica arriba).
- `npm.cmd run db:seed`: crea cuenta de demo cuando se configuran sus variables.
