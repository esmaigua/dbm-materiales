import { useState, useEffect } from 'react';
import api from '../services/api';

// 1. INTERFACES (Datos reales)
interface Product {
  id: string;
  sku: string;
  name: string;
  cost: number; // Para compras nos importa el costo, no el precio de venta
  stock_actual: number;
}

interface Supplier {
  id: string;
  name: string;
  tax_id: string;
}

type CartItem = { 
  producto: Product; 
  cantidad: number; 
  costo_unitario: number; 
};

export default function Purchases() {
  const [view, setView] = useState<'lista' | 'nueva'>('nueva'); // Empezamos en nueva compra
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  
  // Datos del backend
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. CARGAR DATOS REALES
  const loadData = async () => {
    try {
      const [prodsRes, suppRes] = await Promise.all([
        api.get('/products'),
        api.get('/suppliers')
      ]);
      setProducts(prodsRes.data);
      setSuppliers(suppRes.data);
      if (suppRes.data.length > 0) {
        setSelectedSupplierId(suppRes.data[0].id);
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
      p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.producto.id === p.id);
      if (existing) return prev.map((i) => i.producto.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      // Al agregar, tomamos el costo actual que está en la base de datos
      return [...prev, { producto: p, cantidad: 1, costo_unitario: Number(p.cost) }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.producto.id !== id));
    else setCart((prev) => prev.map((i) => i.producto.id === id ? { ...i, cantidad: qty } : i));
  };

  const updateCost = (id: string, cost: number) => {
    setCart((prev) => prev.map((i) => i.producto.id === id ? { ...i, costo_unitario: cost } : i));
  };

  // Cálculos matemáticos (IVA al 15%)
  const subtotal = cart.reduce((acc, i) => acc + (i.costo_unitario * i.cantidad), 0);
  const iva = subtotal * 0.15;
  const total = subtotal + iva;

  // 4. CONFIRMAR COMPRA
  const handleCheckout = async () => {
    if (!selectedSupplierId) {
      alert("Por favor, selecciona un proveedor primero.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      supplier_id: selectedSupplierId,
      items: cart.map(item => ({
        product_id: item.producto.id,
        quantity: item.cantidad,
        unit_cost: item.costo_unitario
      }))
    };

    try {
      await api.post('/purchases', payload);
      alert("¡Compra registrada! El inventario ha sido actualizado.");
      setCart([]);
      loadData(); // Recargamos para ver el stock actualizado
    } catch (error) {
      alert("Error al registrar la compra. Revisa la consola.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Compras a Proveedores</h1>
          <p className="text-sm text-slate-500 mt-0.5">Ingreso de mercadería y actualización de costos</p>
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
            Historial
          </button>
          <button
            onClick={() => setView('nueva')}
            className="px-4 py-2 rounded-lg text-white text-sm font-display font-semibold"
            style={{ background: '#ED871B' }}
          >
            + Nueva compra
          </button>
        </div>
      </div>

      {view === 'lista' ? (
        <div className="bg-white rounded-xl p-8 text-center text-slate-500 border" style={{ borderColor: '#E5E7EB' }}>
          El historial de compras se implementará en la siguiente fase.
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Panel Izquierdo: Buscador de productos */}
          <div className="col-span-3 bg-white rounded-xl flex flex-col overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
            <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto para ingresar al inventario..."
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
                    <div className="text-xs font-mono" style={{ color: p.stock_actual < 0 ? '#DC2626' : '#64748B' }}>
                      {p.sku} — Stock actual: {p.stock_actual}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-slate-400">Último costo</div>
                    <div className="font-mono font-bold text-sm text-slate-600">${Number(p.cost).toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Panel Derecho: Detalle de Compra (Carrito) */}
          <div className="col-span-2 flex flex-col gap-3">
            <div className="bg-white rounded-xl flex flex-col flex-1 overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#E5E7EB' }}>
                <h3 className="font-display font-semibold text-slate-800">Detalle de Ingreso</h3>
              </div>
              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-300 font-display text-sm">
                  Agrega productos para registrar su ingreso
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {cart.map((item) => (
                    <div key={item.producto.id} className="p-3 flex flex-col gap-2">
                      <div className="font-medium text-xs text-slate-800 truncate">{item.producto.name}</div>
                      
                      <div className="flex items-center justify-between gap-2">
                        {/* Control de cantidad */}
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.producto.id, item.cantidad - 1)} className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center hover:bg-gray-100 border">−</button>
                          <span className="w-8 text-center font-mono text-sm font-bold text-slate-800">{item.cantidad}</span>
                          <button onClick={() => updateQty(item.producto.id, item.cantidad + 1)} className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center hover:bg-gray-100 border">+</button>
                        </div>

                        {/* Input editable de costo unitario */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400">Costo: $</span>
                          <input 
                            type="number" 
                            value={item.costo_unitario}
                            onChange={(e) => updateCost(item.producto.id, Number(e.target.value))}
                            className="w-16 px-1 py-0.5 text-right font-mono text-sm border rounded outline-none"
                            step="0.01"
                          />
                        </div>

                        <div className="font-mono font-semibold text-sm text-slate-800 w-16 text-right">
                          ${(item.costo_unitario * item.cantidad).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totales y Proveedor */}
            <div className="bg-white rounded-xl p-4 space-y-3" style={{ border: '1px solid #E5E7EB' }}>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Proveedor</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border bg-white"
                >
                  <option value="" disabled>Seleccione un proveedor...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} - {s.tax_id}</option>)}
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
                  <span>Total Factura</span>
                  <span className="font-mono" style={{ color: '#ED871B' }}>${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleCheckout}
                className="w-full py-3 rounded-xl font-display font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#1D2647' }} // Azul oscuro para diferenciarlo de ventas
              >
                {isSubmitting ? 'Procesando...' : 'Registrar Ingreso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}