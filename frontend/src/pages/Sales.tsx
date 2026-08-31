import { useState, useEffect } from 'react';
import api from '../services/api';

// 1. INTERFACES (Datos reales de Supabase)
interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock_actual: number;
  is_service: boolean;
}

interface Customer {
  id: string;
  name: string;
  tax_id: string;
}

// Interfaz para el carrito
type CartItem = { 
  producto: Product; 
  cantidad: number; 
  descuento: number;
};

export default function Sales() {
  const [view, setView] = useState<'lista' | 'nueva'>('nueva'); // Empezamos en 'nueva' para vender rápido
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  
  // Datos desde el backend
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [formaPago, setFormaPago] = useState('Efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. CARGAR DATOS REALES (Productos y Clientes)
  const loadData = async () => {
    try {
      const [prodsRes, custRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers')
      ]);
      setProducts(prodsRes.data);
      setCustomers(custRes.data);
      if (custRes.data.length > 0) {
        setSelectedCustomerId(custRes.data[0].id); // Selecciona el primer cliente por defecto
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 3. LÓGICA DEL CARRITO
  const filteredProds = products.filter(
    (p) =>
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.producto.id === p.id);
      if (existing) return prev.map((i) => i.producto.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { producto: p, cantidad: 1, descuento: 0 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.producto.id !== id));
    else setCart((prev) => prev.map((i) => i.producto.id === id ? { ...i, cantidad: qty } : i));
  };

  // Cálculos matemáticos (IVA al 15%)
  const subtotal = cart.reduce((acc, i) => acc + (Number(i.producto.price) * i.cantidad), 0);
  const iva = subtotal * 0.15;
  const total = subtotal + iva;

  // 4. CONFIRMAR VENTA (Conexión al Backend)
  const handleCheckout = async (forceOverride = false) => {
    if (!selectedCustomerId) {
      alert("Por favor, selecciona un cliente primero.");
      return;
    }

    setIsSubmitting(true);

    // Armamos el JSON exactamente como lo espera Pydantic
    const payload = {
      customer_id: selectedCustomerId,
      discount: 0, // Descuento global
      items: cart.map(item => ({
        product_id: item.producto.id,
        quantity: item.cantidad,
        unit_price: Number(item.producto.price)
      })),
      force_stock_override: forceOverride
    };

    try {
      await api.post('/sales', payload);
      alert("¡Venta registrada con éxito!");
      setCart([]); // Vaciamos carrito
      loadData(); // Recargamos productos para actualizar el stock en pantalla
    } catch (error: any) {
      // Manejo de error de stock
      if (error.response?.status === 400 && error.response?.data?.detail?.includes("Stock insuficiente")) {
        const mensajeOriginal = error.response.data.detail;
        const confirmar = window.confirm(
          `⚠️ ${mensajeOriginal}\n\n¿Desea forzar la venta y dejar el inventario en negativo (Backorder)?`
        );
        if (confirmar) {
          handleCheckout(true); // Re-intentamos con la llave maestra
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
      {/* Header */}
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
            className="px-4 py-2 rounded-lg text-white text-sm font-display font-semibold"
            style={{ background: '#ED871B' }}
          >
            + Nueva venta
          </button>
        </div>
      </div>

      {view === 'lista' ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-500 border" style={{ borderColor: '#E5E7EB' }}>
          El historial de ventas se implementará en la siguiente fase.
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Left: product selector */}
          <div className="col-span-3 bg-white rounded-xl flex flex-col overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
            <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto por nombre o SKU..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #E5E7EB', fontFamily: 'Inter' }}
                  onFocus={(e) => (e.target.style.borderColor = '#ED871B')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {filteredProds.map((p) => (
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
                    <div className="text-xs font-mono" style={{ color: p.stock_actual <= 0 ? '#DC2626' : '#64748B' }}>
                      {p.sku} — Stock: {p.stock_actual}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-sm" style={{ color: '#ED871B' }}>${Number(p.price).toFixed(2)}</div>
                  </div>
                </button>
              ))}
              {filteredProds.length === 0 && (
                <div className="text-center py-8 text-slate-400 font-display">Sin productos disponibles</div>
              )}
            </div>
          </div>

          {/* Right: cart */}
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
                    <div key={item.producto.id} className="p-3 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-slate-800 truncate">{item.producto.name}</div>
                        <div className="font-mono text-xs" style={{ color: '#ED871B' }}>${Number(item.producto.price).toFixed(2)}</div>
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
                      <div className="font-mono font-semibold text-sm text-slate-800 w-16 text-right">
                        ${(Number(item.producto.price) * item.cantidad).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals + checkout */}
            <div className="bg-white rounded-xl p-4 space-y-3" style={{ border: '1px solid #E5E7EB' }}>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Cliente</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                >
                  <option value="" disabled>Seleccione un cliente...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.tax_id}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Forma de pago</label>
                <select
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
                >
                  {['Efectivo', 'Transferencia', 'Tarjeta'].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>IVA 15%</span>
                  <span className="font-mono">${iva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-display font-bold text-lg text-slate-800 pt-1 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <span>Total</span>
                  <span className="font-mono" style={{ color: '#ED871B' }}>${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                disabled={cart.length === 0 || isSubmitting}
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
    </div>
  );
}