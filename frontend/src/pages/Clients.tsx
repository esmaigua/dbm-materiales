import { clientes } from '../data/mockData';

export default function Clients() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clientes.length} clientes registrados</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-white text-sm font-display font-semibold" style={{ background: '#ED871B' }}>
          + Nuevo cliente
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total clientes', value: '187', icon: '👥' },
          { label: 'Empresas', value: '42', icon: '🏢' },
          { label: 'Personas naturales', value: '145', icon: '👤' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl p-4 flex items-center gap-3" style={{ border: '1px solid #E5E7EB' }}>
            <span className="text-2xl">{c.icon}</span>
            <div>
              <div className="font-display font-bold text-xl text-slate-800">{c.value}</div>
              <div className="text-xs text-slate-500">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
          <input
            placeholder="Buscar cliente por nombre, cédula o RUC..."
            className="w-full px-4 py-2 rounded-lg text-sm outline-none max-w-sm"
            style={{ border: '1px solid #E5E7EB', fontFamily: 'Inter' }}
            onFocus={(e) => (e.target.style.borderColor = '#ED871B')}
            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB' }}>
              {['Cliente', 'Cédula/RUC', 'Teléfono', 'Correo', 'Tipo', 'Total comprado', '# Compras', 'Última compra', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {clientes.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: '#1D2647' }}
                    >
                      {c.nombre[0]}
                    </div>
                    <span className="font-medium text-slate-800">{c.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.cedula}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{c.telefono}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{c.correo}</td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: c.tipo === 'Empresa' ? 'rgba(29,38,71,0.08)' : '#F0F2F5',
                      color: c.tipo === 'Empresa' ? '#1D2647' : '#64748B',
                    }}
                  >
                    {c.tipo}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-bold" style={{ color: '#ED871B' }}>
                  ${c.totalComprado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 font-mono text-center text-slate-700">{c.numCompras}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{c.ultimaCompra}</td>
                <td className="px-4 py-3">
                  <button className="text-xs font-medium text-slate-500 hover:text-slate-700">Ver historial</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
