import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ventasMensuales, productosMasVendidos, categorias } from '../data/mockData';

const COLORS = ['#ED871B', '#1D2647', '#64748B', '#94A3B8', '#CBD5E1'];

export default function Reports() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Reportes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Análisis de ventas y movimientos</p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 rounded-lg text-sm outline-none font-display" style={{ border: '1px solid #E5E7EB', color: '#374151' }}>
            <option>Últimos 7 meses</option>
            <option>Último mes</option>
            <option>Último año</option>
          </select>
          <button className="px-4 py-2 rounded-lg text-sm font-display font-medium text-slate-600" style={{ border: '1px solid #E5E7EB', background: '#fff' }}>
            📥 Exportar PDF
          </button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Ventas totales', value: '$160,940', sub: 'Últimos 7 meses', accent: true },
          { label: 'Costo de compras', value: '$86,400', sub: 'Período seleccionado' },
          { label: 'Margen bruto', value: '$74,540', sub: '46.3%' },
          { label: 'Transacciones', value: '248', sub: 'Ventas registradas' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl p-4" style={{ border: '1px solid #E5E7EB' }}>
            <div
              className="font-display font-bold text-xl"
              style={{ color: c.accent ? '#ED871B' : '#1a1a2e' }}
            >
              {c.value}
            </div>
            <div className="text-xs font-medium text-slate-700 mt-0.5">{c.label}</div>
            <div className="text-xs text-slate-400">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Área ventas */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
          <h3 className="font-display font-semibold text-slate-800 mb-1">Evolución de ventas</h3>
          <p className="text-xs text-slate-400 mb-4">Comparado con compras</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ventasMensuales}>
              <defs>
                <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ED871B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ED871B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fontFamily: 'Inter', fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} contentStyle={{ fontFamily: 'Inter', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8 }} />
              <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#ED871B" strokeWidth={2} fill="url(#gVentas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie categorías */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
          <h3 className="font-display font-semibold text-slate-800 mb-1">Ventas por categoría</h3>
          <p className="text-xs text-slate-400 mb-4">Distribución porcentual</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={categorias} dataKey="valor" nameKey="nombre" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {categorias.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}%`, '']} contentStyle={{ fontFamily: 'Inter', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categorias.map((c, i) => (
                <div key={c.nombre} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                  <span className="text-xs text-slate-600 flex-1">{c.nombre}</span>
                  <span className="font-mono text-xs font-bold text-slate-800">{c.valor}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top productos bar */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
          <h3 className="font-display font-semibold text-slate-800 mb-1">Productos más vendidos</h3>
          <p className="text-xs text-slate-400 mb-4">Por unidades — agosto 2026</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={productosMasVendidos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fontFamily: 'Inter', fill: '#6B7280' }} axisLine={false} tickLine={false} width={95} />
              <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8 }} />
              <Bar dataKey="unidades" name="Unidades" radius={[0, 4, 4, 0]}>
                {productosMasVendidos.map((_, i) => <Cell key={i} fill={i === 0 ? '#ED871B' : '#1D2647'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ventas vs Compras grouped */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
          <h3 className="font-display font-semibold text-slate-800 mb-1">Margen bruto mensual</h3>
          <p className="text-xs text-slate-400 mb-4">Ventas vs Costo de compras</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ventasMensuales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fontFamily: 'Inter', fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} contentStyle={{ fontFamily: 'Inter', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 12 }} />
              <Bar dataKey="ventas" name="Ventas" fill="#ED871B" radius={[3, 3, 0, 0]} />
              <Bar dataKey="compras" name="Compras" fill="#1D2647" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
