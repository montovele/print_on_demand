# Análisis de la vista Diseñador — modo administrador

**Fecha:** 14 de noviembre de 2026  
**Vista:** `http://localhost:5177/designer`  
**Alcance:** recorrido visual y funcional de la sesión autenticada con permisos de administrador/propietario, más revisión del código de la vista. No se guardó ningún producto ni se subieron archivos.

## Resumen ejecutivo

La vista organiza bien la creación de productos en cuatro etapas y ofrece una vista previa inmediata, herramientas de personalización, variantes con precios diferenciados y exportación PNG. El flujo principal se entiende y se adaptó al ancho móvil probado.

El principal riesgo de uso observado es que seleccionar un color para **previsualizarlo** también lo incluye en el producto y genera sus variantes. La vista presenta la previsualización y la selección de colores incluidos como controles separados, por lo que este efecto puede aumentar accidentalmente el catálogo y el trabajo de revisión. También conviene mejorar la orientación sobre la fidelidad del mockup y facilitar el acceso a las acciones al final del formulario largo.

## Observaciones verificadas

- La sesión autenticada muestra la navegación administrativa. El control de Atención al cliente se presenta para los roles `owner` y `admin`; la ruta del diseñador forma parte del área de personal.
- El diseñador carga 11 plantillas, entre ellas camisetas, sudadera, taza, termo, tote, cojín, póster, fundas de teléfono y dos opciones de etiquetas.
- La plantilla inicial muestra una camiseta con frente/reverso, área imprimible delimitada, controles de posición y escala, colores, tallas y costo/precio por variante.
- El producto de ejemplo inicia con seis tallas y seis variantes para un color. Al elegir “Negro” en “Color de vista previa”, la cuenta pasó de 6 a 12 variantes. Al quitar “Negro” de “Colores incluidos en el producto”, volvió a 6 y la vista previa regresó a blanco. No se guardaron esos cambios.
- Cambiar la plantilla a taza y volver a camiseta actualizó la selección de plantilla correctamente.
- En una ventana de 390 px de ancho no se observó desbordamiento horizontal. La interfaz apila la vista previa y el panel de controles en pantallas estrechas.
- El formulario valida nombre comercial y campos numéricos; limita el arte a PNG/JPG/WebP de hasta 5 MB, advierte si la imagen mide menos de 1000 px en alguno de sus lados y bloquea el guardado por encima de 100 variantes.

## Hallazgos y recomendaciones

### 1. La previsualización de color añade variantes al producto — prioridad alta

El botón rotulado como “Color de vista previa” llama a una función que, además de cambiar el color mostrado, añade ese color a los colores seleccionados del producto. En la prueba, previsualizar negro duplicó las seis variantes de camiseta.

**Impacto:** puede crear SKU y precios adicionales sin que el usuario haya decidido ofrecer ese color.

**Recomendación:** separar estrictamente el color de la maqueta de los colores incluidos, o cambiar el rótulo y solicitar una acción explícita para agregar el color al producto. No modificar la selección de variantes al cambiar solo la vista previa.

**Referencia:** [DesignerView.vue](./apps/web/src/views/DesignerView.vue), `choosePreviewColor` (línea 229) y `toggleProductColor` (línea 234).

### 2. La maqueta puede confundirse con una prueba de impresión — prioridad media

La camiseta inicial presenta una marca de verificación dentro del área imprimible aunque no se haya cargado arte ni escrito texto. La ilustración SVG ayuda a orientar, pero no comunica por sí sola si representa escala real, color de impresión o acabado del producto.

**Impacto:** puede crear expectativas incorrectas sobre el resultado fabricado y dejar dudas sobre qué se exporta o se guardará.

**Recomendación:** reemplazar la marca por un estado vacío explícito (“Tu diseño aparecerá aquí”) y señalar que la imagen es una maqueta orientativa, no una prueba de color/impresión. Mantener la delimitación del área imprimible, que sí es clara.

### 3. Flujo largo y lista de variantes con desplazamiento interno — prioridad media

Los cuatro bloques de controles se apilan en una columna en pantallas estrechas. La lista de variantes tiene además un máximo de 430 px y su propio desplazamiento, dentro de una página que también requiere desplazamiento vertical; las acciones de guardar y descargar quedan al final.

**Impacto:** cuesta mantener el contexto al editar muchas variantes y puede ser difícil volver a encontrar las acciones principales.

**Recomendación:** valorar una lista resumida o secciones plegables para variantes, además de mantener una acción “Guardar” accesible al desplazarse. Conservar visible el contador de variantes y el error del límite.

**Referencia:** [styles.css](./apps/web/src/styles.css), layout del diseñador y `.variant-edit-list` (línea 289).

### 4. No se indica si hay cambios sin guardar — prioridad media

El guardado es manual y aparece al final del formulario. No se observó un indicador de cambios pendientes ni una confirmación ante la navegación a otra sección.

**Impacto:** abandonar la vista por accidente puede perder la configuración de diseño, precios y variantes.

**Recomendación:** añadir estado “Cambios sin guardar” y advertir antes de abandonar cuando el formulario esté modificado; evitar advertencias si no hubo cambios.

### 5. El estado activo de frente/reverso es solo visual — prioridad baja

Los botones indican la cara activa mediante una clase visual, pero no exponen un estado presionado para tecnologías de asistencia.

**Recomendación:** añadir `aria-pressed` al selector de frente/reverso y comprobar contraste/foco visible. Los controles deslizantes de posición son una alternativa por teclado al arrastre del diseño.

**Referencia:** [DesignerView.vue](./apps/web/src/views/DesignerView.vue), selector de cara en la vista previa.

## Aspectos positivos

- La división “Producto base”, “Personaliza”, “Variantes y precios” y “Datos del producto” hace legible el flujo y permite ver el progreso.
- La vista previa muestra el color y la cara seleccionada, y el área imprimible está claramente demarcada.
- Se ofrecen controles de posición, escala, rotación y centrado; el arrastre no es la única forma de ajustar la ubicación.
- Se distinguen el costo interno y el precio final por variante, con una explicación de qué precio ve el cliente.
- La carga de arte contempla formatos permitidos, tamaño máximo, aviso de resolución baja y mensajes de error.
- La adaptación responsive comprobada evita el desbordamiento horizontal en el ancho probado.

## Cierre

La vista ofrece una base funcional sólida para crear productos imprimibles. Conviene atender primero la separación entre color de previsualización y colores ofertados; después, aclarar el carácter orientativo de la maqueta y reducir la fricción de una página extensa. La revisión fue de solo lectura y de interacciones reversibles en el navegador; no se validó el guardado contra la base de datos ni la exportación descargando un archivo.
