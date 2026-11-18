import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  AlertTriangle,
  Clock,
  Wallet,
  CalendarClock,
  ShoppingCart,
  ArrowRight,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useApp, formatCLP, daysUntil, todayStr } from '../context/AppContext';
import { DailyIncomeChart } from '../components/Charts';

export default function DashboardPage() {
  const {
    products,
    lots,
    orders,
    salesFinance,
    movements,
    configAlerts,
    getProductStockInfo,
    getLotExpirationStatus,
  } = useApp();

  const today = todayStr();
  const activeProducts = products.filter((p) => p.activo);

  const lowStockList = activeProducts
    .map((p) => ({ ...p, ...getProductStockInfo(p.id) }))
    .filter((p) => p.stockDisponible <= p.stockMinimo);

  const alertLots = lots
    .filter((l) => l.stockActual > 0)
    .map((l) => {
      const prod = products.find((p) => p.id === l.productoId);
      const status = getLotExpirationStatus(l.fechaVencimiento);
      return { ...l, productoNombre: prod?.nombre || 'Producto', status };
    })
    .filter((l) => l.status.days !== null && l.status.days <= configAlerts.amberDays)
    .sort((a, b) => a.status.days - b.status.days);

  const expiredLotsCount = alertLots.filter((l) => l.status.expired).length;

  const ventasHoy = salesFinance.filter(
    (s) => s.estado === 'Vigente' && s.fechaHora.startsWith(today)
  );
  const totalHoy = ventasHoy.reduce((acc, s) => acc + s.monto, 0);

  const pendingOrders = orders
    .filter((o) => o.estado === 'Pendiente' || o.estado === 'En preparación')
    .sort((a, b) => a.fechaEntrega.localeCompare(b.fechaEntrega));

  const salidasHoy = movements.filter(
    (m) => m.tipo === 'Venta' && m.fechaHora.startsWith(today)
  ).length;
  const hayDescuadreHoy = (ventasHoy.length > 0 && salidasHoy === 0) || (salidasHoy > 0 && ventasHoy.length === 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <LayoutDashboard size={24} style={{ color: 'var(--primary)' }} />
            Panel de Control General
          </h1>
          <p className="page-subtitle">
            Resumen operativo de inventario por lotes, finanzas del día y encargos pendientes.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/admin-panel/salidas" className="btn btn-primary">
            <ShoppingCart size={16} /> Registrar Salida Stock (FEFO)
          </Link>
          <Link to="/admin-panel/finanzas" className="btn btn-dark">
            <Wallet size={16} /> Registrar Venta en Caja
          </Link>
        </div>
      </div>

      {hayDescuadreHoy && (
        <div className="alert-box warning mb-3">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div className="flex-between" style={{ width: '100%', flexWrap: 'wrap' }}>
            <span>
              <strong>Posible descuadre hoy:</strong> Tienes {ventasHoy.length} venta(s) registrada(s)
              en finanzas y {salidasHoy} salida(s) física(s) descontada(s) del stock.
            </span>
            <Link to="/admin-panel/reportes" className="btn btn-sm btn-outline">
              Revisar Cuadre Diario <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Ventas Hoy (Finanzas)</div>
            <div className="kpi-value">{formatCLP(totalHoy)}</div>
            <div className="kpi-meta">{ventasHoy.length} ventas vigentes hoy</div>
          </div>
          <div className="kpi-icon success">
            <TrendingUp size={21} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Stock Crítico / Mínimo</div>
            <div className="kpi-value">{lowStockList.length}</div>
            <div className="kpi-meta">de {activeProducts.length} productos activos</div>
          </div>
          <div className={`kpi-icon ${lowStockList.length > 0 ? 'warning' : 'success'}`}>
            <Boxes size={21} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Lotes por Vencer</div>
            <div className="kpi-value">{alertLots.length}</div>
            <div className="kpi-meta">
              {expiredLotsCount > 0
                ? `${expiredLotsCount} ya vencido(s) — dar de baja`
                : `Aviso ≤ ${configAlerts.amberDays} días`}
            </div>
          </div>
          <div className={`kpi-icon ${alertLots.length > 0 ? 'danger' : 'success'}`}>
            <Clock size={21} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Encargos Activos</div>
            <div className="kpi-value">{pendingOrders.length}</div>
            <div className="kpi-meta">Stock reservado descontado</div>
          </div>
          <div className="kpi-icon info">
            <CalendarClock size={21} />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Clock size={17} style={{ color: 'var(--danger)' }} />
              Lotes Próximos a Vencer y Vencidos (FEFO)
            </h2>
            <Link to="/admin-panel/inventario?tab=lotes" className="btn btn-outline btn-sm">
              Gestionar lotes
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {alertLots.length === 0 ? (
              <div className="empty-state">No hay lotes próximos a vencer.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producto / Lote</th>
                      <th className="center">Stock</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertLots.slice(0, 5).map((l) => (
                      <tr key={l.id}>
                        <td>
                          <div className="fw-bold">{l.productoNombre}</div>
                          <div className="small text-muted">
                            Lote <code>{l.codigoLote}</code> · Vence {l.fechaVencimiento}
                          </div>
                        </td>
                        <td className="center fw-bold">{l.stockActual}</td>
                        <td>
                          <span className={`badge ${l.status.badge}`}>
                            {l.status.expired && <Trash2 size={11} />}
                            {l.status.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Wallet size={17} style={{ color: 'var(--success)' }} />
                Ingresos Diarios por Medio de Pago
              </h2>
              <Link to="/admin-panel/finanzas" className="btn btn-outline btn-sm">
                Ir a Caja
              </Link>
            </div>
            <div className="card-body">
              <DailyIncomeChart sales={salesFinance} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <AlertTriangle size={17} style={{ color: 'var(--warning)' }} />
                Productos por Agotar
              </h2>
              <Link to="/admin-panel/proveedores?tab=sugerencias" className="btn btn-outline btn-sm">
                Sugerencia compra
              </Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {lowStockList.length === 0 ? (
                <div className="empty-state">Todo el catálogo sobre stock mínimo.</div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="center">Disponible</th>
                        <th className="center">Mínimo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockList.slice(0, 4).map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="fw-bold">{p.nombre}</div>
                            {p.stockReservado > 0 && (
                              <span className="small text-muted">
                                ({p.stockReservado} reservadas en encargos)
                              </span>
                            )}
                          </td>
                          <td className="center">
                            <span className="badge badge-danger">{p.stockDisponible}</span>
                          </td>
                          <td className="center text-muted">{p.stockMinimo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-header">
          <h2 className="card-title">
            <CalendarClock size={17} style={{ color: 'var(--info)' }} />
            Agenda de Encargos Próximos y Atrasados
          </h2>
          <Link to="/admin-panel/encargos" className="btn btn-outline btn-sm">
            Ir a Encargos
          </Link>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {pendingOrders.length === 0 ? (
            <div className="empty-state">No hay encargos pendientes.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Retiro Programado</th>
                    <th>Productos</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.slice(0, 4).map((o) => {
                    const diff = daysUntil(o.fechaEntrega);
                    const atrasado = diff < 0;
                    const esHoy = diff === 0;
                    return (
                      <tr key={o.id}>
                        <td className="fw-bold">#{o.id}</td>
                        <td>
                          <div className="fw-bold">{o.clienteNombre}</div>
                          <div className="small text-muted">{o.clienteTelefono}</div>
                        </td>
                        <td>
                          <span className={atrasado ? 'text-danger fw-bold' : esHoy ? 'text-warning fw-bold' : 'fw-bold'}>
                            {o.fechaEntrega}
                          </span>
                          {atrasado && <span className="badge badge-danger" style={{ marginLeft: 6 }}>Atrasado</span>}
                          {esHoy && <span className="badge badge-warning" style={{ marginLeft: 6 }}>Hoy</span>}
                          <div className="small text-muted" style={{ fontSize: '0.74rem' }}>
                            Reg: {o.horaEntrega ? `${o.horaEntrega} hrs` : '-'}
                          </div>
                        </td>
                        <td className="small">{o.items.length} ítem(s) reservados</td>
                        <td>
                          <span className={`badge ${o.estado === 'En preparación' ? 'badge-info' : 'badge-warning'}`}>
                            {o.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
