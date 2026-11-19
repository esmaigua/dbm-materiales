import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import api from '../services/api';

const KPICard = ({ label, value, sub, icon, accent = false, danger = false }: any) => (
  <div className="bg-white rounded-xl p-5 flex items-start gap-4" style={{ border: '1px solid #E5E7EB' }}>
    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: danger ? '#FEF2F2' : accent ? 'rgba(237,135,27,0.1)' : '#F0F2F5' }}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</div>
      <div className="font-display font-bold text-2xl" style={{ color: danger ? '#ef4444' : '#1a1a2e' }}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setData(response.data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Analizando indicadores de negocio...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Error cargando el dashboard.</div>;

  const { kpis, alertas, productosMasVendidos } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen de operaciones en tiempo real</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Ventas del día" value={`$${kpis.ventasHoy.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} sub="Hoy" icon="💰" />
        <KPICard label="Ventas del mes" value={`$${kpis.ventasMes.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} sub="Periodo actual" icon="📈" accent />
        <KPICard label="Valor inventario" value={`$${kpis.valorInventario.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} sub={`${kpis.totalProductos} productos activos`} icon="📦" />
        <KPICard label="Stock crítico" value={`${kpis.stockCritico} productos`} sub="Requieren atención" icon="⚠️" danger={kpis.stockCritico > 0} />
      </div>

      {/* Second row KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Compras del mes" value={`$${kpis.comprasMes.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} sub="Gastos operativos" icon="🚚" />
        <KPICard label="Margen bruto (Est.)" value="45.0%" sub="Ventas - Costo" icon="📊" accent />
        <KPICard label="Proformas emitidas" value={`${kpis.proformasPendientes}`} sub="Pendientes de cobro" icon="📋" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Placeholder Gráfico Lineal (Datos de prueba para mantener diseño visual) */}
        <div className="col-span-2 bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-semibold text-slate-800">Ventas vs Compras</h3>
              <p className="text-xs text-slate-400 mt-0.5">El historial se construirá mes a mes</p>
            </div>
          </div>
          <div className="flex items-center justify-center h-[220px] bg-gray-50 rounded border border-dashed border-gray-300 text-gray-400 text-sm">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.historial} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                  <Line type="monotone" dataKey="ventas" name="Ventas" stroke="#ED871B" strokeWidth={3} dot={{ r: 4, fill: '#ED871B', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="compras" name="Compras" stroke="#1D2647" strokeWidth={3} dot={{ r: 4, fill: '#1D2647', strokeWidth: 0 }} />
              </LineChart>
              </ResponsiveContainer>
          </div>
        </div>

        {/* Top productos Reales */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
          <div className="mb-5">
            <h3 className="font-display font-semibold text-slate-800">Top Productos</h3>
            <p className="text-xs text-slate-400 mt-0.5">Unidades vendidas este mes</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            {productosMasVendidos.length > 0 ? (
              <BarChart data={productosMasVendidos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={(v: any) => [`${v} unid.`, 'Vendidas']} />
                <Bar dataKey="unidades" radius={[0, 4, 4, 0]}>
                  {productosMasVendidos.map((_: any, i: number) => (
                    <Cell key={i} fill={i === 0 ? '#ED871B' : '#1D2647'} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
               <div className="h-full flex items-center justify-center text-sm text-gray-400 text-center">Sin ventas este mes</div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas Reales */}
      <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-slate-800">Alertas del sistema</h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full font-bold" style={{ background: '#FEF2F2', color: '#ef4444' }}>
            {alertas.length} activas
          </span>
        </div>
        <div className="space-y-2">
          {alertas.length === 0 ? (
             <div className="text-sm text-green-600 font-medium py-2">Todo el inventario está en niveles normales ✅</div>
          ) : (
            alertas.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: a.tipo === 'crítico' || a.tipo === 'agotado' ? '#FEF2F2' : '#FFFBEB' }}>
                <span className="text-base">{a.tipo === 'agotado' ? '⛔' : '🔴'}</span>
                <span className="flex-1 text-sm text-slate-700">{a.mensaje}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">{a.tiempo}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}