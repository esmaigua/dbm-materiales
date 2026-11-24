import React, { useState, useEffect } from 'react';
import Layout, { ADMIN_ONLY_PAGES } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Movements from './pages/Movements';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Clients from './pages/Clients';
import Suppliers from './pages/Suppliers';
import Proformas from './pages/Proformas';
import Transfers from './pages/Transfers';
import Reports from './pages/Reports';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

export interface TransferSuggestion {
  productId: string;
  productName: string;
  originLocationId: string;
  destinationLocationId: string;
  quantity: number;
}

export default function App() {
  // 1. Extraemos 'user', 'role' y 'signOut' de nuestro contexto real de Supabase
  const { user, role, signOut } = useAuth();

  const [activePage, setActivePage] = useState('dashboard');

  // Sugerencia de traslado que viene del aviso de "solicitud de reposición"
  // en Inventario (botón "Pedir traslado desde..."). Transfers.tsx la lee
  // una vez, pre-llena el formulario y la limpia.
  const [transferSuggestion, setTransferSuggestion] = useState<TransferSuggestion | null>(null);

  const handleRequestTransfer = (suggestion: TransferSuggestion) => {
    setTransferSuggestion(suggestion);
    setActivePage('traslados');
  };

  // Salvaguarda: si por algún motivo un Vendedor llega a una página solo
  // para Administrador (ej. quedó seleccionada antes de que le quitaran el
  // rol, o algún botón de atajo la navegó), lo regresamos al dashboard.
  useEffect(() => {
    if (role !== 'ADMIN' && ADMIN_ONLY_PAGES.includes(activePage)) {
      setActivePage('dashboard');
    }
  }, [role, activePage]);

  const pages: Record<string, React.ReactElement> = {
    dashboard: <Dashboard />,
    inventario: <Inventory onNavigate={setActivePage} onRequestTransfer={handleRequestTransfer} />,
    productos: <Products />,
    movimientos: <Movements />,
    ventas: <Sales />,
    proformas: <Proformas />,
    compras: <Purchases />,
    traslados: (
      <Transfers
        suggestion={transferSuggestion}
        onConsumeSuggestion={() => setTransferSuggestion(null)}
      />
    ),
    clientes: <Clients />,
    proveedores: <Suppliers />,
    reportes: <Reports />,
    asistente: <AIAssistant />,
    configuracion: <Settings />,
  };

  // 2. EL CANDADO: Si no hay usuario en Supabase, mostramos la pantalla de login.
  // Ya no necesitamos pasarle un 'onLogin' porque el AuthContext detectará
  // automáticamente cuando Supabase inicie sesión y actualizará la variable 'user'.
  if (!user) {
    return <Login />;
  }

  // 3. SISTEMA DESBLOQUEADO: Si hay usuario, mostramos el Layout y las páginas.
  // Si el rol es Vendedor y la página activa está restringida, mostramos el
  // Dashboard mientras el useEffect de arriba corrige activePage.
  const safePage = role !== 'ADMIN' && ADMIN_ONLY_PAGES.includes(activePage) ? 'dashboard' : activePage;

  return (
    <Layout
      activePage={safePage}
      onNavigate={setActivePage}
      onLogout={signOut} // Conectamos tu botón de salir con la función real de Supabase
    >
      {pages[safePage] ?? <Dashboard />}
    </Layout>
  );
}