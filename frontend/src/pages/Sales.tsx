import { useState, useEffect } from 'react';
import api from '../services/api';
import { generarTicketPDF } from '../utils/pdfGenerator';
// 1. INTERFACES
interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock_actual: number;
  is_service: boolean;
  is_active: boolean;
}

interface Customer {
  id: string;
  name: string;
  document_number: string;
  is_active: boolean;
}

interface Location {
  id: string;
  name: string;
  is_active: boolean;
}

type CartItem = {
  producto: Product;
  cantidad: number;
  descuento: number;
  precio_unitario: number; // editable: permite aplicar descuentos manuales en el POS
};

interface StockItem {
  product_id: string;
  quantity: number;
}

export default function Sales() {
  const [view, setView] = useState<'lista' | 'nueva'>('nueva');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [formaPago, setFormaPago] = useState('Efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado de pago de la venta: pagó todo, abonó una parte, o quedó a deber todo
  const [paymentOption, setPaymentOption] = useState<'completo' | 'parcial' | 'pendiente'>('completo');
  const [abonoAmount, setAbonoAmount] = useState('');
  const [applyIva, setApplyIva] = useState(true);

  // Stock del producto específicamente en la sucursal seleccionada (para
  // mostrar y ordenar el catálogo, aunque se listan TODOS los productos)
  const [locationStock, setLocationStock] = useState<Record<string, number>>({});

  // Estados del Historial
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal para registrar un abono adicional sobre una venta ya existente
  const [abonoModalSale, setAbonoModalSale] = useState<any | null>(null);
  const [abonoModalAmount, setAbonoModalAmount] = useState('');
  const [abonoModalMethod, setAbonoModalMethod] = useState('Efectivo');
  const [savingAbono, setSavingAbono] = useState(false);

  // Modal para anular una venta ya existente (revierte el stock)
  const [cancelModalSale, setCancelModalSale] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // 2. CONTROL DE VISTAS Y CARGA DE DATOS
  useEffect(() => {
    if (view === 'lista') {
      loadHistory();
    } else {
      loadData(); // Siempre recarga los productos frescos al entrar a vender
    }
  }, [view]);

  // Cuando cambia la sucursal, recargamos cuánto stock hay de cada producto ahí
  useEffect(() => {
    if (selectedLocationId) loadLocationStock(selectedLocationId);
  }, [selectedLocationId]);

  const loadLocationStock = async (locationId: string) => {
    try {
      const res = await api.get('/inventory/stock', { params: { location_id: locationId } });
      const map: Record<string, number> = {};
      res.data.forEach((s: StockItem) => { map[s.product_id] = s.quantity; });
      setLocationStock(map);
    } catch (error) {
      console.error('Error cargando stock de la sucursal:', error);
    }
  };

  const loadData = async () => {
    try {
      const [prodsRes, custRes, locRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers'),
        api.get('/locations')
      ]);

      // Filtramos para asegurar que no salgan productos/clientes borrados
      const activeProducts = prodsRes.data.filter((p: Product) => p.is_active);
      const activeCustomers = custRes.data.filter((c: Customer) => c.is_active);
      const activeLocations = locRes.data.filter((l: Location) => l.is_active);

      setProducts(activeProducts);
      setCustomers(activeCustomers);
      setLocations(activeLocations);

      if (activeCustomers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(activeCustomers[0].id);
      }
      if (activeLocations.length > 0 && !selectedLocationId) {
        setSelectedLocationId(activeLocations[0].id);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("No se pudieron cargar los productos, clientes o sucursales. Revisa tu conexión e intenta de nuevo.");
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/sales');
      setSalesHistory(res.data);
    } catch (error) {
      console.error("Error cargando historial", error);
      alert("No se pudo cargar el historial de ventas.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const openAbonoModal = (sale: any) => {
    setAbonoModalSale(sale);
    setAbonoModalAmount('');
    setAbonoModalMethod('Efectivo');
  };

  const closeAbonoModal = () => setAbonoModalSale(null);

  const handleSaveAbono = async () => {
    if (!abonoModalSale) return;
    const monto = parseFloat(abonoModalAmount);
    if (!monto || monto <= 0) {
      alert("Ingresa un monto válido.");
      return;
    }
    setSavingAbono(true);
    try {
      await api.post(`/sales/${abonoModalSale.id}/payments`, {
        amount: monto,
        payment_method: abonoModalMethod,
      });
      closeAbonoModal();
      loadHistory();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al registrar el abono.");
      console.error(error);
    } finally {
      setSavingAbono(false);
    }
  };

  const openCancelModal = (sale: any) => {
    setCancelModalSale(sale);
    setCancelReason('');
  };

  const closeCancelModal = () => setCancelModalSale(null);

  const handleCancelSale = async () => {
    if (!cancelModalSale) return;
    if (!cancelReason.trim()) {
      alert("Indica el motivo de la anulación.");
      return;
    }
    setCancelling(true);
    try {
      await api.post(`/sales/${cancelModalSale.id}/cancel`, { reason: cancelReason.trim() });
      closeCancelModal();
      loadHistory();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Error al anular la venta.");
      console.error(error);
    } finally {
      setCancelling(false);
    }
  };

  const saleStatusBadge = (status: string) => {
    if (status === 'CANCELADA') {
      return (
        <span className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap" style={{ background: '#F1F5F9', color: '#64748B' }}>
          Anulada
        </span>
      );
    }
    return null;
  };

  const paymentStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      PAGADO: { bg: '#F0FDF4', color: '#16a34a', label: 'Pagado' },
      ABONADO: { bg: '#FFFBEB', color: '#D97706', label: 'Abonado' },
      PENDIENTE: { bg: '#FEF2F2', color: '#DC2626', label: 'Pendiente' },
    };
    const s = map[status] || map.PAGADO;
    return (
      <span className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap" style={{ background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  const handleReimprimirTicket = async (saleId: string) => {
    try {
      // 1. Pedimos los detalles al backend
      const res = await api.get(`/sales/${saleId}/details`);
      const { venta, cliente, carrito } = res.data;
      
      // 2. Usamos nuestra herramienta para generar el PDF
      generarTicketPDF(venta, cliente, carrito);
    } catch (error) {
      console.error("Error al reimprimir:", error);
      alert("No se pudieron cargar los detalles de esta venta.");
    }
  };

  // 3. LÓGICA DEL CARRITO
  // Se listan TODOS los productos (no solo los de esta sucursal), pero se
  // ordenan primero los que sí tienen stock aquí, y se marca cuáles no.
  const filteredProds = products
    .filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (locationStock[b.id] || 0) - (locationStock[a.id] || 0));

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.producto.id === p.id);
      if (existing) return prev.map((i) => i.producto.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { producto: p, cantidad: 1, descuento: 0, precio_unitario: Number(p.price) }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.producto.id !== id));
    else setCart((prev) => prev.map((i) => i.producto.id === id ? { ...i, cantidad: qty } : i));
  };

  const updatePrecio = (id: string, precio: number) => {
    setCart((prev) => prev.map((i) => i.producto.id === id ? { ...i, precio_unitario: Math.max(0, precio) } : i));
  };

  const subtotal = cart.reduce((acc, i) => acc + (i.precio_unitario * i.cantidad), 0);
  const iva = applyIva ? subtotal * 0.15 : 0;
  const total = subtotal + iva;

  // 4. CONFIRMAR VENTA
  const handleCheckout = async (forceOverride = false) => {
    if (!selectedCustomerId) {
      alert("Por favor, selecciona un cliente primero.");
      return;
    }
    if (!selectedLocationId) {
      alert("Por favor, selecciona la sucursal donde se realiza la venta.");
      return;
    }

    if (paymentOption === 'parcial') {
      const monto = parseFloat(abonoAmount);
      if (!monto || monto <= 0 || monto >= total) {
        alert("El monto abonado debe ser mayor a 0 y menor al total de la venta. Si pagó todo, selecciona 'Pagó completo'.");
        return;
      }
    }

    setIsSubmitting(true);

    let initial_payment_amount: number | undefined;
    if (paymentOption === 'completo') initial_payment_amount = total;
    else if (paymentOption === 'parcial') initial_payment_amount = parseFloat(abonoAmount);
    // 'pendiente' => no se envía pago inicial

    const payload = {
      customer_id: selectedCustomerId,
      location_id: selectedLocationId,
      discount: 0,
      items: cart.map(item => ({
        product_id: item.producto.id,
        quantity: item.cantidad,
        unit_price: item.precio_unitario
      })),
      force_stock_override: forceOverride,
      initial_payment_amount,
      initial_payment_method: formaPago,
      apply_tax: applyIva,
    };

    try {
          // 1. Guardamos en la base de datos
          const response = await api.post('/sales', payload);

          // 2. Buscamos los datos completos del cliente seleccionado para el PDF
          const clienteSeleccionado = customers.find(c => c.id === selectedCustomerId) || { name: 'CF', document_number: '9999999999' };

          // 3. ¡Generamos el PDF mágicamente!
          generarTicketPDF(response.data, clienteSeleccionado, cart);

          alert("¡Venta registrada con éxito!");
          setCart([]);
          setAbonoAmount('');
          setPaymentOption('completo');
          loadData();
        } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes("Stock insuficiente")) {
        const mensajeOriginal = error.response.data.detail;
        const confirmar = window.confirm(
          `⚠️ ${mensajeOriginal}\n\n¿Desea forzar la venta y dejar el inventario en negativo (Backorder)?`
        );
        if (confirmar) {
          handleCheckout(true);
        }
      } else {
        alert("Error al procesar la venta. Revisa la consola.");
        console.error(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Punto de Venta (POS)</h1>
          <p className="text-sm text-slate-500 mt-0.5">Módulo de facturación y reservas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('lista')}
            className="px-4 py-2 rounded-lg text-sm font-display font-medium transition-colors"
            style={{
              background: view === 'lista' ? '#1D2647' : '#fff',
              color: view === 'lista' ? '#fff' : '#374151',
              border: '1px solid #E5E7EB',
            }}
          >
            Lista de ventas
          </button>
          <button
            onClick={() => setView('nueva')}
            className="px-4 py-2 rounded-lg text-white text-sm font-display font-semibold transition-colors hover:opacity-90"
            style={{ background: view === 'nueva' ? '#ED871B' : '#cbd5e1' }}
          >
            + Nueva venta
          </button>
        </div>
      </div>

      {view === 'lista' ? (
        <div className="bg-white rounded-xl flex flex-col overflow-hidden shadow-sm" style={{ border: '1px solid #E5E7EB', height: 'calc(100vh - 160px)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 text-xs uppercase tracking-wider" style={{ borderColor: '#E5E7EB' }}>
                  <th className="p-4 font-medium">Fecha</th>
                  <th className="p-4 font-medium">ID Transacción</th>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Sucursal</th>
                  <th className="p-4 font-medium text-right">Total</th>
                  <th className="p-4 font-medium text-right">Saldo</th>
                  <th className="p-4 font-medium text-center">Estado de pago</th>
                  <th className="p-4 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#f3f4f6' }}>
                {loadingHistory ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-400">Cargando historial...</td></tr>
                ) : salesHistory.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-400">No hay ventas registradas aún.</td></tr>
                ) : (
                  salesHistory.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(sale.created_at).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-sm font-mono text-slate-400">{sale.id.split('-')[0].toUpperCase()}</td>
                      <td className="p-4 text-sm text-slate-600">{sale.customer_name || 'Consumidor Final'}</td>
                      <td className="p-4 text-sm text-slate-600">{sale.location_name || '—'}</td>
                      <td className="p-4 text-right font-bold text-slate-700">${sale.total.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono text-sm" style={{ color: sale.balance > 0 ? '#DC2626' : '#64748B' }}>
                        ${sale.balance.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        {sale.status === 'CANCELADA' ? saleStatusBadge(sale.status) : paymentStatusBadge(sale.payment_status)}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        {sale.status !== 'CANCELADA' && sale.balance > 0 && (
                          <button onClick={() => openAbonoModal(sale)} className="text-orange-600 hover:text-orange-700 text-xs font-medium mr-3">Registrar abono</button>
                        )}
                        <button onClick={() => handleReimprimirTicket(sale.id)} className="text-blue-500 hover:text-blue-700 text-xs font-medium mr-3">Imprimir Ticket</button>
                        {sale.status !== 'CANCELADA' && (
                          <button onClick={() => openCancelModal(sale)} className="text-red-500 hover:text-red-700 text-xs font-medium">Anular</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
          {/* CATÁLOGO DE PRODUCTOS */}
          <div className="col-span-3 bg-white rounded-xl flex flex-col overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
            <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto por nombre o SKU..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
                  style={{ border: '1px solid #E5E7EB', fontFamily: 'Inter' }}
                  onFocus={(e) => (e.target.style.borderColor = '#ED871B')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {filteredProds.map((p) => {
                const stockAqui = locationStock[p.id] ?? 0;
                const sinStockAqui = !p.is_service && stockAqui <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-orange-50 transition-colors group"
                    style={{ border: '1px solid transparent' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#ED871B')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'transparent')}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base" style={{ background: '#F0F2F5' }}>📦</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 truncate">{p.name}</div>
                      <div className="text-xs font-mono flex items-center gap-1.5" style={{ color: sinStockAqui ? '#DC2626' : '#64748B' }}>
                        {p.sku} — Stock aquí: {p.is_service ? '—' : stockAqui}
                        {sinStockAqui && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                            Sin stock aquí
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono font-bold text-sm" style={{ color: '#ED871B' }}>${Number(p.price).toFixed(2)}</div>
                    </div>
                  </button>
                );
              })}
              {filteredProds.length === 0 && (
                <div className="text-center py-8 text-slate-400 font-display">Sin productos disponibles</div>
              )}
            </div>
          </div>

          {/* CARRITO Y CONFIRMACIÓN */}
          <div className="col-span-2 flex flex-col gap-3">
            <div className="bg-white rounded-xl flex flex-col flex-1 overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#E5E7EB' }}>
                <h3 className="font-display font-semibold text-slate-800">Carrito</h3>
                <span className="font-mono text-xs text-slate-500">{cart.length} ítems</span>
              </div>
              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-300 font-display text-sm">
                  Agrega productos al carrito
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {cart.map((item) => (
                    <div key={item.producto.id} className="p-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs text-slate-800 truncate">{item.producto.name}</div>
                          {item.precio_unitario !== Number(item.producto.price) && (
                            <div className="text-[10px] text-slate-400 line-through">Precio catálogo: ${Number(item.producto.price).toFixed(2)}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQty(item.producto.id, item.cantidad - 1)}
                            className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center hover:bg-gray-100 border"
                          >−</button>
                          <span className="w-8 text-center font-mono text-sm font-bold text-slate-800">{item.cantidad}</span>
                          <button
                            onClick={() => updateQty(item.producto.id, item.cantidad + 1)}
                            className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center hover:bg-gray-100 border"
                          >+</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 pl-0">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <span>Precio c/u:</span>
                          <div className="relative w-20">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.precio_unitario}
                              onChange={(e) => updatePrecio(item.producto.id, parseFloat(e.target.value) || 0)}
                              className="w-full pl-4 pr-1 py-1 border border-slate-300 rounded text-xs text-right font-bold focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>
                        <div className="font-mono font-semibold text-sm text-slate-800">
                          ${(item.precio_unitario * item.cantidad).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 space-y-3" style={{ border: '1px solid #E5E7EB' }}>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Sucursal</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
                >
                  <option value="" disabled>Seleccione una sucursal...</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Cliente</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
                >
                  <option value="" disabled>Seleccione un cliente...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.document_number}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Estado de pago</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'completo', label: 'Pagó todo' },
                    { id: 'parcial', label: 'Abono' },
                    { id: 'pendiente', label: 'Fiado' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setPaymentOption(opt.id as typeof paymentOption)}
                      className="py-2 rounded-lg text-xs font-semibold transition-colors"
                      style={{
                        background: paymentOption === opt.id ? '#1D2647' : '#F0F2F5',
                        color: paymentOption === opt.id ? '#fff' : '#64748B',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {paymentOption === 'parcial' && (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Monto abonado ahora</label>
                  <input
                    type="number"
                    step="0.01"
                    value={abonoAmount}
                    onChange={(e) => setAbonoAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
                  />
                </div>
              )}
              {paymentOption !== 'pendiente' && (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Forma de pago</label>
                  <select
                    value={formaPago}
                    onChange={(e) => setFormaPago(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
                  >
                    {['Efectivo', 'Transferencia', 'Tarjeta'].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <label className="flex justify-between items-center text-sm text-slate-500 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <input type="checkbox" checked={applyIva} onChange={(e) => setApplyIva(e.target.checked)} className="rounded" />
                    IVA 15%
                  </span>
                  <span className="font-mono">${iva.toFixed(2)}</span>
                </label>
                <div className="flex justify-between font-display font-bold text-lg text-slate-800 pt-1 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <span>Total</span>
                  <span className="font-mono" style={{ color: '#ED871B' }}>${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                disabled={cart.length === 0 || !selectedLocationId || isSubmitting}
                onClick={() => handleCheckout(false)}
                className="w-full py-3 rounded-xl font-display font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#ED871B' }}
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: registrar abono sobre una venta existente */}
      {abonoModalSale && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={closeAbonoModal}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-800">Registrar abono</h3>
              <p className="text-sm text-slate-500">
                {abonoModalSale.customer_name || 'Consumidor Final'} — Saldo pendiente: <span className="font-bold text-red-600">${abonoModalSale.balance.toFixed(2)}</span>
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Monto</label>
              <input
                type="number"
                step="0.01"
                value={abonoModalAmount}
                onChange={(e) => setAbonoModalAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Forma de pago</label>
              <select
                value={abonoModalMethod}
                onChange={(e) => setAbonoModalMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
              >
                {['Efectivo', 'Transferencia', 'Tarjeta'].map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={closeAbonoModal} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-600" style={{ border: '1px solid #E5E7EB' }}>
                Cancelar
              </button>
              <button
                onClick={handleSaveAbono}
                disabled={savingAbono}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: '#ED871B' }}
              >
                {savingAbono ? 'Guardando...' : 'Guardar abono'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: anular una venta existente (revierte el stock) */}
      {cancelModalSale && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={closeCancelModal}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-800">Anular venta</h3>
              <p className="text-sm text-slate-500">
                {cancelModalSale.customer_name || 'Consumidor Final'} — Total: <span className="font-bold">${cancelModalSale.total.toFixed(2)}</span>
              </p>
              <p className="text-xs mt-2" style={{ color: '#D97706' }}>
                ⚠️ El stock de los productos vendidos se devolverá a la sucursal automáticamente. Esta acción queda registrada y no se puede deshacer.
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Motivo de la anulación</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
                placeholder="Ej. Cliente equivocado, producto incorrecto..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={closeCancelModal} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-600" style={{ border: '1px solid #E5E7EB' }}>
                Cancelar
              </button>
              <button
                onClick={handleCancelSale}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: '#DC2626' }}
              >
                {cancelling ? 'Anulando...' : 'Anular venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}