import { useState } from 'react';

type MovType = 'compra' | 'venta' | 'ajuste+' | 'ajuste-' | 'devolucion' | 'perdida' | 'daño' | 'inicial';

const movimientos = [
  { id: 'MV-0412', tipo: 'venta' as MovType, producto: 'Duela PVC Blanca 10cm', sku: 'DPV-BL-01', cantidad: -12, fecha: '2026-08-25 09:42', usuario: 'Administrador', documento: 'V-0248', precio: 4.50, observaciones: '' },
  { id: 'MV-0411', tipo: 'venta' as MovType, producto: 'Panel Cielo Raso Blanco 60x60', sku: 'PCR-BL-01', cantidad: -8, fecha: '2026-08-25 09:15', usuario: 'Administrador', documento: 'V-0247', precio: 3.20, observaciones: '' },
  { id: 'MV-0410', tipo: 'compra' as MovType, producto: 'Duela PVC Blanca 10cm', sku: 'DPV-BL-01', cantidad: 120, fecha: '2026-08-22 14:00', usuario: 'Administrador', documento: 'C-0089', precio: 2.80, observaciones: 'Lote agosto' },
  { id: 'MV-0409', tipo: 'venta' as MovType, producto: 'Perfil Aluminio Omega 3m', sku: 'PFA-AL-01', cantidad: -5, fecha: '2026-08-24 16:30', usuario: 'Vendedor 1', documento: 'V-0246', precio: 7.80, observaciones: '' },
  { id: 'MV-0408', tipo: 'ajuste-' as MovType, producto: 'Moldura Madera Colonial', sku: 'MOL-MD-01', cantidad: -3, fecha: '2026-08-23 11:00', usuario: 'Bodeguero', documento: '', precio: 0, observaciones: 'Daño en almacén — humedad' },
  { id: 'MV-0407', tipo: 'devolucion' as MovType, producto: 'Tornillo Autoperf. 3/4"', sku: 'TOR-ACR-01', cantidad: 2, fecha: '2026-08-22 10:20', usuario: 'Vendedor 1', documento: 'V-0240', precio: 5.80, observaciones: 'Cliente devuelve — caja incorrecta' },
  { id: 'MV-0406', tipo: 'ajuste+' as MovType, producto: 'Adhesivo PVC 250ml', sku: 'ADH-PVC-01', cantidad: 15, fecha: '2026-08-20 08:00', usuario: 'Administrador', documento: '', precio: 3.80, observaciones: 'Ajuste inventario físico' },
  { id: 'MV-0405', tipo: 'compra' as MovType, producto: 'Cornisa MDF 8cm', sku: 'COR-MDF-01', cantidad: 80, fecha: '2026-08-18 13:45', usuario: 'Administrador', documento: 'C-0088', precio: 1.60, observaciones: '' },
  { id: 'MV-0404', tipo: 'perdida' as MovType, producto: 'Moldura Madera Colonial', sku: 'MOL-MD-01', cantidad: -5, fecha: '2026-08-15 09:00', usuario: 'Bodeguero', documento: '', precio: 0, observaciones: 'Pérdida por transporte' },
  { id: 'MV-0403', tipo: 'venta' as MovType, producto: 'Panel Cielo Raso Blanco 60x60', sku: 'PCR-BL-01', cantidad: -24, fecha: '2026-08-14 15:20', usuario: 'Vendedor 1', documento: 'V-0243', precio: 3.20, observaciones: '' },
];

const tipoConfig: Record<MovType, { label: string; bg: string; color: string; icon: string }> = {
  compra:     { label: 'Compra',        bg: '#F0FDF4', color: '#16a34a', icon: '⬆️' },
  venta:      { label: 'Venta',         bg: '#FFF7ED', color: '#C2410C', icon: '⬇️' },
  'ajuste+':  { label: 'Ajuste +',     bg: '#F0F9FF', color: '#0369A1', icon: '➕' },
  'ajuste-':  { label: 'Ajuste −',     bg: '#FEF2F2', color: '#DC2626', icon: '➖' },
  devolucion: { label: 'Devolución',   bg: '#F5F3FF', color: '#7C3AED', icon: '↩️' },
  perdida:    { label: 'Pérdida',       bg: '#FEF2F2', color: '#DC2626', icon: '🔻' },
  daño:       { label: 'Daño',          bg: '#FEF2F2', color: '#B91C1C', icon: '⚠️' },
  inicial:    { label: 'Inv. inicial',  bg: '#F8F9FA', color: '#374151', icon: '📋' },
};

const ALL_TIPOS: MovType[] = ['compra', 'venta', 'ajuste+', 'ajuste-', 'devolucion', 'perdida', 'daño', 'inicial'];

export default function Movements() {
  const [filterTipo, setFilterTipo] = useState<'todos' | MovType>('todos');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = movimientos.filter((m) => {
    const matchTipo = filterTipo === 'todos' || m.tipo === filterTipo;
    const matchSearch =
      m.producto.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.documento.toLowerCase().includes(search.toLowerCase());
    return matchTipo && matchSearch;
  });

  const totalEntradas = movimientos.filter((m) => m.cantidad > 0).reduce((a, m) => a + m.cantidad, 0);
  const totalSalidas = Math.abs(movimientos.filter((m) => m.cantidad < 0).reduce((a, m) => a + m.cantidad, 0));

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Movimientos de Inventario</h1>
          <p className="text-sm text-slate-500 mt-0.5">Registro completo de cambios de stock</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-white text-sm font-display font-semibold"
          style={{ background: '#ED871B' }}
        >
          + Registrar movimiento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Movimientos hoy', value: '12', icon: '📋', color: '#1D2647' },
          { label: 'Entradas totales', value: `+${totalEntradas}`, icon: '⬆️', color: '#16a34a' },
          { label: 'Salidas totales', value: `−${totalSalidas}`, icon: '⬇️', color: '#C2410C' },
          { label: 'Ajustes del mes', value: '3', icon: '⚖️', color: '#7C3AED' },
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
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto, SKU o documento..."
            className="pl-9 pr-4 py-2 rounded-lg text-sm outline-none w-64"
            style={{ border: '1px solid #E5E7EB', fontFamily: 'Inter' }}
            onFocus={(e) => (e.target.style.borderColor = '#ED871B')}
            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterTipo('todos')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: filterTipo === 'todos' ? '#1D2647' : '#F0F2F5', color: filterTipo === 'todos' ? '#fff' : '#64748B', fontFamily: 'Outfit' }}
          >
            Todos
          </button>
          {ALL_TIPOS.map((t) => (
            <button
              key={t}
              onClick={() => setFilterTipo(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: filterTipo === t ? tipoConfig[t].color : tipoConfig[t].bg,
                color: filterTipo === t ? '#fff' : tipoConfig[t].color,
                fontFamily: 'Outfit',
              }}
            >
              {tipoConfig[t].icon} {tipoConfig[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB' }}>
              {['#', 'Tipo', 'Producto', 'SKU', 'Cantidad', 'Precio unit.', 'Fecha', 'Usuario', 'Documento', 'Observaciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((m) => {
              const cfg = tipoConfig[m.tipo];
              return (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{m.id}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.icon} {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-40">
                    <span className="block truncate">{m.producto}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{m.sku}</td>
                  <td className="px-4 py-3">
                    <span
                      className="font-mono font-bold text-sm"
                      style={{ color: m.cantidad > 0 ? '#16a34a' : '#DC2626' }}
                    >
                      {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {m.precio > 0 ? `$${m.precio.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{m.fecha}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{m.usuario}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: m.documento ? '#1D2647' : '#CBD5E1' }}>
                    {m.documento || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-36">
                    <span className="block truncate" title={m.observaciones}>
                      {m.observaciones || '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 font-display">Sin movimientos para este filtro</div>
        )}
        <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-slate-500" style={{ borderColor: '#E5E7EB' }}>
          <span>{filtered.length} movimientos</span>
          <button className="text-xs font-medium" style={{ color: '#ED871B' }}>Exportar registro →</button>
        </div>
      </div>

      {/* Modal: Registrar movimiento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
              <h2 className="font-display font-bold text-lg text-slate-800">Registrar movimiento</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Tipo de movimiento</label>
                <select className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid #E5E7EB', fontFamily: 'Inter', color: '#374151' }}>
                  {ALL_TIPOS.map((t) => <option key={t} value={t}>{tipoConfig[t].icon} {tipoConfig[t].label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Producto</label>
                <input placeholder="Buscar producto..." className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid #E5E7EB', fontFamily: 'Inter' }} onFocus={(e) => (e.target.style.borderColor = '#ED871B')} onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Cantidad</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid #E5E7EB', fontFamily: 'JetBrains Mono' }} onFocus={(e) => (e.target.style.borderColor = '#ED871B')} onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Precio unitario</label>
                  <input type="number" placeholder="0.00" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid #E5E7EB', fontFamily: 'JetBrains Mono' }} onFocus={(e) => (e.target.style.borderColor = '#ED871B')} onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Documento relacionado</label>
                <input placeholder="Ej: V-0248, C-0089 (opcional)" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid #E5E7EB', fontFamily: 'Inter' }} onFocus={(e) => (e.target.style.borderColor = '#ED871B')} onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Motivo / Observaciones</label>
                <textarea rows={2} placeholder="Descripción del movimiento..." className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{ border: '1px solid #E5E7EB', fontFamily: 'Inter' }} onFocus={(e) => (e.target.style.borderColor = '#ED871B')} onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
              </div>
              <div className="p-3 rounded-lg text-xs" style={{ background: '#FFF7ED', color: '#92400E' }}>
                ⚠️ Este movimiento actualizará automáticamente el stock del producto seleccionado y no podrá revertirse sin un ajuste inverso.
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-display font-medium text-slate-600" style={{ border: '1px solid #E5E7EB' }}>
                Cancelar
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-display font-semibold text-white" style={{ background: '#ED871B' }}>
                Registrar movimiento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
