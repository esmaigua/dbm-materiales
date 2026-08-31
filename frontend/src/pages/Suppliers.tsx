import { proveedores } from '../data/mockData';

export default function Suppliers() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-800">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-0.5">{proveedores.length} proveedores activos</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-white text-sm font-display font-semibold" style={{ background: '#ED871B' }}>
          + Nuevo proveedor
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {proveedores.map((p) => (
          <div key={p.id} className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-white text-base flex-shrink-0"
                style={{ background: '#1D2647' }}
              >
                {p.nombre[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-slate-800 text-sm leading-tight">{p.nombre}</div>
                <div className="font-mono text-xs text-slate-400 mt-0.5">{p.ruc}</div>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{ background: '#F0FDF4', color: '#16a34a' }}
              >
                {p.estado}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="text-slate-400 w-4">👤</span>
                <span className="text-xs">{p.contacto}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="text-slate-400 w-4">📞</span>
                <span className="text-xs font-mono">{p.telefono}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="text-slate-400 w-4">✉️</span>
                <span className="text-xs truncate">{p.correo}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="text-slate-400 w-4">📍</span>
                <span className="text-xs">{p.ciudad}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: '#F0F2F5' }}>
              <div>
                <span className="font-display font-bold text-lg" style={{ color: '#1D2647' }}>{p.productos}</span>
                <span className="text-xs text-slate-400 ml-1">productos</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Entrega</div>
                <div className="text-xs font-medium" style={{ color: '#ED871B' }}>{p.tiempoEntrega}</div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button className="flex-1 py-1.5 rounded-lg text-xs font-display font-medium text-slate-600 hover:bg-gray-50 transition-colors" style={{ border: '1px solid #E5E7EB' }}>
                Ver productos
              </button>
              <button className="flex-1 py-1.5 rounded-lg text-xs font-display font-medium text-white" style={{ background: '#1D2647' }}>
                Nueva compra
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
