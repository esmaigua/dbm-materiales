import { type ReactNode, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { id: 'dashboard', icon: '▦', label: 'Dashboard' },
  { id: 'inventario', icon: '📦', label: 'Inventario' },
  { id: 'traslados', icon: '🔁', label: 'Traslados' },
  { id: 'productos', icon: '🏷️', label: 'Productos' },
  { id: 'movimientos', icon: '🔄', label: 'Movimientos' },
  { id: 'ventas', icon: '🛒', label: 'Ventas' },
  { id: 'proformas', icon: '📋', label: 'Proformas' },
  { id: 'compras', icon: '🚚', label: 'Compras', adminOnly: true },
  { id: 'clientes', icon: '👥', label: 'Clientes' },
  { id: 'proveedores', icon: '🏭', label: 'Proveedores', adminOnly: true },
  { id: 'reportes', icon: '📊', label: 'Reportes', adminOnly: true },
  { id: 'asistente', icon: '🤖', label: 'Asistente DBM', adminOnly: true },
];

// Páginas que un Vendedor no debe poder abrir (ni por el menú, ni por un
// botón de atajo en otra pantalla). Se usa también en App.tsx como respaldo.
export const ADMIN_ONLY_PAGES = navItems.filter((i) => i.adminOnly).map((i) => i.id);

const bottomItems = [
  { id: 'configuracion', icon: '⚙️', label: 'Configuración' },
];

interface LayoutProps {
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface StockItem {
  estado: 'normal' | 'bajo' | 'critico' | 'agotado';
}

export default function Layout({ children, activePage, onNavigate, onLogout }: LayoutProps) {
  const { user, role } = useAuth();
  const [criticalCount, setCriticalCount] = useState(0);

  // Conteo real de productos en estado crítico/agotado (reemplaza el dato
  // fijo que venía de data/mockData.ts, que nunca coincidía con la realidad)
  useEffect(() => {
    const loadCriticalCount = async () => {
      try {
        const res = await api.get('/inventory/stock');
        const count = res.data.filter((s: StockItem) => s.estado === 'critico' || s.estado === 'agotado').length;
        setCriticalCount(count);
      } catch (error) {
        console.error('Error cargando el conteo de stock crítico:', error);
      }
    };
    loadCriticalCount();
  }, [activePage]);

  const userEmail = user?.email || '';
  const userInitial = userEmail.charAt(0).toUpperCase() || '?';
  const roleLabel = role === 'ADMIN' ? 'Administrador' : 'Vendedor';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F0F2F5' }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col flex-shrink-0 sidebar-scroll overflow-y-auto"
        style={{ background: '#1D2647' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-white text-lg flex-shrink-0"
            style={{ background: '#ED871B' }}
          >
            D
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm leading-tight">DBM</div>
            <div className="text-xs text-slate-400 leading-tight">Materiales y Acabados</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.filter((item) => !item.adminOnly || role === 'ADMIN').map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left relative"
                style={{
                  background: isActive ? '#ED871B' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  fontFamily: 'Outfit, sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
                  }
                }}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'inventario' && criticalCount > 0 && (
                  <span
                    className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#ef4444', color: '#fff', fontSize: '10px' }}
                  >
                    {criticalCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t space-y-0.5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {bottomItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isActive ? '#ED871B' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  fontFamily: 'Outfit, sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
                  }
                }}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: '#ED871B' }}
            >
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate font-display">{roleLabel}</div>
              <div className="text-xs text-slate-400 truncate">{userEmail || 'Sin correo'}</div>
            </div>
            <button
              onClick={onLogout}
              className="text-slate-500 hover:text-slate-300 transition-colors text-xs"
              title="Cerrar sesión"
            >
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Top header */}
        <header
          className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
          style={{ background: '#ffffff', borderColor: '#E5E7EB' }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                placeholder="Buscar productos, clientes, ventas..."
                className="pl-9 pr-4 py-2 rounded-lg text-sm outline-none w-72 text-slate-700"
                style={{
                  background: '#F8F9FA',
                  border: '1px solid #E5E7EB',
                  fontFamily: 'Inter, sans-serif',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#ED871B')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-slate-600"
              onClick={() => onNavigate('inventario')}
              title="Alertas"
            >
              🔔
              {criticalCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                  style={{ background: '#ef4444', fontSize: '9px' }}
                >
                  {criticalCount}
                </span>
              )}
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: '#ED871B' }}
              >
                {userInitial}
              </div>
              <span className="text-sm font-medium text-slate-700 font-display">{roleLabel}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}