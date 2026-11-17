import React, { useState, useEffect } from 'react';
import {
  Wallet,
  PlusCircle,
  Ban,
  Edit3,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  CheckCircle2,
} from 'lucide-react';
import { useApp, formatCLP, todayStr } from '../context/AppContext';
import PasswordModal from '../components/PasswordModal';
import Pagination from '../components/Pagination';
import { DailyIncomeChart } from '../components/Charts';
import { integerInputProps } from '../utils/validators';

export default function FinanzasPage() {
  const { salesFinance, addSaleFinance, editSaleFinance, annulSaleFinance, notify } = useApp();

  const [monto, setMonto] = useState('');
  const [medioPago, setMedioPago] = useState('Efectivo');
  const [nota, setNota] = useState('');

  const [filtroEstado, setFiltroEstado] = useState('Todas');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [efectivoReal, setEfectivoReal] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 7;

  const [editModal, setEditModal] = useState(null);
  const [annulModal, setAnnulModal] = useState(null);
  const [annulReason, setAnnulReason] = useState('Error de registro');
  const [annulComment, setAnnulComment] = useState('');
  const [pwdAction, setPwdAction] = useState(null);

  const today = todayStr();

  useEffect(() => {
    setPage(1);
  }, [filtroEstado, filtroPeriodo]);

  const handleQuickSale = (e) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) {
      notify('El monto debe ser mayor a cero.', 'error');
      return;
    }
    addSaleFinance({ monto: Number(monto), medioPago, nota });
    setMonto('');
    setNota('');
  };

  const filteredSales = salesFinance
    .filter((s) => (filtroPeriodo === 'hoy' ? s.fechaHora.startsWith(today) : true))
    .filter((s) => (filtroEstado === 'Todas' ? true : s.estado === filtroEstado));

  const pagedSales = filteredSales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const vigentes = filteredSales.filter((s) => s.estado === 'Vigente');
  const totalVigente = vigentes.reduce((acc, s) => acc + s.monto, 0);
  const promedio = vigentes.length > 0 ? Math.round(totalVigente / vigentes.length) : 0;

  const totalEfectivo = vigentes.filter((s) => s.medioPago === 'Efectivo').reduce((a, b) => a + b.monto, 0);
  const totalTarjeta = vigentes.filter((s) => s.medioPago === 'Tarjeta').reduce((a, b) => a + b.monto, 0);
  const totalTransfer = vigentes.filter((s) => s.medioPago === 'Transferencia').reduce((a, b) => a + b.monto, 0);

  const diferenciaCaja = efectivoReal !== '' ? Number(efectivoReal) - totalEfectivo : null;

  const triggerEditSave = (e) => {
    e.preventDefault();
    const isPastDay = !editModal.fechaHora.startsWith(today);
    if (isPastDay) {
      setPwdAction({
        title: 'Corregir Venta de Día Anterior',
        message: 'Modificar una venta de días pasados requiere contraseña del dueño.',
        onConfirm: () => {
          editSaleFinance(editModal.id, {
            monto: editModal.monto,
            medioPago: editModal.medioPago,
            nota: editModal.nota,
          });
          setEditModal(null);
        },
      });
    } else {
      editSaleFinance(editModal.id, {
        monto: editModal.monto,
        medioPago: editModal.medioPago,
        nota: editModal.nota,
      });
      setEditModal(null);
    }
  };

  const triggerAnnul = (e) => {
    e.preventDefault();
    const motivoCompleto = `${annulReason}${annulComment ? ` — ${annulComment}` : ''}`;
    setPwdAction({
      title: 'Anular Venta',
      message: `La venta #${annulModal.id} por ${formatCLP(annulModal.monto)} quedará anulada y no sumará en los ingresos.`,
      onConfirm: () => {
        annulSaleFinance(annulModal.id, motivoCompleto);
        setAnnulModal(null);
        setAnnulComment('');
      },
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Wallet size={24} style={{ color: 'var(--primary)' }} />
            Finanzas, Ingresos y Arqueo de Caja
          </h1>
          <p className="page-subtitle">
            Registro independiente de dinero por venta y medio de pago.
          </p>
        </div>
        <div className="header-actions">
          <select
            className="form-control"
            style={{ width: 170 }}
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
          >
            <option value="todos">Todo el período</option>
            <option value="hoy">Solo hoy ({today})</option>
          </select>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Vigente</div>
            <div className="kpi-value">{formatCLP(totalVigente)}</div>
            <div className="kpi-meta">{vigentes.length} ventas · Promedio {formatCLP(promedio)}</div>
          </div>
          <div className="kpi-icon primary"><Wallet size={20} /></div>
        </div>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Efectivo</div>
            <div className="kpi-value">{formatCLP(totalEfectivo)}</div>
            <div className="kpi-meta">Esperado en caja física</div>
          </div>
          <div className="kpi-icon success"><Banknote size={20} /></div>
        </div>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Tarjeta</div>
            <div className="kpi-value">{formatCLP(totalTarjeta)}</div>
            <div className="kpi-meta">Débito / Crédito POS</div>
          </div>
          <div className="kpi-icon info"><CreditCard size={20} /></div>
        </div>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Transferencia</div>
            <div className="kpi-value">{formatCLP(totalTransfer)}</div>
            <div className="kpi-meta">Cuenta bancaria</div>
          </div>
          <div className="kpi-icon warning"><ArrowLeftRight size={20} /></div>
        </div>
      </div>

      <div className="grid-pos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Historial de Ventas Registradas</h2>
              <select
                className="form-control"
                style={{ width: 160 }}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="Todas">Todas</option>
                <option value="Vigente">Solo Vigentes</option>
                <option value="Anulada">Solo Anuladas</option>
              </select>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha / Hora</th>
                      <th>Medio</th>
                      <th className="num">Monto</th>
                      <th>Estado</th>
                      <th className="center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedSales.map((s) => (
                      <tr key={s.id} style={{ opacity: s.estado === 'Anulada' ? 0.55 : 1 }}>
                        <td>
                          <div className="fw-bold small">#{s.id} · {s.fechaHora}</div>
                          <div className="small text-muted">{s.nota || 'Sin nota'}</div>
                          {s.motivoAnulacion && (
                            <div className="small text-danger">Anulada: {s.motivoAnulacion}</div>
                          )}
                        </td>
                        <td><span className="badge badge-neutral">{s.medioPago}</span></td>
                        <td className="num fw-bold">{formatCLP(s.monto)}</td>
                        <td>
                          <span className={`badge ${s.estado === 'Vigente' ? 'badge-success' : 'badge-danger'}`}>
                            {s.estado}
                          </span>
                        </td>
                        <td className="center">
                          {s.estado === 'Vigente' && (
                            <div className="flex-center" style={{ justifyContent: 'center' }}>
                              <button className="btn btn-outline btn-sm" title="Corregir monto o medio" onClick={() => setEditModal({ ...s })}>
                                <Edit3 size={14} />
                              </button>
                              <button className="btn btn-outline btn-sm text-danger" title="Anular venta" onClick={() => setAnnulModal(s)}>
                                <Ban size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination totalItems={filteredSales.length} pageSize={PAGE_SIZE} currentPage={page} onPageChange={setPage} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Gráfico de Ingresos por Día</h2>
            </div>
            <div className="card-body">
              <DailyIncomeChart sales={filteredSales} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <PlusCircle size={17} style={{ color: 'var(--primary)' }} />
                Registrar Venta Rápida
              </h2>
            </div>
            <form onSubmit={handleQuickSale} className="card-body">
              <div className="form-group mb-3">
                <label className="form-label">Monto Total (CLP) *</label>
                <input
                  {...integerInputProps(monto, setMonto, { min: 1 })}
                  className="form-control"
                  placeholder="Ej: 4500"
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Medio de Pago *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {['Efectivo', 'Tarjeta', 'Transferencia'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`btn btn-sm ${medioPago === m ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setMedioPago(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Nota opcional</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Detalle breve..."
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                <CheckCircle2 size={17} /> Guardar Ingreso
              </button>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Comparar Efectivo vs Caja Real</h2>
            </div>
            <div className="card-body">
              <div className="form-group mb-2">
                <label className="form-label">Efectivo contado en caja física</label>
                <input
                  {...integerInputProps(efectivoReal, setEfectivoReal)}
                  className="form-control"
                  placeholder={`Registrado: ${formatCLP(totalEfectivo)}`}
                />
              </div>
              {diferenciaCaja !== null && (
                <div className={`alert-box ${diferenciaCaja === 0 ? 'success' : 'warning'} mt-2`}>
                  <span>
                    {diferenciaCaja === 0
                      ? 'Caja cuadrada exactamente.'
                      : `Diferencia en caja: ${formatCLP(diferenciaCaja)}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Corregir Venta #{editModal.id}</h3>
            </div>
            <form onSubmit={triggerEditSave}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label className="form-label">Monto (CLP)</label>
                  <input
                    {...integerInputProps(editModal.monto, (val) => setEditModal({ ...editModal, monto: val }), { min: 1 })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Medio de Pago</label>
                  <select className="form-control" value={editModal.medioPago} onChange={(e) => setEditModal({ ...editModal, medioPago: e.target.value })}>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nota</label>
                  <input className="form-control" value={editModal.nota} onChange={(e) => setEditModal({ ...editModal, nota: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Corrección</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {annulModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title text-danger">Anular Venta #{annulModal.id}</h3>
            </div>
            <form onSubmit={triggerAnnul}>
              <div className="modal-body">
                <div className="alert-box info mb-3">
                  <span className="small">Anular una venta en finanzas no repone stock automáticamente.</span>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Motivo obligatorio</label>
                  <select className="form-control" value={annulReason} onChange={(e) => setAnnulReason(e.target.value)}>
                    <option value="Error de registro">Error de registro</option>
                    <option value="Cliente devolvió">Cliente devolvió</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Comentario adicional</label>
                  <input className="form-control" value={annulComment} onChange={(e) => setAnnulComment(e.target.value)} placeholder="Detalle del motivo..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setAnnulModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-danger">Continuar y Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PasswordModal
        isOpen={Boolean(pwdAction)}
        title={pwdAction?.title}
        message={pwdAction?.message}
        onConfirm={() => pwdAction?.onConfirm()}
        onClose={() => setPwdAction(null)}
      />
    </div>
  );
}
