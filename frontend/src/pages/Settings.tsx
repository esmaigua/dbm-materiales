import { useState } from 'react';

const tabs = ['General', 'Usuarios', 'Impuestos', 'Notificaciones', 'Integración IA'];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('General');

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ajustes del sistema DBM</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1" style={{ border: '1px solid #E5E7EB', width: 'fit-content' }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-display font-medium transition-all"
            style={{
              background: activeTab === t ? '#1D2647' : 'transparent',
              color: activeTab === t ? '#fff' : '#64748B',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'General' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
            <h3 className="font-display font-semibold text-slate-800 mb-4">Información del negocio</h3>
            <div className="space-y-3">
              {[
                { label: 'Nombre del negocio', value: 'DBM Materiales y Acabados' },
                { label: 'RUC', value: '1791234567001' },
                { label: 'Dirección', value: 'Quito, Ecuador' },
                { label: 'Teléfono', value: '022345678' },
                { label: 'Correo', value: 'info@dbm.ec' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs text-slate-500 block mb-1">{f.label}</label>
                  <input
                    defaultValue={f.value}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #E5E7EB', fontFamily: 'Inter' }}
                    onFocus={(e) => (e.target.style.borderColor = '#ED871B')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
              <h3 className="font-display font-semibold text-slate-800 mb-4">Configuración de ventas</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Permitir ventas bajo pedido</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only" id="vpedido" />
                    <div className="w-10 h-5 rounded-full cursor-pointer" style={{ background: '#E5E7EB' }} />
                  </div>
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Aplicar IVA automáticamente</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only" id="iva" defaultChecked />
                    <div className="w-10 h-5 rounded-full cursor-pointer" style={{ background: '#ED871B' }} />
                  </div>
                </label>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Porcentaje IVA</label>
                  <input defaultValue="12" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid #E5E7EB' }} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #E5E7EB' }}>
              <h3 className="font-display font-semibold text-slate-800 mb-4">Alertas de stock</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Días para alerta de reposición</label>
                  <input defaultValue="7" type="number" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid #E5E7EB' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Umbral stock crítico (%)</label>
                  <input defaultValue="20" type="number" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: '1px solid #E5E7EB' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Usuarios' && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
          <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: '#E5E7EB' }}>
            <h3 className="font-display font-semibold text-slate-800">Usuarios del sistema</h3>
            <button className="px-3 py-1.5 rounded-lg text-xs font-display font-semibold text-white" style={{ background: '#ED871B' }}>
              + Nuevo usuario
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB' }}>
                {['Usuario', 'Correo', 'Rol', 'Estado', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { nombre: 'Administrador', correo: 'admin@dbm.ec', rol: 'Administrador', estado: 'activo' },
                { nombre: 'Vendedor 1', correo: 'vendedor1@dbm.ec', rol: 'Vendedor', estado: 'activo' },
                { nombre: 'Bodeguero', correo: 'bodega@dbm.ec', rol: 'Bodeguero', estado: 'activo' },
              ].map((u) => (
                <tr key={u.correo} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.nombre}</td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{u.correo}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(29,38,71,0.08)', color: '#1D2647' }}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#F0FDF4', color: '#16a34a' }}>
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-slate-500 hover:text-slate-700">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(activeTab === 'Impuestos' || activeTab === 'Notificaciones' || activeTab === 'Integración IA') && (
        <div className="bg-white rounded-xl p-8 text-center" style={{ border: '1px solid #E5E7EB' }}>
          <div className="text-4xl mb-3">⚙️</div>
          <h3 className="font-display font-semibold text-slate-700 mb-1">Módulo en desarrollo</h3>
          <p className="text-sm text-slate-400">Esta sección estará disponible próximamente.</p>
        </div>
      )}

      <div className="flex justify-end">
        <button className="px-6 py-2.5 rounded-xl font-display font-semibold text-white text-sm" style={{ background: '#ED871B' }}>
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
