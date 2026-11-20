import React, { useState } from 'react';
import {
  CalendarClock,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  AlertTriangle,
  Store,
} from 'lucide-react';
import { useApp, daysUntil, todayStr } from '../context/AppContext';
import { integerInputProps, onlyPhoneChars } from '../utils/validators';

export default function EncargosPage() {
  const { products, orders, getProductStockInfo, createOrder, updateOrderStatus, notify } = useApp();

  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [origenFiltro, setOrigenFiltro] = useState('Todos');
  const [showNewModal, setShowNewModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const activeProducts = products.filter((p) => p.activo);

  const [form, setForm] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    fechaEntrega: todayStr(),
    horaEntrega: '16:00',
    notas: '',
    items: [{ productoId: activeProducts[0]?.id || 1, cantidad: 1 }],
  });

  // Ordenar: entregas atrasadas / hoy primero
  const sortedOrders = [...orders]
    .filter((o) => {
      const orig = o.origen || 'Admin';
      const matchEstado = estadoFiltro === 'Todos' ? true : o.estado === estadoFiltro;
      const matchOrigen = origenFiltro === 'Todos' ? true : orig === origenFiltro;
      return matchEstado && matchOrigen;
    })
    .sort((a, b) => {
      const aActive = a.estado === 'Pendiente' || a.estado === 'En preparación';
      const bActive = b.estado === 'Pendiente' || b.estado === 'En preparación';
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return a.fechaEntrega.localeCompare(b.fechaEntrega);
    });

  const handleCreateOrder = (e) => {
    e.preventDefault();
    for (const item of form.items) {
      const info = getProductStockInfo(Number(item.productoId));
      if (Number(item.cantidad) > info.stockDisponible) {
        const pr = products.find((p) => p.id === Number(item.productoId));
        notify(
          `Stock disponible insuficiente para "${pr?.nombre}" (Disp: ${info.stockDisponible}).`,
          'error'
        );
        return;
      }
    }
    const horaActual = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
    createOrder({
      ...form,
      horaEntrega: horaActual,
      items: form.items.map((i) => ({ productoId: Number(i.productoId), cantidad: Number(i.cantidad) })),
    });
    setShowNewModal(false);
    setForm({
      clienteNombre: '',
      clienteTelefono: '',
      fechaEntrega: todayStr(),
      horaEntrega: '16:00',
      notas: '',
      items: [{ productoId: activeProducts[0]?.id || 1, cantidad: 1 }],
    });
  };

  const handleConfirmCancel = (e) => {
    e.preventDefault();
    updateOrderStatus(cancelModal.id, 'Cancelado', cancelReason || 'Cancelado por cliente');
    setCancelModal(null);
    setCancelReason('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CalendarClock size={24} style={{ color: 'var(--primary)' }} />
            Encargos y Reservas para Eventos
          </h1>
          <p className="page-subtitle">
            Agenda pedidos con fecha pactada. Las unidades quedan reservadas del stock disponible hasta su entrega o cancelación.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            <Plus size={16} /> Nuevo Encargo
          </button>
        </div>
      </div>

      {/* Filtros de estado y origen */}
      <div className="card mb-3">
        <div className="card-body" style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div className="filter-bar">
            {['Todos', 'Pendiente', 'En preparación', 'Entregado', 'Cancelado'].map((st) => (
              <button
                key={st}
                className={`btn btn-sm ${estadoFiltro === st ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setEstadoFiltro(st)}
              >
                {st}
              </button>
            ))}
          </div>
          <div className="filter-bar">
            <span className="small text-muted fw-bold">Origen:</span>
            {[
              { value: 'Todos', label: 'Todos' },
              { value: 'Portal', label: 'Portal cliente' },
              { value: 'Admin', label: 'Admin' },
            ].map((op) => (
              <button
                key={op.value}
                className={`btn btn-sm ${origenFiltro === op.value ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setOrigenFiltro(op.value)}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de encargos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sortedOrders.map((o) => {
          const diff = daysUntil(o.fechaEntrega);
          const activo = o.estado === 'Pendiente' || o.estado === 'En preparación';
          const atrasado = activo && diff < 0;
          const esHoy = activo && diff === 0;
          const esPortal = (o.origen || 'Admin') === 'Portal';
          const esPortalPendiente = esPortal && o.estado === 'Pendiente';

          const badgeMap = {
            Pendiente: 'badge-warning',
            'En preparación': 'badge-info',
            Entregado: 'badge-success',
            Cancelado: 'badge-danger',
          };

          return (
            <div
              key={o.id}
              className="card"
              style={{
                borderLeft: atrasado
                  ? '4px solid var(--danger)'
                  : esHoy
                    ? '4px solid var(--warning)'
                    : esPortalPendiente
                      ? '4px solid var(--primary)'
                      : undefined,
                borderColor: esPortalPendiente ? 'var(--primary-border)' : undefined,
                backgroundColor: esPortalPendiente ? 'var(--primary-soft)' : undefined,
              }}
            >
              <div className="card-header">
                <div className="flex-center" style={{ flexWrap: 'wrap' }}>
                  <span className="fw-bold">Encargo #{o.id}</span>
                  <span className={`badge ${badgeMap[o.estado]}`}>{o.estado}</span>
                  <span className={`badge ${esPortal ? 'badge-primary' : 'badge-neutral'}`}>
                    {esPortal && <Store size={11} />}
                    {esPortal ? 'Portal cliente' : 'Admin'}
                  </span>
                  {atrasado && (
                    <span className="badge badge-danger">
                      <AlertTriangle size={11} /> Entrega atrasada ({Math.abs(diff)}d)
                    </span>
                  )}
                  {esHoy && (
                    <span className="badge badge-warning">
                      <Clock size={11} /> Entrega HOY
                    </span>
                  )}
                </div>

                <div className="flex-center">
                  {o.estado === 'Pendiente' && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => updateOrderStatus(o.id, 'En preparación', 'Inicio de preparación')}
                    >
                      <ChefHat size={14} /> Pasar a En preparación
                    </button>
                  )}
                  {(o.estado === 'Pendiente' || o.estado === 'En preparación') && (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => updateOrderStatus(o.id, 'Entregado', 'Entregado al cliente')}
                      >
                        <CheckCircle2 size={14} /> Marcar Entregado
                      </button>
                      <button
                        className="btn btn-outline btn-sm text-danger"
                        onClick={() => setCancelModal(o)}
                      >
                        <XCircle size={14} /> Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="card-body">
                <div className="grid-3">
                  <div>
                    <div className="small text-muted">Cliente</div>
                    <div className="fw-bold">{o.clienteNombre}</div>
                    <div className="small text-muted">{o.clienteTelefono}</div>
                    {o.notas && <div className="small mt-1">Nota: {o.notas}</div>}
                  </div>

                  <div>
                    <div className="small text-muted">Retiro Programado</div>
                    <div className="fw-bold">{o.fechaEntrega}</div>
                    <div className="small text-muted mt-1" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      <span>Solicitado: {o.creadoEn || (o.horaEntrega ? `${o.horaEntrega} hrs` : '-')}</span>
                    </div>
                    <div className="small text-muted mt-1">
                      <strong>Productos reservados:</strong>
                    </div>
                    <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem', fontSize: '0.83rem' }}>
                      {o.items.map((it, i) => {
                        const pr = products.find((p) => p.id === it.productoId);
                        return (
                          <li key={i}>
                            <strong>{it.cantidad}x</strong> {pr?.nombre}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div>
                    <div className="small text-muted mb-1">Historial de Estados</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {o.historial.map((h, idx) => (
                        <div key={idx} className="small" style={{ borderLeft: '2px solid var(--border)', paddingLeft: '0.5rem' }}>
                          <strong>{h.estado}</strong> ({h.fecha})
                          <div className="text-muted">{h.motivo}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nuevo Encargo (HU-11) */}
      {showNewModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog lg">
            <div className="modal-header">
              <h3 className="modal-title">Agendar Nuevo Encargo (Reserva de Stock)</h3>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nombre Cliente *</label>
                    <input
                      className="form-control"
                      value={form.clienteNombre}
                      onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono *</label>
                    <input
                      className="form-control"
                      value={form.clienteTelefono}
                      onChange={(e) => setForm({ ...form, clienteTelefono: onlyPhoneChars(e.target.value) })}
                      placeholder="+56 9 1234 5678"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de Retiro *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.fechaEntrega}
                      onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora de Registro</label>
                    <input
                      type="text"
                      className="form-control"
                      value="Automática (Hora actual al agendar)"
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Notas del evento</label>
                    <input
                      className="form-control"
                      value={form.notas}
                      onChange={(e) => setForm({ ...form, notas: e.target.value })}
                      placeholder="Ej: Cumpleaños, envolver para regalo..."
                    />
                  </div>
                  <div className="form-group full">
                    <div className="flex-between mb-2">
                      <label className="form-label">Productos a Reservar</label>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          setForm({
                            ...form,
                            items: [...form.items, { productoId: activeProducts[0]?.id || 1, cantidad: 1 }],
                          })
                        }
                      >
                        + Añadir producto
                      </button>
                    </div>
                    {form.items.map((item, idx) => {
                      const info = getProductStockInfo(Number(item.productoId));
                      const insuf = Number(item.cantidad) > info.stockDisponible;
                      return (
                        <div key={idx} className="flex-center mb-2">
                          <select
                            className="form-control"
                            value={item.productoId}
                            onChange={(e) => {
                              const next = [...form.items];
                              next[idx].productoId = e.target.value;
                              setForm({ ...form, items: next });
                            }}
                          >
                            {activeProducts.map((p) => {
                              const st = getProductStockInfo(p.id);
                              return (
                                <option key={p.id} value={p.id}>
                                  {p.nombre} (Disp: {st.stockDisponible})
                                </option>
                              );
                            })}
                          </select>
                          <input
                            {...integerInputProps(item.cantidad, (val) => {
                              if (val !== '' && Number(val) > info.stockDisponible) {
                                const pr = activeProducts.find((p) => p.id === Number(item.productoId));
                                notify(`Stock insuficiente para reservar "${pr?.nombre}": quedan ${info.stockDisponible} disponibles.`, 'error');
                              }
                              const next = [...form.items];
                              next[idx].cantidad = val;
                              setForm({ ...form, items: next });
                            }, { min: 1 })}
                            className="form-control"
                            style={{ width: 90, borderColor: insuf ? 'var(--danger)' : undefined }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowNewModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar y Reservar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cancelar Encargo (HU-05) */}
      {cancelModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: 430 }}>
            <div className="modal-header">
              <h3 className="modal-title text-danger">Cancelar Encargo #{cancelModal.id}</h3>
            </div>
            <form onSubmit={handleConfirmCancel}>
              <div className="modal-body">
                <p className="small text-muted">
                  Las unidades reservadas volverán a estar disponibles en el inventario inmediatamente.
                </p>
                <div className="form-group">
                  <label className="form-label">Motivo de cancelación *</label>
                  <input
                    className="form-control"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ej: Cliente desistió de la compra"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setCancelModal(null)}>
                  Volver
                </button>
                <button type="submit" className="btn btn-danger">
                  Confirmar Cancelación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
