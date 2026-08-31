import { useState } from 'react';
import { productos } from '../data/mockData';

const estadoBadge = (estado: string) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    normal: { bg: '#F0FDF4', color: '#16a34a', label: 'Normal' },
    bajo: { bg: '#FFFBEB', color: '#D97706', label: 'Stock bajo' },
    crítico: { bg: '#FEF2F2', color: '#DC2626', label: 'Crítico' },
    agotado: { bg: '#F1F5F9', color: '#64748B', label: 'Agotado' },
  };
  const s = map[estado] || map.normal;
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
};

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterCat, setFilterCat] = useState('todas');

  const cats = ['todas', ...Array.from(new Set(productos.map((p) => p.categoria)))];
  const estados = ['todos', 'normal', 'bajo', 'crítico', 'agotado'];

  const filtered = productos.filter((p) => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'todos' || p.estado === filterEstado;
    const matchCat = filterCat === 'todas' || p.categoria === filterCat;
    return matchSearch && matchEstado && matchCat;
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Inventario</h1>
          <p className="text-sm text-slate-500 mt-0.5">{productos.length} productos registrados</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg text-sm font-display font-medium text-slate-600 hover:bg-gray-100 transition-colors" style={{ border: '1px solid #E5E7EB', background: '#fff' }}>
            📥 Importar
          </button>
          <button className="px-4 py-2 rounded-lg text-sm font-display font-medium text-slate-600 hover:bg-gray-100 transition-colors" style={{ border: '1px solid #E5E7EB', background: '#fff' }}>
            📤 Exportar
          </button>
          <button className="px-4 py-2 rounded-lg text-white text-sm font-display font-semibold" style={{ background: '#ED871B' }}>
            + Nuevo producto
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total productos', value: '312', icon: '📦', color: '#1D2647' },
          { label: 'Stock normal', value: '296', icon: '✅', color: '#16a34a' },
          { label: 'Stock crítico / bajo', value: '11', icon: '⚠️', color: '#D97706' },
          { label: 'Agotados', value: '5', icon: '⛔', color: '#DC2626' },
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
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ border: '1px solid #E5E7EB', fontFamily: 'Inter', color: '#374151' }}
        >
          {cats.map((c) => <option key={c} value={c}>{c === 'todas' ? 'Todas las categorías' : c}</option>)}
        </select>
        <div className="flex gap-1">
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

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB' }}>
              {['SKU', 'Producto', 'Categoría', 'Unidad', 'P. Venta', 'Stock actual', 'Stock mín.', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{p.nombre}</div>
                  <div className="text-xs text-slate-400">{p.marca}</div>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{p.categoria}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{p.unidad}</td>
                <td className="px-4 py-3 font-mono font-medium text-slate-800">${p.precioVenta.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span
                    className="font-mono font-bold text-sm"
                    style={{ color: p.stock === 0 ? '#DC2626' : p.stock < p.stockMin ? '#D97706' : '#16a34a' }}
                  >
                    {p.stock}
                  </span>
                  <span className="text-slate-400 text-xs ml-1">/{p.stockMax}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.stockMin}</td>
                <td className="px-4 py-3">{estadoBadge(p.estado)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="px-2.5 py-1 rounded text-xs font-medium text-slate-600 hover:bg-gray-100 transition-colors" style={{ border: '1px solid #E5E7EB' }}>
                      Ver
                    </button>
                    <button className="px-2.5 py-1 rounded text-xs font-medium hover:opacity-90 transition-opacity text-white" style={{ background: '#1D2647' }}>
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-display">
            No se encontraron productos
          </div>
        )}
        <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: '#E5E7EB' }}>
          <span className="text-sm text-slate-500">Mostrando {filtered.length} de {productos.length} productos</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className="w-7 h-7 rounded text-xs font-medium"
                style={{ background: p === 1 ? '#1D2647' : '#F0F2F5', color: p === 1 ? '#fff' : '#64748B' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
