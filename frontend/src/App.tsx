import React, { useState } from 'react';
import Login from './components/Login';
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
import Reports from './pages/Reports';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';

const pages: Record<string, React.ReactElement> = {
  dashboard: <Dashboard />,
  inventario: <Inventory />,
  productos: <Products />,
  movimientos: <Movements />,
  ventas: <Sales />,
  proformas: <Proformas />,
  compras: <Purchases />,
  clientes: <Clients />,
  proveedores: <Suppliers />,
  reportes: <Reports />,
  asistente: <AIAssistant />,
  configuracion: <Settings />,
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <Layout
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={() => setLoggedIn(false)}
    >
      {pages[activePage] ?? <Dashboard />}
    </Layout>
  );
}
