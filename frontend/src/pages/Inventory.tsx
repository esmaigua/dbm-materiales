import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  stock_minimo: number;
  estado: 'normal' | 'bajo' | 'critico' | 'agotado';
}

const estadoBadge = (estado: string) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    normal: { bg: '#F0FDF4', color: '#16a34a', label: 'Normal' },
    bajo: { bg: '#FFFBEB', color: '#D97706', label: 'Stock bajo' },
    critico: { bg: '#FEF2F2', color: '#DC2626', label: 'Crítico' },
    agotado: { bg: '#F1F5F9', color: '#64748B', label: 'Agotado' },
  };
  const s = map[estado] || map.normal;
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
};

interface OtherLocationStock {
  location_id: string;
  location_name: string;
  quantity: number;
}

interface StockRequestItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  location_id: string;
  location_name: string;
  quantity_needed: number;
  created_at: string;
  other_locations_stock: OtherLocationStock[];
}

interface TransferSuggestion {
  productId: string;
  productName: string;
  originLocationId: string;
  destinationLocationId: string;
  quantity: number;
}

interface InventoryProps {
  onNavigate?: (page: string) => void;
  onRequestTransfer?: (suggestion: TransferSuggestion) => void;
}

export default function Inventory({ onNavigate, onRequestTransfer }: InventoryProps) {
  const { isAdmin } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationFilter, setLocationFilter] = useState<string>(''); // '' = todas las sucursales
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

  // Solicitudes de reposición pendientes (generadas al forzar ventas sin stock)
  const [stockRequests, setStockRequests] = useState<StockRequestItem[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Modal de ajuste manual
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<'IN' | 'OUT'>('IN');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [savingAdjust, setSavingAdjust] = useState(false);

  useEffect(() => {
    loadLocations();
    loadStockRequests();
  }, []);

  useEffect(() => {
    loadStock();
  }, [locationFilter]);

  const loadStockRequests = async () => {
    try {
      const res = await api.get('/stock-requests', { params: { status: 'PENDIENTE' } });
      setStockRequests(res.data);
    } catch (error) {
      console.error('Error cargando solicitudes de reposición:', error);
    }
  };

  const handleResolveRequest = async (id: string) => {
    setResolvingId(id);
    try {
      await api.put(`/stock-requests/${id}/resolve`, {});
      setStockRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Error al resolver solicitud:', error);
      alert('No se pudo marcar como atendida.');
    } finally {
      setResolvingId(null);
    }
  };

  const loadLocations = async () => {
    try {
      const res = await api.get('/locations');
      setLocations(res.data.filter((l: Location) => l.is_active));
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    }
  };

  const loadStock = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/stock', {
        params: locationFilter ? { location_id: locationFilter } : {},
      });
      setStockItems(res.data);
    } catch (error) {
      console.error('Error cargando stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const estados = ['todos', 'normal', 'bajo', 'critico', 'agotado'];

  const filtered = stockItems.filter((p) => {
    const term = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term);
    const matchEstado = filterEstado === 'todos' || p.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const totalProductos = new Set(stockItems.map((p) => p.product_id)).size;
  const countNormal = stockItems.filter((p) => p.estado === 'normal').length;
  const countBajoCritico = stockItems.filter((p) => p.estado === 'bajo' || p.estado === 'critico').length;
  const countAgotado = stockItems.filter((p) => p.estado === 'agotado').length;

  const openAdjustModal = (item: StockItem) => {
    setAdjustItem(item);
    setAdjustDirection('IN');
    setAdjustQuantity('');
    setAdjustReason('');
  };

  const closeAdjustModal = () => setAdjustItem(null);

  const handleSaveAdjustment = async () => {
    if (!adjustItem) return;
    const qty = parseFloat(adjustQuantity);
    if (!qty || qty <= 0) {
      alert('Ingresa una cantidad válida.');
      return;
    }
    if (!adjustReason.trim()) {
      alert('Indica el motivo del ajuste (ej. merma, conteo físico).');
      return;
    }

    setSavingAdjust(true);
    try {
      await api.post('/inventory/adjustments', {
        product_id: adjustItem.product_id,
        location_id: adjustItem.location_id,
        quantity: qty,
        direction: adjustDirection,
        reason: adjustReason.trim(),
      });
      closeAdjustModal();
      loadStock();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al registrar el ajuste.');
      console.error(error);
    } finally {
      setSavingAdjust(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Inventario</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalProductos} producto{totalProductos !== 1 ? 's' : ''}
            {locationFilter ? ` en ${locations.find((l) => l.id === locationFilter)?.name || ''}` : ' en todas las sucursales'}
          </p>
        </div>
        <button
          onClick={() => onNavigate?.('traslados')}
          className="px-4 py-2 rounded-lg text-white text-sm font-display font-semibold text-center hover:opacity-90 transition-opacity"
          style={{ background: '#1D2647' }}
        >
          🔁 Traslados entre sucursales
        </button>
      </div>

      {/* Solicitudes de reposición pendientes */}
      {stockRequests.length > 0 && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #FBBF24' }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#FFFBEB' }}>
            <span className="text-lg">⚠️</span>
            <h3 className="font-display font-semibold text-sm" style={{ color: '#92400E' }}>
              {stockRequests.length} solicitud{stockRequests.length !== 1 ? 'es' : ''} de reposición pendiente{stockRequests.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div className="divide-y divide-amber-50">
            {stockRequests.map((r) => {
              // Si hay stock en otra sucursal, sugerimos la que tiene más disponible
              const bestOther = [...r.other_locations_stock].sort((a, b) => b.quantity - a.quantity)[0];
              return (
                <div key={r.id} className="p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm">
                      <span className="font-medium text-slate-800">{r.product_name}</span>
                      <span className="text-slate-500"> — se vendió sin stock en <span className="font-medium">{r.location_name}</span>. Faltan <span className="font-bold text-red-600">{r.quantity_needed}</span> unidades.</span>
                    </div>
                    <button
                      onClick={() => handleResolveRequest(r.id)}
                      disabled={resolvingId === r.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 whitespace-nowrap"
                      style={{ background: '#1D2647' }}
                    >
                      {resolvingId === r.id ? 'Guardando...' : 'Ya la atendí'}
                    </button>
                  </div>

                  {bestOther ? (
                    <div className="flex items-center justify-between gap-3 flex-wrap pl-0 sm:pl-1">
                      <div className="text-xs text-slate-500">
                        ✅ Hay <span className="font-bold text-slate-700">{bestOther.quantity}</span> disponibles en <span className="font-medium">{bestOther.location_name}</span>.
                      </div>
                      <button
                        onClick={() =>
                          onRequestTransfer?.({
                            productId: r.product_id,
                            productName: r.product_name,
                            originLocationId: bestOther.location_id,
                            destinationLocationId: r.location_id,
                            quantity: Math.min(r.quantity_needed, bestOther.quantity),
                          })
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                        style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FBBF24' }}
                      >
                        🔁 Pedir traslado desde {bestOther.location_name}
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs pl-0 sm:pl-1" style={{ color: '#991B1B' }}>
                      ⚠️ No hay stock de este producto en ninguna otra sucursal. Hay que comprar al proveedor.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Stock normal', value: countNormal, icon: '✅', color: '#16a34a' },
          { label: 'Stock crítico / bajo', value: countBajoCritico, icon: '⚠️', color: '#D97706' },
          { label: 'Agotados', value: countAgotado, icon: '⛔', color: '#DC2626' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl p-4 flex items-center gap-3" style={{ border: '1px solid #E5E7EB' }}>
            <span className="text-2xl">{c.icon}</span>
            <div>
              <div className="font-display font-bold text-xl" style={{ color: c.color }}>{c.value}</div>
              <div className="text-xs text-slate-500">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap gap-3 items-center" style={{ border: '1px solid #E5E7EB' }}>
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{ border: '1px solid #E5E7EB', fontFamily: 'Inter' }}
            onFocus={(e) => (e.target.style.borderColor = '#ED871B')}
            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ border: '1px solid #E5E7EB', fontFamily: 'Inter', color: '#374151' }}
        >
          <option value="">Todas las sucursales</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <div className="flex gap-1 flex-wrap">
          {estados.map((e) => (
            <button
              key={e}
              onClick={() => setFilterEstado(e)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors"
              style={{
                background: filterEstado === e ? '#1D2647' : '#F0F2F5',
                color: filterEstado === e ? '#fff' : '#64748B',
                fontFamily: 'Outfit',
              }}
            >
              {e === 'todos' ? 'Todos' : e}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla (desktop) */}
      <div className="hidden md:block bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB' }}>
              {['SKU', 'Producto', ...(locationFilter ? [] : ['Sucursal']), 'Stock actual', 'Stock mín.', 'Estado', ...(isAdmin ? ['Acciones'] : [])].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((p) => (
              <tr key={`${p.product_id}-${p.location_id}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku || '—'}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{p.name}</div>
                </td>
                {!locationFilter && <td className="px-4 py-3 text-slate-600 text-xs">{p.location_name}</td>}
                <td className="px-4 py-3">
                  <span
                    className="font-mono font-bold text-sm"
                    style={{ color: p.estado === 'agotado' ? '#DC2626' : p.estado === 'critico' ? '#DC2626' : p.estado === 'bajo' ? '#D97706' : '#16a34a' }}
                  >
                    {p.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.stock_minimo}</td>
                <td className="px-4 py-3">{estadoBadge(p.estado)}</td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openAdjustModal(p)}
                      className="px-2.5 py-1 rounded text-xs font-medium hover:opacity-90 transition-opacity text-white"
                      style={{ background: '#1D2647' }}
                    >
                      Ajustar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-display">
            No se encontraron productos
          </div>
        )}
        {loading && (
          <div className="text-center py-12 text-slate-400 font-display">Cargando inventario...</div>
        )}
      </div>

      {/* Tarjetas (mobile) */}
      <div className="md:hidden space-y-3">
        {loading && <div className="text-center py-8 text-slate-400 text-sm">Cargando inventario...</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">No se encontraron productos</div>
        )}
        {filtered.map((p) => (
          <div key={`${p.product_id}-${p.location_id}`} className="bg-white rounded-xl p-4 space-y-2" style={{ border: '1px solid #E5E7EB' }}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-medium text-slate-800">{p.name}</div>
                <div className="text-xs text-slate-400 font-mono">{p.sku || '—'}{!locationFilter ? ` • ${p.location_name}` : ''}</div>
              </div>
              {estadoBadge(p.estado)}
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Stock: <span className="font-mono font-bold text-slate-800">{p.quantity}</span> (mín. {p.stock_minimo})</span>
              {isAdmin && (
                <button
                  onClick={() => openAdjustModal(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                  style={{ background: '#1D2647' }}
                >
                  Ajustar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de ajuste manual */}
      {adjustItem && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={closeAdjustModal}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-display font-bold text-lg text-slate-800">Ajuste de inventario</h3>
              <p className="text-sm text-slate-500">{adjustItem.name} — {adjustItem.location_name}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setAdjustDirection('IN')}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: adjustDirection === 'IN' ? '#16a34a' : '#F0F2F5',
                  color: adjustDirection === 'IN' ? '#fff' : '#64748B',
                }}
              >
                + Entrada
              </button>
              <button
                onClick={() => setAdjustDirection('OUT')}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: adjustDirection === 'OUT' ? '#DC2626' : '#F0F2F5',
                  color: adjustDirection === 'OUT' ? '#fff' : '#64748B',
                }}
              >
                − Salida
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">Cantidad</label>
              <input
                type="number"
                step="0.01"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1">Motivo</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none border focus:border-orange-500"
                placeholder="Ej. Merma, conteo físico, producto dañado..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={closeAdjustModal}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-600"
                style={{ border: '1px solid #E5E7EB' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAdjustment}
                disabled={savingAdjust}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: '#ED871B' }}
              >
                {savingAdjust ? 'Guardando...' : 'Guardar ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}