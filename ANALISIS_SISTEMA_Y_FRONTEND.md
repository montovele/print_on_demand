# Análisis del sistema y vistas del frontend

## 1. Resumen ejecutivo

Printly es una plataforma de operaciones para un negocio de impresión bajo demanda. El sistema reúne administración de productos, diseño de productos, pedidos, fabricación propia, inventario de materiales, atención al cliente y una integración opcional con Printful.

El estado actual está centrado en el **panel administrativo y de operación interna**. No hay una tienda accesible para compradores finales: sus pantallas, rutas frontend, registro de clientes y creación de checkouts fueron retirados o deshabilitados. Se conserva el modelo de datos relacionado con clientes y pedidos, así como la conciliación de pagos Stripe que ya existan. No se han eliminado registros ni migraciones de la base de datos.

## 2. Arquitectura actual

### Aplicaciones y tecnologías

- **Frontend:** Vue 3, TypeScript, Vite, Vue Router y Pinia.
- **API:** Node.js, Express 5 y TypeScript.
- **Persistencia:** MySQL mediante Prisma.
- **Estilos:** CSS propio, responsive, importado desde [`apps/web/src/styles.css`](./apps/web/src/styles.css).
- **Monorepo:** workspaces de npm para `apps/web` y `apps/api`.

El frontend crea la aplicación en [`apps/web/src/main.ts`](./apps/web/src/main.ts), instala Pinia y Vue Router y carga los estilos globales. La API agrupa sus rutas bajo `/api/v1` en [`apps/api/src/app.ts`](./apps/api/src/app.ts).

### Módulos funcionales de la API

| Módulo | Responsabilidad principal |
|---|---|
| `auth` | Inicio/cierre de sesión, sesión actual y registro inicial del espacio administrativo. |
| `catalog` | Consulta del catálogo propio y, si está configurado, catálogo externo. |
| `products` | CRUD, publicación y archivado de productos y variantes. |
| `designer` | Plantillas, carga/consulta/eliminación de artes. |
| `pricing` | Sugerencia de precio a partir del costo y el margen objetivo. |
| `orders` | Registro, consulta y cambios permitidos del estado de pedidos. |
| `production` | Cola de fabricación, equipos, inventario, recetas, movimientos y envíos. |
| `support` | Tickets, comentarios, filtros, métricas y SLA. |
| `providers` | Conexión y administración de cuentas de proveedores, actualmente Printful. |
| `payments` | Conciliación de sesiones Stripe preexistentes y recepción del webhook; no crea nuevos checkouts. |

El esquema Prisma en [`apps/api/prisma/schema.prisma`](./apps/api/prisma/schema.prisma) incluye usuarios, tenants y membresías, productos y variantes, artes, pedidos e ítems, trabajos e historial de producción, máquinas, materiales, proveedores y tickets/comentarios. Los pedidos guardan datos de cliente, importes, estado de pago y snapshots necesarios para su operación.

### Sesiones, permisos y seguridad

- La sesión usa una cookie `HttpOnly`, tokens almacenados en forma de hash y un token CSRF para mutaciones.
- El tenant activo se determina a partir de la sesión y la membresía, no de un identificador de tenant enviado libremente por el navegador.
- Roles del dominio: `owner`, `admin`, `editor`, `viewer` y `customer`. Las rutas de datos internos permiten roles del equipo; las mutaciones se restringen de acuerdo con su función.
- Solo `owner` y `admin` ven Atención al cliente y las métricas ejecutivas del dashboard. La conexión/desconexión de Printful también requiere uno de esos roles.
- El middleware de autenticación rechaza membresías `customer`. El inicio de sesión selecciona una membresía administrativa.
- El endpoint de registro administrativo (`/auth/register`) solo permite crear el primer tenant mientras no haya un tenant activo. No hay formulario de registro en el frontend.
- La API usa Helmet, CORS con credenciales, límite de solicitudes en autenticación, validación de cuerpos y errores estructurados con identificador de solicitud.

### Datos y procesos que se conservan

- Pedidos pueden registrarse manualmente y vincularse con productos.
- Un pedido asociado a productos de fabricación propia puede generar trabajos de producción.
- Los trabajos avanzan por etapas y pueden bloquearse, asignarse a equipos y registrar envío/rastreo.
- Las recetas relacionan productos con materiales; el inventario registra movimientos y alertas de bajo stock.
- Los tickets se pueden vincular a un pedido o a un trabajo de producción.
- Los webhooks Stripe siguen conciliando pagos de sesiones existentes. La API también ofrece verificación administrativa de una sesión asociada a un pedido.

## 3. Navegación y estructura del frontend

Las rutas activas están definidas en [`apps/web/src/router.ts`](./apps/web/src/router.ts):

| Ruta | Vista | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Pública para entrar al panel. |
| `/` | Resumen | Personal autenticado. |
| `/catalog` | Catálogo | Personal autenticado. |
| `/products` | Mis productos | Personal autenticado. |
| `/designer/:productId?` | Diseñador | Personal autenticado. |
| `/orders` | Pedidos | Personal autenticado. |
| `/support` | Atención al cliente | `owner` y `admin`. |
| `/production` | Producción | Personal autenticado. |
| `/settings` | Configuración | Personal autenticado. |

Las rutas desconocidas redirigen a `/`; las rutas internas sin sesión redirigen a `/login`. El layout autenticado [`DashboardLayout.vue`](./apps/web/src/layouts/DashboardLayout.vue) tiene barra lateral, espacio de trabajo activo, navegación, breadcrumb, usuario y botón de cierre de sesión. El enlace a soporte se muestra solo para `owner/admin`.

La autenticación y el estado de sesión frontend residen en [`apps/web/src/stores/auth.ts`](./apps/web/src/stores/auth.ts). El cliente compartido [`apps/web/src/services/api.ts`](./apps/web/src/services/api.ts) aplica la configuración HTTP, credenciales de sesión, CSRF y manejo común de errores.

## 4. Vistas del frontend y características

### 4.1 Inicio de sesión — [`LoginView.vue`](./apps/web/src/views/LoginView.vue)

- Formulario de correo y contraseña con validación HTML básica.
- Envía credenciales a la API; ante éxito abre el panel.
- Muestra errores de autenticación y de inicialización de sesión.
- No permite crear cuentas de clientes ni contiene un flujo público de compra.
- La creación del primer espacio de trabajo se realiza fuera de esta interfaz, mediante el endpoint administrativo de registro inicial.

### 4.2 Resumen — [`DashboardView.vue`](./apps/web/src/views/DashboardView.vue)

- Indicadores de productos, pedidos, ventas registradas y pedidos por atender.
- Accesos directos al catálogo, pedidos y soporte.
- Gráfico de ventas e indicadores de ingresos, cantidad de pedidos y ticket promedio, con rangos de 7, 30 y 90 días.
- Para `owner/admin`, consulta métricas de soporte: tiempos medios de primera respuesta y resolución, cumplimiento y casos fuera de SLA, además de actividad diaria de tickets.
- Presenta pedidos recientes y elementos que requieren seguimiento.
- Fuentes principales: `/products`, `/orders` y, para administradores, `/support/metrics`.
- **Consideración:** los pedidos se solicitan con `pageSize=100`; las métricas de venta calculadas en el navegador se basan en esa respuesta, no en un endpoint agregado independiente.

### 4.3 Catálogo — [`CatalogView.vue`](./apps/web/src/views/CatalogView.vue)

- Permite alternar entre productos de fabricación propia y el catálogo Printful opcional.
- Búsqueda por nombre, tarjetas de producto, imágenes, tipo y variantes disponibles.
- En fabricación propia, ofrece accesos para administrar o crear productos.
- Para Printful, permite elegir un producto, indicar costo, precio de venta y moneda, y crear un producto vinculado explícitamente al proveedor.
- Si Printful no está conectado, muestra el estado vacío y acceso a configuración.
- Fuentes principales: `/catalog/products`, `/products` y configuración de proveedores.

### 4.4 Mis productos — [`ProductsView.vue`](./apps/web/src/views/ProductsView.vue)

- Lista productos con imagen, proveedor o método de producción, variantes, costo, precio, margen estimado y estado.
- Formulario de alta manual con descripción, fabricación, tiempo estimado, notas, costo, precio y moneda.
- Solicita sugerencia de precio mediante costo y margen objetivo.
- Ofrece enlace al diseñador para productos propios, publicación/retiro de publicación y archivado lógico.
- La operación de archivar pide confirmación; los errores de API se muestran en la vista.
- Fuentes principales: `/products` y `/pricing/suggestion`.

### 4.5 Diseñador de productos — [`DesignerView.vue`](./apps/web/src/views/DesignerView.vue)

- Crea un producto propio desde plantillas de tipos de producto.
- Previsualiza el mockup y edita opciones visuales como color, lado, texto/arte, posición, escala y rotación.
- Permite mover el arte en la vista previa y descargar un mockup.
- Administra variantes de tamaño/color y sus campos, incluyendo SKU, costo y precio.
- Captura datos del producto y de fabricación; guarda como producto nuevo o actualiza el producto seleccionado desde Mis productos.
- Sube y elimina artes asociados al espacio de trabajo.
- Fuentes principales: `/designer/templates`, `/designer/artwork`, `/designer/assets/:id` y `/products`.
- La vista previa es una referencia visual; no representa por sí sola perfiles de máquina ni especificaciones finales de producción.

### 4.6 Pedidos — [`OrdersView.vue`](./apps/web/src/views/OrdersView.vue)

- Lista pedidos y permite expandir el detalle del cliente/envío, artículos e impresión, importes, pago y estado.
- Registra pedidos manuales con número, cliente, producto opcional, cantidad, precio, total y moneda.
- Elige estados de una lista de transiciones permitidas para el estado actual.
- Puede solicitar a Stripe la verificación de pago cuando el pedido está pendiente y cuenta con sesión asociada.
- Puede abrir un pedido desde un enlace contextual, por ejemplo, desde un ticket.
- Fuentes principales: `/orders`, `/products`, `/orders/:id/status` y `/payments/checkout/verify`.
- La creación de checkout para compradores no está disponible; los pedidos operativos se registran desde el panel o permanecen como datos históricos.

### 4.7 Producción — [`ProductionView.vue`](./apps/web/src/views/ProductionView.vue)

La vista ofrece tres secciones:

1. **Cola de producción:** trabajos activos, producto/pedido, cantidad, método y tiempo estimado, indicaciones/arte, asignación de máquina, avance de etapa y bloqueo con motivo. El envío registra paquetería y número de rastreo.
2. **Equipos:** alta de máquinas con tecnología y ubicación; estados activo, mantenimiento o inactivo.
3. **Materiales y recetas:** alta de materiales, existencias, punto de reposición y costo; ajuste/recepción de existencias e historial de movimientos; definición de consumo por producto.

Se muestran indicadores de equipos activos, inventario y materiales con bajo stock. Puede enfocarse en un trabajo recibido como contexto desde soporte. Fuentes principales: `/production/jobs`, `/production/machines`, `/production/materials`, movimientos y recetas.

### 4.8 Atención al cliente — [`SupportView.vue`](./apps/web/src/views/SupportView.vue)

- Vista administrativa de tickets, no portal de autoservicio para el cliente.
- Crea tickets y permite asociarlos opcionalmente a pedidos y trabajos de producción.
- Filtra la cola por estado y prioridad; selecciona tickets para ver detalle, actividad y comentarios.
- Agrega comentarios y cambia estado/prioridad.
- Carga comentarios anteriores cuando el ticket contiene historial paginado.
- Incluye accesos desde el ticket al pedido relacionado o al trabajo de producción.
- Presenta contexto de pedidos que requieren atención y trabajos listos para envío.
- Fuentes principales: `/support/tickets`, comentarios, `/orders`, `/production/jobs/summary` y resumen de tickets.
- Su acceso en frontend y métricas de soporte está reservado a `owner/admin`; el backend vuelve a validar los permisos.

### 4.9 Configuración — [`SettingsView.vue`](./apps/web/src/views/SettingsView.vue)

- Consulta las cuentas de proveedores POD.
- Permite conectar Printful con un token privado, que la API valida y almacena cifrado.
- Permite desconectar una cuenta tras confirmación.
- Muestra información general del aislamiento por espacio de trabajo.
- No configura una tienda pública ni tarifa de envío; ese flujo se retiró junto con el checkout.
- Fuentes principales: `/providers/accounts`, `/providers/printful/connect` y `/providers/accounts/:id`.

## 5. Componentes y utilidades compartidos

- [`PageHeader.vue`](./apps/web/src/components/PageHeader.vue): encabezado de página con título, descripción y acciones opcionales.
- [`StatusBadge.vue`](./apps/web/src/components/StatusBadge.vue): presentación común de estados de productos, pedidos, tickets y producción.
- [`ArtworkImage.vue`](./apps/web/src/components/ArtworkImage.vue): visualización de artes/imágenes protegidos y su estado de carga.
- [`money.ts`](./apps/web/src/utils/money.ts): formato de importes para la interfaz.
- [`types.ts`](./apps/web/src/types.ts): contratos TypeScript compartidos de productos, pedidos, tickets, roles y métricas.

## 6. Flujos de usuario final desactivados y datos conservados

Actualmente no existen vistas de tienda, acceso/registro de clientes, diseñador de compra, historial de pedidos del comprador ni proceso de checkout. La API tampoco expone las rutas anteriores de tienda o registro de cliente y rechaza sesiones de rol `customer`.

La desactivación es de **funcionalidad**, no una eliminación destructiva del modelo: roles heredados, relaciones de pedidos, migraciones y registros existentes se conservan. Esto permite decidir más adelante qué reconstruir sin perder el contexto histórico. Las opciones de compra no deben considerarse activas aunque el catálogo administrativo permita publicar productos.

## 7. Observaciones y límites actuales

- El dashboard agrega métricas comerciales a partir de los pedidos cargados por el frontend; para conjuntos mayores al límite de consulta convendría un endpoint agregado con paginación o periodo explícito.
- El catálogo Printful depende de una cuenta válida y de la disponibilidad del proveedor; la fabricación propia no depende de esa integración.
- El registro administrativo solo sirve para el bootstrap del primer tenant y no se presenta en Login.
- Stripe permanece para webhooks y verificación administrativa de pagos existentes; no hay una acción de compra que genere nuevas sesiones checkout.
- La barra superior muestra un indicador visual de conexión, pero no es en sí misma un monitor de salud de la API.
- Los formularios de producción usan algunos diálogos nativos del navegador para cantidades, motivos y rastreo.
- El frontend aplica guardas de navegación como ayuda de experiencia; los permisos efectivos dependen de la autorización de cada ruta API.

## 8. Verificación del estado documentado

En la revisión actual se ejecutaron correctamente:

- `npm.cmd run typecheck`
- `npm.cmd test` — 35 pruebas aprobadas en API y frontend.
- `npm.cmd run build`
