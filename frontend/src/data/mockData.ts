export const kpiData = {
  ventasHoy: 1847.50,
  ventasMes: 28340.00,
  comprasMes: 14200.00,
  valorInventario: 87650.00,
  totalProductos: 312,
  stockCritico: 8,
  proformasPendientes: 5,
};

export const ventasMensuales = [
  { mes: 'Feb', ventas: 18200, compras: 9800 },
  { mes: 'Mar', ventas: 21500, compras: 12400 },
  { mes: 'Abr', ventas: 19800, compras: 11200 },
  { mes: 'May', ventas: 24300, compras: 13100 },
  { mes: 'Jun', ventas: 22700, compras: 10900 },
  { mes: 'Jul', ventas: 26100, compras: 14800 },
  { mes: 'Ago', ventas: 28340, compras: 14200 },
];

export const productosMasVendidos = [
  { nombre: 'Duela PVC Blanca', unidades: 320 },
  { nombre: 'Panel Cielo Raso', unidades: 248 },
  { nombre: 'Perfil Aluminio 3m', unidades: 195 },
  { nombre: 'Cornisa MDF', unidades: 162 },
  { nombre: 'Moldura Madera', unidades: 138 },
];

export const categorias = [
  { nombre: 'Duelas y PVC', valor: 35 },
  { nombre: 'Cielos Rasos', valor: 22 },
  { nombre: 'Perfiles', valor: 18 },
  { nombre: 'Acabados', valor: 15 },
  { nombre: 'Accesorios', valor: 10 },
];

export const productos = [
  { id: 'P001', sku: 'DPV-BL-01', nombre: 'Duela PVC Blanca 10cm', categoria: 'Duelas y PVC', marca: 'DecorPlast', unidad: 'Metro', precioCompra: 2.80, precioVenta: 4.50, stock: 35, stockMin: 50, stockMax: 300, estado: 'crítico', proveedor: 'ImportPlast S.A.' },
  { id: 'P002', sku: 'DPV-WD-01', nombre: 'Duela PVC Roble 10cm', categoria: 'Duelas y PVC', marca: 'DecorPlast', unidad: 'Metro', precioCompra: 3.20, precioVenta: 5.20, stock: 180, stockMin: 60, stockMax: 350, estado: 'normal', proveedor: 'ImportPlast S.A.' },
  { id: 'P003', sku: 'PCR-BL-01', nombre: 'Panel Cielo Raso Blanco 60x60', categoria: 'Cielos Rasos', marca: 'ArmaCielo', unidad: 'Unidad', precioCompra: 1.90, precioVenta: 3.20, stock: 420, stockMin: 100, stockMax: 600, estado: 'normal', proveedor: 'Techos & Cielos Cía.' },
  { id: 'P004', sku: 'PFA-AL-01', nombre: 'Perfil Aluminio Omega 3m', categoria: 'Perfiles', marca: 'AlumMax', unidad: 'Unidad', precioCompra: 4.50, precioVenta: 7.80, stock: 22, stockMin: 30, stockMax: 200, estado: 'bajo', proveedor: 'AlumMax Ecuador' },
  { id: 'P005', sku: 'COR-MDF-01', nombre: 'Cornisa MDF 8cm', categoria: 'Acabados', marca: 'MaderoFino', unidad: 'Metro', precioCompra: 1.60, precioVenta: 2.80, stock: 215, stockMin: 80, stockMax: 400, estado: 'normal', proveedor: 'MaderoFino S.A.' },
  { id: 'P006', sku: 'MOL-MD-01', nombre: 'Moldura Madera Colonial', categoria: 'Acabados', marca: 'MaderoFino', unidad: 'Metro', precioCompra: 1.20, precioVenta: 2.10, stock: 8, stockMin: 40, stockMax: 250, estado: 'crítico', proveedor: 'MaderoFino S.A.' },
  { id: 'P007', sku: 'TOR-ACR-01', nombre: 'Tornillo Autoperf. 3/4"', categoria: 'Accesorios', marca: 'Ferretero', unidad: 'Caja', precioCompra: 3.50, precioVenta: 5.80, stock: 95, stockMin: 20, stockMax: 150, estado: 'normal', proveedor: 'Ferretero Dist.' },
  { id: 'P008', sku: 'ADH-PVC-01', nombre: 'Adhesivo PVC 250ml', categoria: 'Adhesivos', marca: 'PegaFort', unidad: 'Unidad', precioCompra: 3.80, precioVenta: 6.50, stock: 0, stockMin: 15, stockMax: 80, estado: 'agotado', proveedor: 'QuímicaEcu' },
];

export const ventas = [
  { id: 'V-0248', fecha: '2026-08-25', cliente: 'Carlos Morales', productos: 4, subtotal: 98.40, iva: 11.81, total: 110.21, formaPago: 'Efectivo', estado: 'completada' },
  { id: 'V-0247', fecha: '2026-08-25', cliente: 'María Fernández', productos: 2, subtotal: 64.00, iva: 7.68, total: 71.68, formaPago: 'Tarjeta', estado: 'completada' },
  { id: 'V-0246', fecha: '2026-08-24', cliente: 'Constructora Andina', productos: 12, subtotal: 482.00, iva: 57.84, total: 539.84, formaPago: 'Transferencia', estado: 'completada' },
  { id: 'V-0245', fecha: '2026-08-24', cliente: 'Pedro Salazar', productos: 3, subtotal: 87.20, iva: 10.46, total: 97.66, formaPago: 'Efectivo', estado: 'completada' },
  { id: 'V-0244', fecha: '2026-08-23', cliente: 'Inmobiliaria Pacífico', productos: 28, subtotal: 1240.00, iva: 148.80, total: 1388.80, formaPago: 'Crédito 30d', estado: 'pendiente' },
  { id: 'V-0243', fecha: '2026-08-23', cliente: 'Luis Paredes', productos: 1, subtotal: 45.60, iva: 5.47, total: 51.07, formaPago: 'Efectivo', estado: 'completada' },
];

export const compras = [
  { id: 'C-0089', fecha: '2026-08-22', proveedor: 'ImportPlast S.A.', factura: 'F-00124', productos: 5, subtotal: 1840.00, iva: 220.80, total: 2060.80, formaPago: 'Transferencia', estado: 'recibida' },
  { id: 'C-0088', fecha: '2026-08-18', proveedor: 'Techos & Cielos Cía.', factura: 'F-00891', productos: 3, subtotal: 960.00, iva: 115.20, total: 1075.20, formaPago: 'Crédito 30d', estado: 'recibida' },
  { id: 'C-0087', fecha: '2026-08-15', proveedor: 'AlumMax Ecuador', factura: 'F-00456', productos: 4, subtotal: 2200.00, iva: 264.00, total: 2464.00, formaPago: 'Transferencia', estado: 'pendiente' },
  { id: 'C-0086', fecha: '2026-08-10', proveedor: 'MaderoFino S.A.', factura: 'F-00238', productos: 6, subtotal: 780.00, iva: 93.60, total: 873.60, formaPago: 'Efectivo', estado: 'recibida' },
];

export const clientes = [
  { id: 'CL-001', nombre: 'Carlos Morales', cedula: '1712345678', telefono: '0991234567', correo: 'cmorales@gmail.com', tipo: 'Personal', totalComprado: 1840.50, numCompras: 18, ultimaCompra: '2026-08-25' },
  { id: 'CL-002', nombre: 'Constructora Andina', cedula: '1791234567001', telefono: '022345678', correo: 'compras@andina.ec', tipo: 'Empresa', totalComprado: 24680.00, numCompras: 42, ultimaCompra: '2026-08-24' },
  { id: 'CL-003', nombre: 'María Fernández', cedula: '1723456789', telefono: '0987654321', correo: 'mfernandez@hotmail.com', tipo: 'Personal', totalComprado: 920.30, numCompras: 9, ultimaCompra: '2026-08-25' },
  { id: 'CL-004', nombre: 'Inmobiliaria Pacífico', cedula: '1791234568001', telefono: '023456789', correo: 'adquisiciones@pacifico.ec', tipo: 'Empresa', totalComprado: 48200.00, numCompras: 67, ultimaCompra: '2026-08-23' },
  { id: 'CL-005', nombre: 'Pedro Salazar', cedula: '1734567890', telefono: '0976543210', correo: 'psalazar@gmail.com', tipo: 'Personal', totalComprado: 640.80, numCompras: 7, ultimaCompra: '2026-08-24' },
];

export const proveedores = [
  { id: 'PR-001', nombre: 'ImportPlast S.A.', ruc: '1791234560001', contacto: 'Ing. Roberto Vega', telefono: '022345600', correo: 'ventas@importplast.ec', ciudad: 'Quito', productos: 28, tiempoEntrega: '3-5 días', estado: 'activo' },
  { id: 'PR-002', nombre: 'Techos & Cielos Cía.', ruc: '1791234561001', contacto: 'Sra. Ana Mora', telefono: '042345601', correo: 'contacto@techosycielos.ec', ciudad: 'Guayaquil', productos: 15, tiempoEntrega: '5-7 días', estado: 'activo' },
  { id: 'PR-003', nombre: 'AlumMax Ecuador', ruc: '1791234562001', contacto: 'Sr. Daniel Cruz', telefono: '022345602', correo: 'ventas@alummax.ec', ciudad: 'Quito', productos: 12, tiempoEntrega: '2-4 días', estado: 'activo' },
  { id: 'PR-004', nombre: 'MaderoFino S.A.', ruc: '1791234563001', contacto: 'Sra. Patricia León', telefono: '032345603', correo: 'info@maderofino.ec', ciudad: 'Ambato', productos: 22, tiempoEntrega: '4-6 días', estado: 'activo' },
  { id: 'PR-005', nombre: 'QuímicaEcu', ruc: '1791234564001', contacto: 'Ing. Fernando Ríos', telefono: '022345604', correo: 'ventas@quimica.ec', ciudad: 'Quito', productos: 8, tiempoEntrega: '1-2 días', estado: 'activo' },
];

export const proformas = [
  { id: 'PRF-0042', fecha: '2026-08-24', vencimiento: '2026-09-07', cliente: 'Constructora Andina', productos: 8, subtotal: 2480.00, iva: 297.60, total: 2777.60, estado: 'pendiente' },
  { id: 'PRF-0041', fecha: '2026-08-22', vencimiento: '2026-09-05', cliente: 'Inmobiliaria Pacífico', productos: 14, subtotal: 5640.00, iva: 676.80, total: 6316.80, estado: 'aprobada' },
  { id: 'PRF-0040', fecha: '2026-08-20', vencimiento: '2026-09-03', cliente: 'Carlos Morales', productos: 3, subtotal: 384.00, iva: 46.08, total: 430.08, estado: 'pendiente' },
  { id: 'PRF-0039', fecha: '2026-08-15', vencimiento: '2026-08-29', cliente: 'Pedro Salazar', productos: 2, subtotal: 128.00, iva: 15.36, total: 143.36, estado: 'vencida' },
  { id: 'PRF-0038', fecha: '2026-08-12', vencimiento: '2026-08-26', cliente: 'María Fernández', productos: 5, subtotal: 920.00, iva: 110.40, total: 1030.40, estado: 'convertida' },
];

export const alertas = [
  { tipo: 'crítico', mensaje: 'Duela PVC Blanca — Stock crítico (35 unid., mín. 50)', tiempo: 'Hace 2 horas' },
  { tipo: 'crítico', mensaje: 'Moldura Madera Colonial — Stock crítico (8 unid., mín. 40)', tiempo: 'Hace 2 horas' },
  { tipo: 'agotado', mensaje: 'Adhesivo PVC 250ml — Producto agotado', tiempo: 'Hace 5 horas' },
  { tipo: 'bajo', mensaje: 'Perfil Aluminio Omega 3m — Stock bajo (22 unid., mín. 30)', tiempo: 'Hace 1 día' },
  { tipo: 'proforma', mensaje: 'PRF-0039 Pedro Salazar — Próxima a vencer (29 Ago)', tiempo: 'Hace 1 día' },
];

export const chatHistory = [
  {
    role: 'assistant',
    content: 'Hola, soy el **Asistente DBM**. Estoy conectado a los datos reales de DBM Materiales y Acabados. Puedo ayudarte a consultar inventario, analizar ventas, identificar problemas y recomendar compras. ¿En qué te puedo ayudar hoy?',
    tiempo: '09:00',
  },
];

export const recomendacionIA = `## Recomendación de Compra — Septiembre 2026

Analicé el inventario actual, las ventas históricas y los tiempos de reposición. Te recomiendo priorizar los siguientes productos:

---

### 1. Duela PVC Blanca 10cm
- **Stock actual:** 35 unidades
- **Venta promedio mensual:** 82 unidades
- **Tendencia:** 📈 Creciente (+18% últimos 3 meses)
- **Cantidad recomendada:** **90 unidades**
- **Prioridad:** 🔴 ALTA
- **Proveedor recomendado:** ImportPlast S.A.
- **Inversión estimada:** $252.00
- **Motivo:** El stock actual cubre apenas 13 días de demanda. El período de reposición es de 3-5 días, pero considerando el crecimiento de la demanda, se recomienda aumentar el pedido.

---

### 2. Moldura Madera Colonial
- **Stock actual:** 8 metros
- **Venta promedio mensual:** 45 metros
- **Tendencia:** → Estable
- **Cantidad recomendada:** **60 metros**
- **Prioridad:** 🔴 ALTA
- **Proveedor recomendado:** MaderoFino S.A.
- **Inversión estimada:** $72.00
- **Motivo:** Stock crítico. Con el ritmo actual se agotará en menos de 6 días.

---

### 3. Adhesivo PVC 250ml
- **Stock actual:** 0 unidades (AGOTADO)
- **Venta promedio mensual:** 22 unidades
- **Tendencia:** → Estable
- **Cantidad recomendada:** **30 unidades**
- **Prioridad:** 🔴 ALTA
- **Proveedor recomendado:** QuímicaEcu
- **Inversión estimada:** $114.00
- **Motivo:** Producto agotado. Genera pérdidas de ventas y afecta la experiencia del cliente.

---

**💰 Inversión total recomendada: $438.00**

¿Quieres que genere una propuesta de compra formal?`;
