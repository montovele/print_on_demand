# Especificación técnica: plataforma Print on Demand con Vue 3 y Express

**Versión:** 1.0\
**Fecha:** noviembre de 2026\
**Objetivo:** definir la arquitectura, estructura de carpetas, módulos,
API, base de datos y fases de desarrollo para construir una plataforma
web de impresión bajo demanda (Print on Demand o POD), inspirada en el
flujo comercial de Printful.

> **Alcance:** este documento define una plataforma propia para que
> vendedores administren productos personalizados, diseños, tiendas y
> pedidos, conectándose inicialmente con Printful como proveedor de
> fabricación y fulfillment. No contempla construir fábricas ni replicar
> la infraestructura logística de Printful.

------------------------------------------------------------------------

## 1. Visión general del producto

La plataforma permitirá que un usuario:

1.  Cree una cuenta y configure su perfil comercial.
2.  Conecte una cuenta o tienda de un proveedor POD.
3.  Explore productos, variantes y técnicas de personalización.
4.  Suba diseños y los aplique a productos.
5.  Genere mockups e imágenes comerciales.
6.  Defina precios de venta y márgenes.
7.  Publique o sincronice productos con una tienda.
8.  Reciba y administre pedidos.
9.  Envíe órdenes al proveedor para fabricación.
10. Consulte estados, costos, envíos y rastreo.

### 1.1 Modelo de negocio

La plataforma puede monetizarse mediante:

-   Suscripción mensual por vendedor.
-   Planes con límites de productos, tiendas o pedidos.
-   Comisión por pedido procesado.
-   Servicios adicionales de diseño, configuración y administración.
-   Integraciones premium.

La plataforma no debe asumir que el proveedor procesa gratuitamente los
pedidos. El costo de fabricación, impresión, envío, impuestos y
comisiones debe registrarse por separado.

### 1.2 Actores

  -----------------------------------------------------------------------
  Actor                               Responsabilidades
  ----------------------------------- -----------------------------------
  Visitante                           Consulta información comercial y
                                      planes

  Vendedor                            Administra sus diseños, productos,
                                      tiendas y pedidos

  Administrador SaaS                  Administra usuarios, planes,
                                      proveedores y soporte

  Proveedor POD                       Proporciona catálogo, fabricación,
                                      fulfillment y tracking

  Tienda externa                      Recibe productos y genera ventas

  Cliente final                       Compra productos en la tienda del
                                      vendedor
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 2. Arquitectura tecnológica

### 2.1 Stack propuesto

  Capa                Tecnología
  ------------------- --------------------------------------------------------
  Frontend            Vue 3 + Vite
  Lenguaje frontend   JavaScript o TypeScript
  Estado global       Pinia
  Enrutamiento        Vue Router
  Peticiones HTTP     Axios o Fetch
  Formularios         Validación con Zod o equivalente
  Backend             Node.js + Express
  Lenguaje backend    JavaScript ESM o TypeScript
  Base de datos       MySQL 8
  Acceso a datos      Prisma, Knex o mysql2
  Autenticación       Sesión segura o JWT con refresh token
  Archivos            Almacenamiento S3 compatible
  Imágenes            Servicio de transformación o procesamiento de imágenes
  Tareas asíncronas   Redis + BullMQ
  Comunicación        REST API + Webhooks
  Pruebas             Vitest, Supertest y pruebas de integración
  Despliegue          Nginx + PM2 + HTTPS

**Recomendación:** utilizar TypeScript en ambos proyectos si se inicia
desde cero. Si el proyecto ya está desarrollado en JavaScript ESM,
mantener ese estándar y aplicar validación de datos y contratos
consistentes.

### 2.2 Diagrama de componentes

``` mermaid
flowchart TB
    U[Usuario / Vendedor] --> FE[Frontend Vue 3]
    FE --> API[Backend Express]
    API --> DB[(MySQL)]
    API --> REDIS[(Redis / BullMQ)]
    API --> STORAGE[Almacenamiento de archivos]
    API --> AUTH[Autenticación y permisos]
    API --> POD[Adaptador de proveedores POD]
    POD --> PF[Printful API]
    POD --> P2[Otros proveedores futuros]
    API --> SHOP[Adaptadores de tiendas]
    SHOP --> WC[WooCommerce]
    SHOP --> SH[Shopify futuro]
    PF --> WH[Webhooks de proveedor]
    WC --> WH
    WH --> API
    REDIS --> WORKER[Workers de pedidos y sincronización]
    WORKER --> POD
    WORKER --> SHOP
```

### 2.3 Principios de arquitectura

-   El frontend nunca se comunica directamente con las API privadas de
    proveedores.
-   Las credenciales y tokens se almacenan exclusivamente en el backend.
-   Cada vendedor solo puede consultar y modificar sus propios recursos.
-   Los proveedores se integran mediante adaptadores independientes.
-   Las operaciones lentas se procesan mediante colas.
-   Los webhooks deben ser idempotentes y verificables.
-   Los costos originales del proveedor y los precios de venta se
    conservan como datos separados.
-   Las operaciones críticas deben guardar un registro de auditoría.

------------------------------------------------------------------------

## 3. Estructura de carpetas

Se recomienda un repositorio con dos aplicaciones independientes.

``` text
pod-platform/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── catalog/
│   │   │   ├── designer/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   └── dashboard/
│   │   ├── layouts/
│   │   │   ├── PublicLayout.vue
│   │   │   └── DashboardLayout.vue
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── catalog/
│   │   │   ├── designer/
│   │   │   ├── products/
│   │   │   ├── pricing/
│   │   │   ├── stores/
│   │   │   ├── orders/
│   │   │   ├── billing/
│   │   │   └── settings/
│   │   ├── router/
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── auth.service.js
│   │   ├── stores/
│   │   ├── composables/
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.vue
│   │   └── main.js
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── tenants/
│   │   │   ├── providers/
│   │   │   ├── catalog/
│   │   │   ├── designs/
│   │   │   ├── mockups/
│   │   │   ├── products/
│   │   │   ├── pricing/
│   │   │   ├── stores/
│   │   │   ├── orders/
│   │   │   ├── fulfillment/
│   │   │   ├── shipping/
│   │   │   ├── billing/
│   │   │   ├── webhooks/
│   │   │   ├── notifications/
│   │   │   └── admin/
│   │   ├── integrations/
│   │   │   ├── providers/
│   │   │   │   ├── provider.interface.js
│   │   │   │   └── printful/
│   │   │   │       ├── printful.client.js
│   │   │   │       ├── printful.adapter.js
│   │   │   │       ├── printful.mapper.js
│   │   │   │       └── printful.webhooks.js
│   │   │   └── ecommerce/
│   │   │       └── woocommerce/
│   │   ├── jobs/
│   │   ├── queues/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   └── deployment.md
├── docker-compose.yml
└── README.md
```

Cada módulo del backend debe mantener, como mínimo, responsabilidades
separadas:

``` text
orders/
├── order.routes.js
├── order.controller.js
├── order.service.js
├── order.repository.js
├── order.validation.js
└── order.test.js
```

-   **Routes:** declara endpoints y middlewares.
-   **Controller:** traduce HTTP a llamadas de servicio.
-   **Service:** aplica reglas de negocio.
-   **Repository:** consulta y modifica la base de datos.
-   **Validation:** valida parámetros y payloads.
-   **Tests:** verifica reglas y escenarios.

------------------------------------------------------------------------

## 4. Estructura de páginas del frontend

### 4.1 Sitio público

  Ruta               Vista               Objetivo
  ------------------ ------------------- ---------------------------------
  `/`                LandingPage         Explicar la plataforma
  `/como-funciona`   HowItWorksPage      Explicar el proceso
  `/catalogo`        PublicCatalogPage   Mostrar categorías de productos
  `/precios`         PricingPage         Mostrar planes
  `/integraciones`   IntegrationsPage    Mostrar proveedores y tiendas
  `/ayuda`           HelpPage            Centro de ayuda
  `/login`           LoginPage           Acceso
  `/registro`        RegisterPage        Alta de vendedor

### 4.2 Panel del vendedor

  Ruta                   Vista               Funcionalidad
  ---------------------- ------------------- ------------------------
  `/app`                 DashboardPage       Resumen comercial
  `/app/catalogo`        CatalogPage         Explorar catálogo
  `/app/disenador`       DesignerPage        Crear diseño
  `/app/productos`       ProductsPage        Productos propios
  `/app/productos/:id`   ProductDetailPage   Editar producto
  `/app/precios`         PricingPage         Configurar márgenes
  `/app/tiendas`         StoresPage          Conectar tiendas
  `/app/pedidos`         OrdersPage          Administrar pedidos
  `/app/pedidos/:id`     OrderDetailPage     Ver detalle y tracking
  `/app/proveedores`     ProvidersPage       Conectar proveedores
  `/app/facturacion`     BillingPage         Suscripción y pagos
  `/app/configuracion`   SettingsPage        Datos y preferencias

### 4.3 Panel administrativo

-   `/admin`
-   `/admin/usuarios`
-   `/admin/proveedores`
-   `/admin/productos`
-   `/admin/pedidos`
-   `/admin/planes`
-   `/admin/suscripciones`
-   `/admin/logs`
-   `/admin/configuracion`

Las rutas administrativas deben estar protegidas por permisos del
servidor. Ocultar enlaces en Vue no es un control de seguridad.

------------------------------------------------------------------------

## 5. Diseño de la interfaz

### 5.1 Landing page

Secciones recomendadas:

1.  Header con logotipo, navegación y acceso.
2.  Hero con propuesta de valor y CTA.
3.  Productos destacados.
4.  Explicación del modelo Print on Demand.
5.  Pasos para comenzar.
6.  Ventajas de la plataforma.
7.  Proveedores e integraciones.
8.  Ejemplos de tiendas y productos.
9.  Planes y precios.
10. Preguntas frecuentes.
11. CTA final.
12. Footer con información legal y contacto.

### 5.2 Dashboard

Indicadores principales:

-   Ventas brutas.
-   Pedidos recibidos.
-   Pedidos pendientes de envío.
-   Productos publicados.
-   Costo de producción.
-   Costo de envío.
-   Margen bruto estimado.
-   Pedidos con incidencias.

Gráficas sugeridas:

-   Ventas por periodo.
-   Pedidos por estado.
-   Productos más vendidos.
-   Margen por producto.
-   Costos por proveedor.

No mostrar ventas o utilidades como datos reales si aún no existen
movimientos. Usar estados vacíos y datos de demostración claramente
identificados.

### 5.3 Catálogo

Cada tarjeta de producto debe mostrar:

-   Imagen.
-   Nombre.
-   Categoría.
-   Proveedor.
-   Precio base, si está disponible.
-   Variantes.
-   Técnicas de impresión.
-   Botón para personalizar.

Filtros:

-   Categoría.
-   Proveedor.
-   Tipo de producto.
-   Técnica de impresión.
-   Rango de precio.
-   Disponibilidad por región.

### 5.4 Diseñador de productos

El editor debe permitir:

-   Subir imágenes PNG, JPG y SVG bajo validaciones estrictas.
-   Posicionar, escalar y rotar el diseño.
-   Seleccionar color y variante.
-   Elegir área de impresión.
-   Previsualizar el resultado.
-   Guardar versiones del diseño.
-   Generar mockups.
-   Consultar advertencias de resolución y área imprimible.

**Importante:** el editor visual del navegador no sustituye las
plantillas, áreas imprimibles ni validaciones del proveedor. El backend
debe enviar los archivos y posiciones en el formato exigido por cada
proveedor.

### 5.5 Pedidos

La tabla debe incluir:

-   Número de pedido interno.
-   Tienda de origen.
-   Cliente o referencia de compra.
-   Fecha.
-   Total cobrado al cliente.
-   Costo del proveedor.
-   Estado interno.
-   Estado del fulfillment.
-   Número de rastreo.

------------------------------------------------------------------------

## 6. Modelo de datos MySQL

El sistema debe ser multiusuario y estar preparado para múltiples
vendedores. Se recomienda una estrategia multi-tenant lógica: todas las
entidades comerciales deben asociarse a `tenant_id` y las consultas
deben verificarlo.

### 6.1 Tablas principales

  Tabla                         Propósito
  ----------------------------- ---------------------------------------
  `users`                       Usuarios y credenciales
  `tenants`                     Espacios comerciales o cuentas
  `tenant_users`                Usuarios, roles y permisos por cuenta
  `plans`                       Planes disponibles
  `subscriptions`               Suscripciones
  `provider_accounts`           Cuentas conectadas de proveedores
  `provider_tokens`             Credenciales cifradas
  `provider_products`           Catálogo externo normalizado
  `provider_variants`           Variantes externas
  `designs`                     Diseños del vendedor
  `design_files`                Archivos y versiones
  `mockups`                     Imágenes generadas
  `products`                    Productos comerciales propios
  `product_variants`            Variantes publicables
  `product_provider_mappings`   Relación producto interno/proveedor
  `stores`                      Tiendas externas
  `store_products`              Productos publicados en tiendas
  `orders`                      Pedidos internos
  `order_items`                 Partidas de pedido
  `fulfillments`                Solicitudes de fabricación
  `shipments`                   Envíos y rastreo
  `webhook_events`              Eventos recibidos
  `sync_jobs`                   Historial de sincronización
  `audit_logs`                  Auditoría
  `notifications`               Notificaciones

### 6.2 Relaciones principales

``` mermaid
erDiagram
    USERS ||--o{ TENANT_USERS : pertenece
    TENANTS ||--o{ TENANT_USERS : contiene
    TENANTS ||--o{ PROVIDER_ACCOUNTS : conecta
    TENANTS ||--o{ STORES : administra
    TENANTS ||--o{ DESIGNS : crea
    TENANTS ||--o{ PRODUCTS : posee
    PRODUCTS ||--o{ PRODUCT_VARIANTS : contiene
    PRODUCTS ||--o{ PRODUCT_PROVIDER_MAPPINGS : relaciona
    DESIGNS ||--o{ DESIGN_FILES : contiene
    PRODUCTS ||--o{ STORE_PRODUCTS : publica
    STORES ||--o{ STORE_PRODUCTS : contiene
    STORES ||--o{ ORDERS : recibe
    ORDERS ||--o{ ORDER_ITEMS : contiene
    ORDERS ||--o{ FULFILLMENTS : procesa
    FULFILLMENTS ||--o{ SHIPMENTS : genera
```

### 6.3 Campos importantes

**`tenants`**

-   `id`
-   `name`
-   `slug`
-   `status`
-   `created_at`
-   `updated_at`

**`provider_accounts`**

-   `id`
-   `tenant_id`
-   `provider_code`
-   `external_account_id`
-   `display_name`
-   `connection_status`
-   `created_at`
-   `updated_at`

**`provider_tokens`**

-   `id`
-   `provider_account_id`
-   `access_token_encrypted`
-   `refresh_token_encrypted`, si aplica
-   `expires_at`
-   `scopes`
-   `updated_at`

Los tokens nunca deben devolverse en endpoints de frontend ni
almacenarse en texto plano.

**`products`**

-   `id`
-   `tenant_id`
-   `name`
-   `description`
-   `status`
-   `base_cost`
-   `default_sale_price`
-   `currency`
-   `created_at`
-   `updated_at`

**`product_variants`**

-   `id`
-   `product_id`
-   `provider_variant_id`
-   `sku`
-   `size`
-   `color`
-   `sale_price`
-   `provider_cost`
-   `currency`
-   `status`

**`orders`**

-   `id`
-   `tenant_id`
-   `store_id`
-   `external_order_id`
-   `order_number`
-   `currency`
-   `customer_total`
-   `provider_total`
-   `shipping_cost`
-   `tax_total`
-   `status`
-   `payment_status`
-   `created_at`
-   `updated_at`

**`fulfillments`**

-   `id`
-   `order_id`
-   `provider_account_id`
-   `external_fulfillment_id`
-   `status`
-   `submitted_at`
-   `accepted_at`
-   `completed_at`
-   `error_message`

### 6.4 Reglas de integridad

-   Usar claves foráneas donde corresponda.
-   Crear índices para `tenant_id`, `status`, fechas e identificadores
    externos.
-   Crear restricciones únicas para identificadores externos dentro de
    su proveedor o tienda.
-   Utilizar `DECIMAL`, no `FLOAT`, para importes monetarios.
-   Guardar moneda explícitamente en cada operación.
-   Guardar snapshots del costo y precio al momento de la venta.
-   Evitar eliminar físicamente pedidos y registros financieros.
-   Registrar cambios de estado con fecha y origen.
-   Definir políticas de retención y eliminación de datos personales.

------------------------------------------------------------------------

## 7. API REST de Express

Prefijo recomendado: `/api/v1`.

### 7.1 Autenticación

  Método   Endpoint                  Acción
  -------- ------------------------- --------------------------
  POST     `/auth/register`          Crear cuenta
  POST     `/auth/login`             Iniciar sesión
  POST     `/auth/refresh`           Renovar sesión/token
  POST     `/auth/logout`            Cerrar sesión
  GET      `/auth/me`                Consultar usuario actual
  POST     `/auth/forgot-password`   Solicitar recuperación
  POST     `/auth/reset-password`    Restablecer contraseña

### 7.2 Proveedores

  ----------------------------------------------------------------------------------
  Método                  Endpoint                           Acción
  ----------------------- ---------------------------------- -----------------------
  GET                     `/providers`                       Listar proveedores
                                                             soportados

  GET                     `/providers/accounts`              Listar conexiones del
                                                             tenant

  POST                    `/providers/printful/connect`      Iniciar conexión OAuth
                                                             o token privado

  GET                     `/providers/printful/callback`     Recibir callback OAuth

  DELETE                  `/providers/accounts/:id`          Desconectar cuenta

  GET                     `/providers/accounts/:id/status`   Consultar estado
  ----------------------------------------------------------------------------------

El flujo OAuth debe usar `state` aleatorio, validación del callback y
los mecanismos de autorización que establezca Printful. No implementar
OAuth suponiendo endpoints o parámetros sin verificar la documentación
vigente.

### 7.3 Catálogo

  Método   Endpoint                           Acción
  -------- ---------------------------------- --------------------------
  GET      `/catalog/categories`              Categorías
  GET      `/catalog/products`                Catálogo normalizado
  GET      `/catalog/products/:id`            Detalle
  GET      `/catalog/products/:id/variants`   Variantes
  POST     `/catalog/sync`                    Solicitar sincronización
  GET      `/catalog/sync/:jobId`             Consultar progreso

### 7.4 Diseños y mockups

  Método   Endpoint               Acción
  -------- ---------------------- ---------------------
  GET      `/designs`             Listar diseños
  POST     `/designs`             Crear diseño
  GET      `/designs/:id`         Consultar diseño
  PATCH    `/designs/:id`         Actualizar diseño
  DELETE   `/designs/:id`         Archivar diseño
  POST     `/designs/:id/files`   Subir archivo
  POST     `/mockups`             Solicitar mockup
  GET      `/mockups/:id`         Consultar resultado

### 7.5 Productos

  Método   Endpoint                      Acción
  -------- ----------------------------- --------------------------
  GET      `/products`                   Listar productos propios
  POST     `/products`                   Crear producto
  GET      `/products/:id`               Detalle
  PATCH    `/products/:id`               Actualizar
  DELETE   `/products/:id`               Archivar
  POST     `/products/:id/publish`       Publicar
  POST     `/products/:id/sync`          Sincronizar
  GET      `/products/:id/sync-status`   Estado de sincronización

### 7.6 Tiendas

  Método   Endpoint                        Acción
  -------- ------------------------------- -------------------------
  GET      `/stores`                       Listar tiendas
  POST     `/stores/woocommerce/connect`   Conectar WooCommerce
  POST     `/stores/:id/test`              Probar conexión
  DELETE   `/stores/:id`                   Desconectar
  GET      `/stores/:id/products`          Productos sincronizados

### 7.7 Pedidos y fulfillment

  Método   Endpoint                     Acción
  -------- ---------------------------- -----------------------
  GET      `/orders`                    Listar pedidos
  POST     `/orders`                    Registrar pedido
  GET      `/orders/:id`                Consultar pedido
  POST     `/orders/:id/submit`         Enviar a proveedor
  POST     `/orders/:id/cancel`         Solicitar cancelación
  GET      `/orders/:id/fulfillments`   Consultar fabricación
  GET      `/orders/:id/shipments`      Consultar envíos
  GET      `/orders/:id/tracking`       Consultar rastreo

### 7.8 Webhooks

  Método   Endpoint                  Acción
  -------- ------------------------- -----------------------------
  POST     `/webhooks/printful`      Recibir eventos Printful
  POST     `/webhooks/woocommerce`   Recibir eventos WooCommerce

Los webhooks no deben exigir la sesión normal del usuario. Deben validar
la autenticidad mediante el mecanismo documentado por cada proveedor,
guardar el evento y procesarlo de manera idempotente.

------------------------------------------------------------------------

## 8. Integración con Printful

### 8.1 Patrón de adaptador

No acoplar los servicios del negocio directamente a Printful. Definir un
contrato común para permitir otros proveedores.

Ejemplo conceptual:

``` javascript
export class ProviderAdapter {
  async getCatalog() {
    throw new Error('Not implemented');
  }

  async getProduct(productId) {
    throw new Error('Not implemented');
  }

  async getVariants(productId) {
    throw new Error('Not implemented');
  }

  async createMockup(payload) {
    throw new Error('Not implemented');
  }

  async createOrder(payload) {
    throw new Error('Not implemented');
  }

  async getOrder(externalOrderId) {
    throw new Error('Not implemented');
  }

  async cancelOrder(externalOrderId) {
    throw new Error('Not implemented');
  }
}
```

El adaptador de Printful implementará únicamente las operaciones que
realmente soporte la API para el tipo de tienda y autorización
conectada.

### 8.2 Cliente HTTP

Responsabilidades:

-   Construir peticiones a la API oficial.
-   Adjuntar autenticación.
-   Aplicar timeout.
-   Interpretar errores.
-   Respetar límites de peticiones.
-   Registrar trazas sin exponer credenciales.
-   Reintentar únicamente operaciones seguras o idempotentes.
-   Normalizar respuestas.

No asumir que todos los endpoints aceptan el mismo esquema de
autenticación ni que todos los productos tienen los mismos atributos.

### 8.3 Flujo de catálogo

1.  El vendedor conecta su cuenta.
2.  El backend consulta el catálogo disponible.
3.  Se normalizan categorías, productos y variantes.
4.  Se guardan referencias externas.
5.  El frontend muestra el catálogo.
6.  El vendedor selecciona un producto.
7.  Se consultan las opciones de personalización.
8.  Se crea un producto comercial interno.

El catálogo externo debe conservar el identificador original del
proveedor. No utilizar el ID interno como sustituto.

### 8.4 Flujo de diseño y mockup

1.  El vendedor selecciona un producto y variante.
2.  Sube un archivo.
3.  El backend valida tamaño, extensión, MIME real y dimensiones.
4.  Se almacena el original en almacenamiento privado.
5.  Se genera una versión optimizada para vista previa.
6.  Se consulta o genera el mockup mediante el proveedor, cuando esté
    disponible.
7.  Se almacena el resultado y su referencia externa.
8.  El producto queda listo para revisión y publicación.

### 8.5 Flujo de pedido

1.  La tienda genera una compra.
2.  El backend recibe el pedido mediante webhook o sincronización.
3.  Se valida que el pedido no exista previamente.
4.  Se guardan el pedido y sus partidas.
5.  Se comprueba que cada partida tenga variante y diseño válidos.
6.  Se calcula el costo estimado del proveedor.
7.  Se solicita confirmación o se aplica la regla de autorización
    configurada.
8.  Se envía la orden al proveedor.
9.  Se guarda el ID externo y la respuesta.
10. Se reciben cambios de estado.
11. Se actualiza fulfillment y tracking.
12. Se notifica al vendedor.

**Regla crítica:** nunca enviar dos veces una misma orden por un
reintento automático. Implementar una clave de idempotencia interna y
verificar el estado externo antes de repetir una operación cuyo
resultado sea incierto.

### 8.6 Documentación oficial

-   API: https://developers.printful.com/docs/
-   Portal de desarrolladores: https://developers.printful.com/
-   Sitio comercial: https://www.printful.com/es

Antes de programar cada endpoint, confirmar en la documentación vigente
su ruta, método, permisos, esquema de autenticación, límites y
compatibilidad con el tipo de tienda conectado.

------------------------------------------------------------------------

## 9. Motor de precios y márgenes

Separar los siguientes conceptos:

-   Costo de fabricación.
-   Costo de impresión o personalización.
-   Costo de envío.
-   Impuestos.
-   Comisión de pasarela de pago.
-   Comisión de la plataforma.
-   Precio de venta.
-   Margen y utilidad estimada.

### 9.1 Fórmula básica

``` text
Costo total =
  fabricación
  + personalización
  + envío
  + impuestos no recuperables
  + comisiones aplicables

Utilidad estimada =
  ingreso de venta
  - costo total
  - comisión de plataforma
  - comisión de pago
  - otros gastos variables
```

Si se desea calcular un precio con margen sobre el precio de venta:

``` text
Precio = Costo / (1 - MargenDeseado)
```

Ejemplo ilustrativo:

-   Costo total: \$200 MXN.
-   Margen objetivo sobre venta: 40%.
-   Precio sugerido: \$333.33 MXN.

El cálculo real debe considerar moneda, conversión cambiaria, impuestos
y redondeos. Mostrar siempre si el margen es bruto, de contribución o
neto estimado.

### 9.2 Reglas de precios

-   No modificar el costo histórico de un pedido cuando cambie el
    catálogo.
-   Registrar moneda de origen y tipo de cambio aplicado.
-   Permitir margen global y ajustes por producto.
-   Alertar si el precio de venta queda por debajo del costo total.
-   Actualizar costos mediante sincronización, sin sobrescribir
    snapshots históricos.
-   No presentar una cotización como precio definitivo si el proveedor
    aún no confirma envío o impuestos.

------------------------------------------------------------------------

## 10. Seguridad y protección de datos

### 10.1 Autenticación y autorización

-   Contraseñas con Argon2id o bcrypt con parámetros adecuados.
-   Cookies `HttpOnly`, `Secure` y `SameSite` cuando se use sesión
    basada en cookies.
-   Protección CSRF para operaciones autenticadas con cookies.
-   Refresh tokens rotatorios si se usa JWT.
-   Roles: `owner`, `admin`, `editor`, `viewer`.
-   Middleware de autorización por tenant.
-   Rate limiting para login, recuperación y endpoints sensibles.

### 10.2 Archivos

-   Validar contenido real, no solo extensión.
-   Limitar tamaño y dimensiones.
-   Rechazar archivos ejecutables.
-   Analizar archivos cuando la infraestructura lo permita.
-   Usar nombres internos aleatorios.
-   Guardar archivos originales en almacenamiento privado.
-   Servir descargas mediante URLs firmadas de corta duración.
-   No aceptar URLs remotas arbitrarias sin controles contra SSRF.

### 10.3 Integraciones

-   Cifrar tokens en reposo.
-   Mantener secretos fuera del repositorio.
-   Rotar credenciales comprometidas.
-   Validar firma o mecanismo de autenticidad de webhooks.
-   No registrar tokens, datos completos de pago ni información personal
    innecesaria.
-   Restringir permisos OAuth al mínimo necesario.
-   Permitir desconectar y revocar cuentas.

### 10.4 Multi-tenant

Toda consulta debe limitarse al tenant autenticado. No confiar en un
`tenant_id` recibido desde el navegador.

Ejemplo conceptual:

``` javascript
const tenantId = req.auth.tenantId;

const product = await productRepository.findOne({
  id: req.params.id,
  tenantId
});

if (!product) {
  return res.status(404).json({
    message: 'Producto no encontrado'
  });
}
```

El backend debe derivar el tenant desde la identidad y permisos
verificados.

------------------------------------------------------------------------

## 11. Procesos asíncronos y sincronización

Utilizar Redis + BullMQ o una solución equivalente para:

-   Sincronizar catálogos.
-   Generar mockups.
-   Procesar imágenes.
-   Publicar productos.
-   Importar pedidos.
-   Enviar órdenes al proveedor.
-   Consultar estados.
-   Actualizar tracking.
-   Enviar notificaciones.

Cada tarea debe incluir:

-   ID de trabajo.
-   Tenant.
-   Tipo de operación.
-   Recurso afectado.
-   Número de intentos.
-   Estado.
-   Fecha de creación y finalización.
-   Error normalizado.
-   Referencia externa, cuando aplique.

Implementar backoff exponencial, límites de reintentos, cola de errores
y mecanismos de recuperación manual.

No mantener una petición HTTP abierta mientras se genera un mockup o se
sincroniza un catálogo grande. Devolver un `jobId` y ofrecer un endpoint
de consulta de progreso.

------------------------------------------------------------------------

## 12. Estados de productos y pedidos

### 12.1 Productos

Estados internos sugeridos:

-   `draft`
-   `processing`
-   `ready`
-   `published`
-   `sync_error`
-   `archived`

El estado interno debe distinguirse del estado de publicación que
reporte la tienda externa.

### 12.2 Pedidos

Estados internos sugeridos:

-   `received`
-   `validation_pending`
-   `awaiting_approval`
-   `submitted`
-   `accepted`
-   `in_production`
-   `shipped`
-   `delivered`
-   `cancel_requested`
-   `cancelled`
-   `failed`
-   `action_required`

No asumir que los estados del proveedor coinciden exactamente con estos.
Crear un mapper de estados externos a estados internos y conservar el
estado original recibido.

------------------------------------------------------------------------

## 13. Experiencia de usuario y diseño responsive

### 13.1 Lineamientos visuales

-   Interfaz limpia y profesional.
-   Navegación lateral en escritorio.
-   Navegación compacta en móvil.
-   Catálogo con tarjetas visuales.
-   Editor con área de trabajo central y panel de propiedades.
-   Tablas con filtros, paginación y estados visibles.
-   Formularios con validación inmediata.
-   Confirmación antes de acciones irreversibles.
-   Mensajes de error que indiquen cómo resolver el problema.

### 13.2 Componentes reutilizables

``` text
components/
├── common/
│   ├── AppButton.vue
│   ├── AppInput.vue
│   ├── AppModal.vue
│   ├── AppBadge.vue
│   ├── AppAlert.vue
│   ├── AppPagination.vue
│   └── AppEmptyState.vue
├── catalog/
│   ├── ProductCard.vue
│   ├── ProductFilters.vue
│   └── VariantSelector.vue
├── designer/
│   ├── DesignCanvas.vue
│   ├── DesignToolbar.vue
│   ├── LayerPanel.vue
│   └── PrintAreaGuide.vue
├── orders/
│   ├── OrderTable.vue
│   ├── OrderStatus.vue
│   └── TrackingTimeline.vue
└── layout/
    ├── AppSidebar.vue
    ├── AppHeader.vue
    └── AppBreadcrumbs.vue
```

### 13.3 Pinia

Stores recomendados:

-   `useAuthStore`
-   `useTenantStore`
-   `useCatalogStore`
-   `useDesignStore`
-   `useProductsStore`
-   `useStoresStore`
-   `useOrdersStore`
-   `useBillingStore`
-   `useNotificationsStore`

No guardar tokens privados de proveedores en Pinia ni en `localStorage`.

------------------------------------------------------------------------

## 14. Variables de entorno

### 14.1 Backend `.env.example`

``` dotenv
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:5173
API_URL=http://localhost:3001

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=pod_platform
DB_USER=pod_user
DB_PASSWORD=

SESSION_SECRET=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ENCRYPTION_KEY=

REDIS_URL=redis://127.0.0.1:6379

PRINTFUL_CLIENT_ID=
PRINTFUL_CLIENT_SECRET=
PRINTFUL_REDIRECT_URI=http://localhost:3001/api/v1/providers/printful/callback

STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

LOG_LEVEL=debug
```

Los nombres de variables son una propuesta interna. Configurar las
credenciales según el método de autenticación habilitado por Printful.
No subir archivos `.env` al repositorio.

### 14.2 Frontend `.env.example`

``` dotenv
VITE_API_URL=http://localhost:3001/api/v1
```

Solo deben incluirse variables públicas. Nunca colocar claves privadas
de Printful, contraseñas o secretos en variables `VITE_`.

------------------------------------------------------------------------

## 15. Pruebas y criterios de calidad

### 15.1 Backend

Pruebas unitarias:

-   Cálculo de precio y margen.
-   Validación de variantes.
-   Mapeo de estados.
-   Permisos por tenant.
-   Normalización de errores externos.

Pruebas de integración:

-   Registro e inicio de sesión.
-   Conexión simulada con proveedor.
-   Importación de catálogo.
-   Creación de producto.
-   Recepción de webhook.
-   Registro de pedido.
-   Envío idempotente de orden.
-   Actualización de tracking.

### 15.2 Frontend

-   Navegación y rutas protegidas.
-   Formularios.
-   Estados de carga y error.
-   Catálogo y filtros.
-   Editor de diseño.
-   Responsive.
-   Accesibilidad básica.
-   Manejo de sesión expirada.

### 15.3 Criterios de aceptación del MVP

-   Un usuario puede registrarse e iniciar sesión.
-   Un tenant no puede acceder a datos de otro.
-   Se puede conectar al menos una cuenta de Printful.
-   Se puede consultar el catálogo y sus variantes.
-   Se puede subir y guardar un diseño.
-   Se puede crear un producto interno.
-   Se puede calcular un precio sugerido.
-   Se puede conectar una tienda WooCommerce de prueba.
-   Se puede recibir un pedido sin duplicarlo.
-   Se puede enviar una orden al proveedor con confirmación.
-   Se puede consultar el estado y tracking.
-   Los errores de proveedor quedan registrados y pueden recuperarse.
-   Los secretos no aparecen en el navegador ni en logs.

------------------------------------------------------------------------

## 16. Plan de desarrollo por fases

### Fase 1: Fundamentos

-   Crear repositorio y proyectos.
-   Configurar Vue 3, Express y MySQL.
-   Crear migraciones.
-   Implementar autenticación.
-   Implementar tenants y roles.
-   Crear layout público y dashboard.

**Entregable:** plataforma base con usuarios y panel protegido.

### Fase 2: Proveedores y catálogo

-   Crear interfaz común de proveedores.
-   Implementar conexión con Printful.
-   Consultar catálogo.
-   Normalizar productos y variantes.
-   Crear sincronización por trabajos.

**Entregable:** catálogo consultable desde el panel.

### Fase 3: Diseños y productos

-   Subida segura de archivos.
-   Gestión de diseños.
-   Editor visual inicial.
-   Integración de mockups.
-   Productos internos y variantes.
-   Motor de precios.

**Entregable:** productos personalizados listos para publicar.

### Fase 4: Tiendas y pedidos

-   Integración inicial con WooCommerce.
-   Publicación de productos.
-   Recepción de pedidos.
-   Validación de partidas.
-   Envío a Printful.
-   Webhooks y tracking.

**Entregable:** flujo de venta y fulfillment de extremo a extremo.

### Fase 5: SaaS y monetización

-   Planes y límites.
-   Suscripciones.
-   Facturación.
-   Panel administrativo.
-   Métricas.
-   Notificaciones.
-   Auditoría y soporte.

**Entregable:** primera versión comercial multiusuario.

### Fase 6: Escalabilidad

-   Segundo proveedor POD.
-   Más plataformas ecommerce.
-   Mejoras del editor.
-   Automatización de recuperación.
-   Analítica avanzada.
-   Optimización de colas y almacenamiento.

**Entregable:** plataforma multi-proveedor extensible.

------------------------------------------------------------------------

## 17. Prioridad recomendada del MVP

No desarrollar todas las funciones al mismo tiempo. El primer objetivo
debe ser comprobar que un vendedor puede conectar una cuenta,
seleccionar un producto, personalizarlo y procesar una orden real de
prueba.

  Prioridad   Funcionalidad               MVP
  ----------- --------------------------- ---------------------------
  P0          Registro, login y tenants   Sí
  P0          Conexión Printful           Sí
  P0          Consulta de catálogo        Sí
  P0          Variantes                   Sí
  P0          Subida de diseño            Sí
  P0          Creación de producto        Sí
  P0          Cálculo de precio           Sí
  P0          Pedidos y fulfillment       Sí
  P0          Webhooks e idempotencia     Sí
  P1          WooCommerce                 Sí, si será canal inicial
  P1          Mockups avanzados           Básico
  P1          Suscripciones               Después de validar flujo
  P2          Segundo proveedor           No
  P2          Shopify                     No
  P2          Editor avanzado             No
  P2          Analítica avanzada          No

------------------------------------------------------------------------

## 18. Riesgos y decisiones que deben resolverse

Antes de iniciar el desarrollo, documentar estas decisiones:

1.  ¿La plataforma será para una sola tienda propia o para múltiples
    vendedores?
2.  ¿Cada vendedor conectará su propia cuenta de Printful?
3.  ¿La primera tienda externa será WooCommerce?
4.  ¿El pedido se enviará automáticamente o requerirá aprobación?
5.  ¿La plataforma cobrará una suscripción, una comisión o ambas?
6.  ¿Qué monedas y mercados se atenderán inicialmente?
7.  ¿Dónde se almacenarán los diseños y mockups?
8.  ¿Quién será responsable de atención al cliente, devoluciones y
    reembolsos?
9.  ¿Cómo se manejarán diferencias entre el precio estimado y el costo
    final de envío?
10. ¿Qué obligaciones fiscales y de privacidad aplican en los mercados
    objetivo?

### Riesgos técnicos

-   Cambios en API y límites del proveedor.
-   Diferencias de catálogo por región.
-   Variantes que dejan de estar disponibles.
-   Errores o retrasos en webhooks.
-   Pedidos duplicados.
-   Costos de envío variables.
-   Fallas de sincronización con WooCommerce.
-   Archivos de diseño inválidos.
-   Exposición de credenciales.
-   Acceso cruzado entre tenants.

Cada riesgo debe tener responsable, mecanismo de detección y
procedimiento de recuperación.

------------------------------------------------------------------------

## 19. Definición de terminado

Una funcionalidad se considera terminada cuando:

-   Tiene validación frontend y backend.
-   Verifica autenticación y permisos.
-   Respeta el aislamiento por tenant.
-   Maneja estados de carga, éxito y error.
-   Registra errores útiles sin filtrar secretos.
-   Tiene pruebas automatizadas relevantes.
-   Está documentada.
-   Se probó con datos de prueba.
-   No rompe las funcionalidades existentes.
-   Tiene migración reversible cuando modifica el esquema de base de
    datos.

------------------------------------------------------------------------

## 20. Recursos oficiales

-   Printful: https://www.printful.com/es
-   Documentación de API: https://developers.printful.com/docs/
-   Vue 3: https://vuejs.org/
-   Vite: https://vite.dev/
-   Pinia: https://pinia.vuejs.org/
-   Vue Router: https://router.vuejs.org/
-   Express: https://expressjs.com/
-   MySQL: https://dev.mysql.com/doc/
-   BullMQ: https://docs.bullmq.io/
-   WooCommerce REST API:
    https://woocommerce.github.io/woocommerce-rest-api-docs/

------------------------------------------------------------------------

## Resultado esperado

Al completar el proyecto se tendrá una plataforma web SaaS de Print on
Demand con:

-   Sitio comercial público.
-   Panel de vendedores.
-   Catálogo de productos.
-   Diseñador y gestión de archivos.
-   Generación de mockups.
-   Motor de precios y márgenes.
-   Conexión con Printful.
-   Integración inicial con WooCommerce.
-   Gestión de pedidos, fabricación y envíos.
-   Arquitectura multi-tenant.
-   Base preparada para agregar otros proveedores.

**Principio rector:** construir primero un flujo de venta completo y
confiable con un solo proveedor. Después convertirlo en una plataforma
multi-proveedor, sin acoplar las reglas del negocio a la API de
Printful.
