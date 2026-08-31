interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  return (
    <div className="min-h-screen flex" style={{ background: '#0f1629' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: '#1D2647' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-white text-lg"
              style={{ background: '#ED871B' }}
            >
              D
            </div>
            <span className="font-display font-bold text-white text-xl tracking-wide">
              DBM Materiales y Acabados
            </span>
          </div>
          <div className="max-w-sm">
            <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4">
              Sistema de Gestión Inteligente
            </h1>
            <p className="text-slate-300 text-base leading-relaxed">
              Control total de inventario, ventas, compras y decisiones basadas en datos reales del negocio.
            </p>
          </div>
        </div>

        {/* Stats preview */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Productos activos', value: '312' },
            { label: 'Ventas este mes', value: '$28,340' },
            { label: 'Clientes registrados', value: '187' },
            { label: 'Precisión IA', value: '94%' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="font-display font-bold text-2xl text-white">{s.value}</div>
              <div className="text-slate-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <div className="flex items-center gap-3 mb-8 lg:hidden justify-center">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-white"
                style={{ background: '#ED871B' }}
              >
                D
              </div>
              <span className="font-display font-bold text-white text-lg">DBM Materiales</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-white mb-2">Iniciar sesión</h2>
            <p className="text-slate-400 text-sm">Ingresa tus credenciales para continuar</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1.5">
                Usuario
              </label>
              <input
                defaultValue="admin@dbm.ec"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:ring-2 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'Inter, sans-serif',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#ED871B')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                defaultValue="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'Inter, sans-serif',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#ED871B')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-slate-400 text-sm">Recordarme</span>
              </label>
              <button className="text-sm" style={{ color: '#ED871B' }}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <button
              onClick={onLogin}
              className="w-full py-3.5 rounded-xl font-display font-semibold text-white text-base transition-all hover:opacity-90 active:scale-98 mt-2"
              style={{ background: '#ED871B' }}
            >
              Ingresar al sistema
            </button>
          </div>

          <p className="text-center text-slate-600 text-xs mt-8">
            DBM Materiales y Acabados © 2026 — Sistema v2.1
          </p>
        </div>
      </div>
    </div>
  );
}
