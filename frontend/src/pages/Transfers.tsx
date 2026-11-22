import { useState, useEffect } from 'react';
import api from '../services/api';

interface Location {
  id: string;
  name: string;
  is_active: boolean;
}

interface StockItem {
  product_id: string;
  sku: string | null;
  name: string;
  location_id: string;
  location_name: string;
  quantity: number;
}

interface TransferItem {
  product_id: string;
  name: string;
  sku: string | null;
  disponible: number;
  quantity: number;
}

export default function Transfers() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originStock, setOriginStock] = useState<StockItem[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<TransferItem[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    setCart([]);
    if (origin) loadOriginStock(origin);
    else setOriginStock([]);
  }, [origin]);

  const loadLocations = async () => {
    try {
      const res = await api.get('/locations');
      setLocations(res.data.filter((l: Location) => l.is_active));
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    }
  };

  const loadOriginStock = async (locationId: string) => {
    try {
      const res = await api.get('/inventory/stock', { params: { location_id: locationId } });
      setOriginStock(res.data.filter((s: StockItem) => s.quantity > 0));
    } catch (error) {
      console.error('Error cargando stock de origen:', error);
    }
  };

  const filteredStock = originStock.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || (s.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item: StockItem) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.product_id === item.product_id);
      if (exists) return prev;
      return [...prev, { product_id: item.product_id, name: item.name, sku: item.sku, disponible: item.quantity, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    setCart((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity: Math.max(1, Math.min(qty, i.disponible)) } : i))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const handleConfirmTransfer = async () => {
    if (!origin || !destination) {
      alert('Selecciona la sucursal de origen y la de destino.');
      return;
    }
    if (origin === destination) {
      alert('El origen y el destino deben ser sucursales distintas.');
      return;
    }
    if (cart.length === 0) {
      alert('Agrega al menos un producto a trasladar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/inventory/transfers', {
        origin_location_id: origin,
        destination_location_id: destination,
        notes: notes || undefined,
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      alert('Traslado registrado. El stock de ambas sucursales fue actualizado.');
      setCart([]);
      setNotes('');
      loadOriginStock(origin);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al registrar el traslado.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800">Traslados entre sucursales</h1>
        <p className="text-sm text-slate-500 mt-0.5">Mueve productos de una sucursal a otra sin perder trazabilidad</p>
      </div>

      {/* Selectores de sucursal */}
      <div className="bg-white rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ border: '1px solid #E5E7EB' }}>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Sucursal de origen</label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
          >
            <option value="">Seleccione...</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id} disabled={l.id === destination}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Sucursal de destino</label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
          >
            <option value="">Seleccione...</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id} disabled={l.id === origin}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!origin ? (
        <div className="bg-white rounded-xl p-10 text-center text-slate-400 text-sm" style={{ border: '1px solid #E5E7EB' }}>
          Selecciona una sucursal de origen para ver su stock disponible.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Catálogo de stock disponible en origen */}
          <div className="lg:col-span-3 bg-white rounded-xl flex flex-col overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
            <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto por nombre o SKU..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
              />
            </div>
            <div className="max-h-[420px] overflow-y-auto p-4 space-y-2">
              {filteredStock.map((item) => (
                <div
                  key={item.product_id}
                  onClick={() => addToCart(item)}
                  className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:border-orange-300 cursor-pointer transition-all"
                >
                  <div>
                    <div className="font-medium text-sm text-slate-700">{item.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{item.sku || '—'} • Disponible: {item.quantity}</div>
                  </div>
                  <span className="text-xs font-bold text-orange-500">+ Agregar</span>
                </div>
              ))}
              {filteredStock.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">No hay stock disponible en esta sucursal.</div>
              )}
            </div>
          </div>

          {/* Carrito de traslado */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="bg-white rounded-xl flex flex-col overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
              <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: '#E5E7EB' }}>
                <h3 className="font-display font-semibold text-slate-800">Productos a trasladar</h3>
                <span className="text-xs text-slate-500">{cart.length} item(s)</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
                {cart.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">Selecciona productos de la lista de origen</div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product_id} className="p-3 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-slate-800 truncate">{item.name}</div>
                        <div className="text-xs text-slate-400">Máx: {item.disponible}</div>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={item.disponible}
                        value={item.quantity}
                        onChange={(e) => updateQty(item.product_id, parseFloat(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border border-slate-300 rounded text-sm text-center"
                      />
                      <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-600 font-bold px-1">
                        &times;
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 space-y-3" style={{ border: '1px solid #E5E7EB' }}>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Notas (opcional)</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Reposición solicitada por el encargado"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
                />
              </div>
              <button
                onClick={handleConfirmTransfer}
                disabled={cart.length === 0 || !destination || isSubmitting}
                className="w-full py-3 rounded-xl font-display font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#ED871B' }}
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar traslado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}