import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Wallet,
  CalendarClock,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Menu,
  Candy,
  HardDriveDownload,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sun,
  Moon,
  Store,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import CommandPalette from './CommandPalette';

export default function Layout() {
  const {
    theme,
    toggleTheme,
    user,
    logout,
    isOnline,
    backendAvailable,
    pendingSyncCount,
    toggleOnline,
    globalAlerts,
    isBackupStale,
    createBackupNow,
    toasts,
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // Atajo Ctrl+K / Cmd+K para paleta de comandos
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const navItems = [
    { section: 'Operación Diaria' },
    { to: '/admin-panel', label: 'Panel de Inicio', icon: LayoutDashboard, end: true },
    { to: '/admin-panel/salidas', label: 'Salidas Stock (FEFO)', icon: ShoppingCart },
    { to: '/admin-panel/finanzas', label: 'Finanzas y Caja', icon: Wallet },
    {
      to: '/admin-panel/encargos',
      label: 'Encargos y Reservas',
      icon: CalendarClock,
      badge: globalAlerts.urgentOrdersCount > 0 ? globalAlerts.urgentOrdersCount : null,
      alert: true,
    },
    { section: 'Control y Catálogo' },
    {
      to: '/admin-panel/inventario',
      label: 'Inventario y Lotes',
      icon: Boxes,
      badge:
        globalAlerts.lowStockCount + globalAlerts.expiringLotsCount > 0
          ? globalAlerts.lowStockCount + globalAlerts.expiringLotsCount
          : null,
      alert: true,
    },
    { to: '/admin-panel/proveedores', label: 'Proveedores y Compras', icon: Truck },
    { section: 'Análisis y Sistema' },
    { to: '/admin-panel/reportes', label: 'Reportes y Cuadre', icon: BarChart3 },
    { to: '/admin-panel/sistema', label: 'Respaldos y Ajustes', icon: Settings },
    { section: 'Vitrina' },
    { to: '/', label: 'Ver Tienda Pública', icon: Store, end: true },
  ];

  return (
    <div className="app-shell">
      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Candy size={22} />
          </div>
          <div>
            <div className="sidebar-brand-title">Arteconfi</div>
            <span className="sidebar-brand-sub">Confitería & Inventario v2</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) =>
            item.section ? (
              <div key={idx} className="sidebar-section-label">
                {item.section}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-link-left">
                  <item.icon size={17} />
                  <span>{item.label}</span>
                </span>
                {item.badge && (
                  <span className={`nav-badge ${item.alert ? 'alert' : ''}`}>{item.badge}</span>
                )}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="flex-between">
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>{user?.username}</div>
              <div className="small text-muted">Rol: {user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="btn btn-outline btn-sm"
              title="Cerrar sesión"
            >
              <LogOut size={15} /> Salir
            </button>
          </div>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar no-print">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <button
              type="button"
              className="cmd-trigger-btn"
              onClick={() => setCmdOpen(true)}
              title="Búsqueda rápida y atajos"
            >
              <Search size={14} />
              <span>Buscar producto o ir a...</span>
              <span className="kbd-chip">Ctrl+K</span>
            </button>
          </div>

          <div className="topbar-right">
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-outline btn-sm"
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            <button
              type="button"
              onClick={toggleOnline}
              className={`connection-pill ${isOnline ? 'online' : 'offline'}`}
              title="Haz clic para simular modo Sin Conexión"
            >
              <span className="dot-pulse" />
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isOnline
                ? backendAvailable
                  ? 'Conectado · Django API'
                  : 'Conectado · Modo Local'
                : `Sin conexión (${pendingSyncCount} en cola)`}
            </button>

            <button
              type="button"
              onClick={createBackupNow}
              className="btn btn-outline btn-sm"
              title="Generar respaldo local cifrado inmediato"
            >
              <HardDriveDownload size={15} /> Respaldar ahora
            </button>
          </div>
        </header>

        <main className="page-content">
          {isBackupStale && (
            <div className="alert-box warning mb-3 no-print">
              <AlertTriangle size={18} />
              <div className="flex-between" style={{ width: '100%' }}>
                <span>
                  <strong>Aviso de respaldo:</strong> Han pasado más de 3 días sin un respaldo exitoso.
                </span>
                <button className="btn btn-sm btn-warning" onClick={createBackupNow}>
                  Respaldar ahora
                </button>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />

      <div className="toast-container no-print">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item ${t.type}`}>
            {t.type === 'error' || t.type === 'warning' ? (
              <AlertTriangle size={17} />
            ) : (
              <CheckCircle2 size={17} />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
