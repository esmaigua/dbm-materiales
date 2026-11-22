import React, { useState } from 'react';
import Layout from './components/Layout';
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

export default function App() {
  // 1. Extraemos 'user' y 'signOut' de nuestro contexto real de Supabase
  const { user, signOut } = useAuth();

  const [activePage, setActivePage] = useState('dashboard');

  const pages: Record<string, React.ReactElement> = {
    dashboard: <Dashboard />,
    inventario: <Inventory onNavigate={setActivePage} />,
    productos: <Products />,
    movimientos: <Movements />,
    ventas: <Sales />,
    proformas: <Proformas />,
    compras: <Purchases />,
    traslados: <Transfers />,
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
  return (
    <Layout
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={signOut} // Conectamos tu botón de salir con la función real de Supabase
    >
      {pages[activePage] ?? <Dashboard />}
    </Layout>
  );
}