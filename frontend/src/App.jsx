import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import TiendaPage from './pages/TiendaPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventarioPage from './pages/InventarioPage';
import SalidasStockPage from './pages/SalidasStockPage';
import FinanzasPage from './pages/FinanzasPage';
import EncargosPage from './pages/EncargosPage';
import ProveedoresPage from './pages/ProveedoresPage';
import ReportesPage from './pages/ReportesPage';
import RespaldosConfigPage from './pages/RespaldosConfigPage';
import ClientePortal from './clientes/ClientePortal';

function OwnerRoutes() {
  const { user } = useApp();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="salidas" element={<SalidasStockPage />} />
        <Route path="finanzas" element={<FinanzasPage />} />
        <Route path="encargos" element={<EncargosPage />} />
        <Route path="proveedores" element={<ProveedoresPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="sistema" element={<RespaldosConfigPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin-panel" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TiendaPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-panel/*" element={<OwnerRoutes />} />
      <Route path="/cliente/*" element={<ClientePortal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
