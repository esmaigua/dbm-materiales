import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarTicketPDF = (venta: any, cliente: any, carrito: any[]) => {
  // Creamos el documento en formato Ticket (80mm de ancho) o A4. Usaremos A4 estándar por ahora.
  const doc = new jsPDF();

  // 1. ENCABEZADO (Datos de tu empresa)
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("DBM Materiales y Acabados", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Dirección de la empresa", 105, 26, { align: "center" });
  doc.text("Teléfono: 0999999999", 105, 31, { align: "center" });
  
  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(15, 36, 195, 36);

  // 2. DATOS DE LA VENTA Y CLIENTE
  doc.setFont("helvetica", "bold");
  doc.text(`Factura / Ticket:`, 15, 45);
  doc.setFont("helvetica", "normal");
  doc.text(`${venta.id || 'N/A'}`, 50, 45);

  doc.setFont("helvetica", "bold");
  doc.text(`Fecha:`, 15, 52);
  doc.setFont("helvetica", "normal");
  doc.text(`${new Date().toLocaleString('es-EC')}`, 50, 52);

  doc.setFont("helvetica", "bold");
  doc.text(`Cliente:`, 120, 45);
  doc.setFont("helvetica", "normal");
  doc.text(`${cliente.name || 'Consumidor Final'}`, 140, 45);

  doc.setFont("helvetica", "bold");
  doc.text(`RUC/C.I:`, 120, 52);
  doc.setFont("helvetica", "normal");
  doc.text(`${cliente.document_number || '9999999999'}`, 140, 52);

  // 3. TABLA DE PRODUCTOS
  const tableData = carrito.map((item) => [
    item.cantidad,
    item.producto.name,
    `$${Number(item.producto.price).toFixed(2)}`,
    `$${(item.cantidad * item.producto.price).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 65,
    head: [['Cant.', 'Descripción', 'P. Unitario', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [237, 135, 27] }, // Color naranja de tu sistema (#ED871B)
    styles: { fontSize: 10 },
  });

  // 4. TOTALES (Subtotal, IVA, Total)
  // autoTable.previous.finalY nos da la posición Y donde terminó la tabla
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  const subtotal = carrito.reduce((acc, item) => acc + (item.cantidad * item.producto.price), 0);
  const iva = subtotal * 0.15;
  const total = subtotal + iva;

  doc.setFont("helvetica", "normal");
  doc.text(`Subtotal:`, 140, finalY);
  doc.text(`$${subtotal.toFixed(2)}`, 175, finalY);
  
  doc.text(`IVA (15%):`, 140, finalY + 7);
  doc.text(`$${iva.toFixed(2)}`, 175, finalY + 7);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`TOTAL:`, 140, finalY + 15);
  doc.text(`$${total.toFixed(2)}`, 175, finalY + 15);

  // 5. MENSAJE FINAL
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("¡Gracias por su compra en DBM Materiales y Acabados!", 105, finalY + 30, { align: "center" });

  // 6. DESCARGAR PDF
  doc.save(`Recibo_DBM_${new Date().getTime()}.pdf`);
};