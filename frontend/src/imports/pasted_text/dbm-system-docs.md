# SISTEMA INTELIGENTE DE GESTIÓN — DBM MATERIALES Y ACABADOS

Quiero desarrollar un sistema web profesional para mi negocio:

**DBM Materiales y Acabados**

Es un local dedicado a la venta de materiales de construcción livianos y acabados.

El sistema debe combinar:

* Gestión de inventario.
* Compras.
* Ventas.
* Clientes.
* Proveedores.
* Proformas.
* Reportes.
* Control de movimientos.
* Análisis de ventas.
* Recomendación inteligente de compras.
* Un agente de IA conectado a los datos reales del negocio.
* Búsqueda semántica mediante embeddings.
* Preparación para predicción de demanda.

El objetivo es construir una herramienta que realmente pueda utilizar DBM para administrar el negocio y tomar mejores decisiones.

---

# 1. IDENTIDAD VISUAL

El sistema debe utilizar como referencia visual el logotipo proporcionado de **DBM Materiales y Acabados**.

La identidad visual debe basarse aproximadamente en:

### Azul oscuro principal

HEX:

`#1D2647`

RGB aproximado:

`29, 38, 71`

Utilizarlo principalmente para:

* Sidebar.
* Encabezados.
* Navbar.
* Fondos principales.
* Elementos de navegación.
* Secciones importantes.

### Naranja principal

HEX:

`#ED871B`

RGB aproximado:

`237, 135, 27`

Utilizarlo para:

* Botones principales.
* CTA.
* Elementos seleccionados.
* Indicadores importantes.
* Iconos destacados.
* Estados de acción.
* Gráficos destacados.
* Elementos relacionados con recomendaciones de IA.

### Blanco

HEX:

`#FFFFFF`

Utilizarlo para:

* Textos sobre azul.
* Tarjetas.
* Fondos de contenido cuando corresponda.
* Contraste.

### Grises

Utilizar una escala de grises neutros para:

* Fondos secundarios.
* Bordes.
* Tablas.
* Formularios.
* Texto secundario.
* Estados inactivos.

NO utilizar colores aleatorios que rompan la identidad visual.

El diseño debe transmitir:

* Profesionalismo.
* Confianza.
* Tecnología.
* Organización.
* Construcción.
* Modernidad.

No quiero que parezca un software genérico de contabilidad.

Debe sentirse como un sistema desarrollado específicamente para:

**DBM Materiales y Acabados.**

---

# 2. DASHBOARD PRINCIPAL

La primera pantalla después del inicio de sesión debe ser un dashboard.

Debe mostrar claramente:

### Resumen del negocio

* Ventas del día.
* Ventas del mes.
* Compras del mes.
* Valor del inventario.
* Número de productos.
* Productos con stock crítico.
* Proformas pendientes.

### Indicadores

Mostrar tarjetas como:

**Ventas del mes**

$XX,XXX

**Inventario**

$XX,XXX

**Productos con stock bajo**

XX

**Proformas pendientes**

XX

### Gráficos

Mostrar:

* Evolución de ventas.
* Productos más vendidos.
* Categorías con mayor venta.
* Evolución del inventario.

---

# 3. INVENTARIO

Crear un módulo completo de inventario.

Cada producto debe tener:

* Código/SKU.
* Nombre.
* Categoría.
* Subcategoría.
* Marca.
* Descripción.
* Unidad de medida.
* Precio de compra.
* Precio de venta.
* Stock actual.
* Stock mínimo.
* Stock máximo.
* Proveedor principal.
* Proveedores alternativos.
* Ubicación.
* Estado.
* Fecha de creación.
* Fecha de actualización.

Debe permitir diferentes unidades:

* Unidad.
* Metro.
* Metro cuadrado.
* Caja.
* Paquete.
* Plancha.
* Rollo.
* Kilogramo.
* Litro.

---

# 4. PRODUCTOS ESPECÍFICOS

El negocio comercializa diferentes tipos de materiales.

Ejemplos:

* Duelas.
* PVC.
* Paneles.
* Perfiles.
* Cielos rasos.
* Cornisas.
* Molduras.
* Accesorios.
* Tornillos.
* Adhesivos.
* Herramientas.
* Materiales de acabado.

No todos los productos deben tener los mismos atributos.

Por ejemplo, una duela puede tener:

* Longitud.
* Ancho.
* Espesor.
* Color.
* Diseño.
* Marca.
* Material.
* Presentación.

El sistema debe permitir atributos específicos por categoría.

---

# 5. MOVIMIENTOS DE INVENTARIO

Todo cambio de stock debe generar un movimiento.

Tipos:

* Compra.
* Venta.
* Devolución.
* Ajuste positivo.
* Ajuste negativo.
* Pérdida.
* Daño.
* Inventario inicial.

Guardar:

* Producto.
* Cantidad.
* Fecha.
* Usuario.
* Motivo.
* Documento relacionado.
* Precio.
* Observaciones.

NO permitir modificar el stock directamente sin generar el movimiento correspondiente.

---

# 6. COMPRAS

Crear módulo de compras.

Registrar:

* Proveedor.
* Fecha.
* Factura.
* Productos.
* Cantidades.
* Precio.
* Descuento.
* IVA.
* Total.
* Forma de pago.
* Estado.
* Observaciones.

Al confirmar la compra:

**actualizar automáticamente el inventario.**

---

# 7. VENTAS

Crear módulo de ventas rápido.

Debe permitir:

* Buscar producto.
* Consultar stock.
* Agregar producto.
* Definir cantidad.
* Aplicar descuento.
* Calcular subtotal.
* Calcular IVA.
* Calcular total.
* Seleccionar cliente.
* Seleccionar forma de pago.

Al confirmar:

**descontar automáticamente el inventario.**

No permitir vender más unidades de las disponibles, excepto si el administrador habilita ventas bajo pedido.

---

# 8. CLIENTES

Registrar:

* Nombre/Razón social.
* Cédula/RUC.
* Teléfono.
* Correo.
* Dirección.
* Tipo de cliente.
* Historial de compras.

Mostrar:

* Total comprado.
* Número de compras.
* Última compra.

---

# 9. PROVEEDORES

Registrar:

* Nombre.
* RUC.
* Contacto.
* Teléfono.
* Correo.
* Dirección.
* Productos.
* Precios.
* Tiempo de entrega.

El sistema debe almacenar historial para posteriormente ayudar al agente a determinar qué proveedor conviene utilizar.

---

# 10. PROFORMAS

Crear un módulo profesional de proformas.

La proforma debe contener:

* Logo de DBM.
* Nombre: DBM Materiales y Acabados.
* Datos del negocio.
* Número de proforma.
* Fecha.
* Fecha de vencimiento.
* Cliente.
* Productos.
* Cantidad.
* Precio unitario.
* Descuento.
* Subtotal.
* IVA.
* Total.
* Condiciones.
* Observaciones.

Debe poder:

* Crear.
* Editar.
* Duplicar.
* Descargar PDF.
* Imprimir.
* Convertir a venta.

Una proforma NO debe modificar el inventario.

Cuando se convierta en venta, sí debe actualizarse el inventario.

---

# 11. AGENTE INTELIGENTE DBM

Crear una sección llamada:

**Asistente DBM**

Debe permitir conversar con un agente de IA.

El agente debe consultar información real de la base de datos.

Ejemplos:

"¿Cuánto stock tenemos de duela PVC blanca?"

"¿Qué productos están bajos?"

"¿Qué se vendió más este mes?"

"¿Qué productos no se han vendido?"

"¿Cuánto vendimos esta semana?"

"¿Qué productos debo comprar?"

"¿Cuánto debería comprar?"

"¿Qué proveedor me conviene?"

"¿Cuánto dinero necesito para reponer inventario?"

"¿Qué productos están sobreinventariados?"

---

# 12. RECOMENDACIÓN DE COMPRAS

Esta es una de las funcionalidades principales del sistema.

El agente debe poder responder:

**"¿Qué debo pedir el próximo mes?"**

Para responder debe analizar:

* Stock actual.
* Ventas históricas.
* Promedio de ventas.
* Tendencia.
* Stock mínimo.
* Stock máximo.
* Tiempo de reposición.
* Stock de seguridad.
* Compras pendientes.
* Pedidos pendientes.
* Estacionalidad cuando exista.

No limitarse a decir:

"Compra 50 unidades."

Debe explicar:

* Producto.
* Cantidad recomendada.
* Motivo.
* Demanda promedio.
* Stock actual.
* Cobertura estimada.
* Prioridad.
* Proveedor recomendado.
* Costo estimado.

---

# 13. EJEMPLO DE RECOMENDACIÓN

Si pregunto:

**"¿Qué debemos pedir para septiembre?"**

El agente podría responder:

### Recomendación de compra

**1. Duela PVC blanca**

* Stock actual: 35
* Venta promedio mensual: 82
* Tendencia: creciente
* Stock de seguridad: 25
* Cantidad recomendada: 90
* Prioridad: ALTA
* Proveedor recomendado: Proveedor X
* Inversión estimada: $XXX

**Motivo:**
El consumo de este producto ha aumentado durante los últimos meses y el inventario actual no cubre adecuadamente el período de reposición.

Al final:

**Inversión total recomendada: $X,XXX**

Y permitir:

**"Generar propuesta de compra"**

---

# 14. EMBEDDINGS

Implementar embeddings para búsquedas semánticas.

Ejemplo:

El usuario escribe:

"Necesito algo parecido a una duela blanca para techo."

El sistema debe poder encontrar productos relacionados aunque no coincidan exactamente las palabras.

También utilizar embeddings para:

* Catálogos.
* Fichas técnicas.
* Descripciones.
* Documentos de proveedores.
* Manuales.
* Información técnica.
* Productos similares.

Sin embargo:

**NO utilizar embeddings para consultar stock, precios o ventas.**

Los datos estructurados deben consultarse directamente desde la base de datos.

---

# 15. RAG

Preparar arquitectura RAG para que el agente pueda consultar documentos relacionados con DBM.

Por ejemplo:

* Catálogos de proveedores.
* Fichas técnicas.
* Listas de precios.
* Documentos internos.
* Políticas comerciales.

El agente debe poder responder utilizando esos documentos cuando corresponda.

---

# 16. HERRAMIENTAS DEL AGENTE

El agente debe utilizar herramientas controladas.

Ejemplos:

`consultar_stock()`

`buscar_productos()`

`consultar_ventas()`

`consultar_compras()`

`consultar_proveedores()`

`analizar_rotacion()`

`detectar_stock_bajo()`

`calcular_reposicion()`

`recomendar_compras()`

`generar_resumen_ventas()`

`buscar_documentacion()`

No darle acceso SQL completamente libre.

Las operaciones que modifiquen información deben requerir confirmación.

---

# 17. ALERTAS

Crear alertas para:

* Stock crítico.
* Stock bajo.
* Producto agotado.
* Producto sin movimiento.
* Sobreinventario.
* Incremento de demanda.
* Disminución de demanda.
* Proforma próxima a vencer.
* Retraso de proveedor.

---

# 18. PANTALLAS

Crear como mínimo:

1. Login.
2. Dashboard.
3. Inventario.
4. Productos.
5. Movimientos.
6. Compras.
7. Ventas.
8. Clientes.
9. Proveedores.
10. Proformas.
11. Reportes.
12. Asistente DBM.
13. Configuración.
14. Usuarios y roles.

---

# 19. NAVEGACIÓN

El sidebar debe utilizar el azul oscuro de DBM.

Ejemplo:

Dashboard

📦 Inventario

🛒 Ventas

📋 Proformas

🚚 Compras

👥 Clientes

🏭 Proveedores

📊 Reportes

🤖 Asistente DBM

⚙️ Configuración

El elemento seleccionado puede utilizar el naranja de la marca.

---

# 20. EXPERIENCIA VISUAL

La interfaz debe ser moderna y profesional.

Utilizar:

* Bordes ligeramente redondeados.
* Tarjetas limpias.
* Tablas profesionales.
* Espaciado consistente.
* Iconografía sencilla.
* Tipografía moderna.
* Jerarquía visual clara.
* Estados mediante etiquetas.
* Diseño responsive.

Evitar:

* Exceso de colores.
* Gradientes innecesarios.
* Animaciones excesivas.
* Diseño infantil.
* Elementos visuales que distraigan.
* Apariencia de plantilla genérica.

La identidad debe estar basada principalmente en:

**Azul oscuro + naranja + blanco + grises.**

---

# 21. IDENTIDAD DEL AGENTE

El agente debe llamarse:

**Asistente DBM**

Su propósito es ayudar al personal de DBM a:

* Consultar información.
* Analizar ventas.
* Analizar inventario.
* Detectar problemas.
* Recomendar compras.
* Encontrar productos.
* Analizar proveedores.
* Tomar decisiones.

Debe hablar de manera clara y empresarial.

Por ejemplo:

"Encontré 8 productos con stock crítico."

"Te recomiendo priorizar la compra de estos 4 productos."

"El principal motivo es el incremento de la demanda durante los últimos tres meses."

No debe inventar datos.

---

# 22. ARQUITECTURA

Antes de programar:

1. Analizar requerimientos.
2. Proponer arquitectura.
3. Diseñar base de datos.
4. Crear diagrama entidad-relación.
5. Definir API.
6. Definir frontend.
7. Definir backend.
8. Definir arquitectura del agente.
9. Definir herramientas del agente.
10. Definir embeddings.
11. Definir RAG.
12. Definir algoritmo de recomendación de compras.
13. Definir roles.
14. Definir permisos.
15. Definir flujo de ventas.
16. Definir flujo de compras.
17. Definir flujo de proformas.

NO comenzar directamente programando.

Primero presentar la arquitectura y explicar las decisiones técnicas.

Después desarrollar el sistema por módulos.

---

# OBJETIVO FINAL

Quiero que el resultado sea un sistema real para:

# DBM Materiales y Acabados

No quiero únicamente un sistema de inventario.

Quiero construir una plataforma donde pueda decir:

**"Asistente DBM, ¿qué debería pedir el próximo mes?"**

y el sistema analice automáticamente el inventario, las ventas históricas, la rotación, la demanda, los proveedores y los tiempos de reposición para entregar una recomendación fundamentada.

El sistema debe convertir los datos del negocio en información útil para tomar decisiones.

La prioridad es:

1. Integridad del inventario.
2. Ventas y compras.
3. Proformas.
4. Historial de datos.
5. Agente inteligente.
6. Recomendación de compras.
7. Búsqueda semántica.
8. RAG.
9. Predicción de demanda.
