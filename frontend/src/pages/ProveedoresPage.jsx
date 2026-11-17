import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Truck,
  Plus,
  Edit3,
  ClipboardList,
  Undo2,
  Printer,
  CheckCircle2,
  PackageCheck,
  FileText,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useApp, formatCLP } from '../context/AppContext';
import { integerInputProps, onlyPhoneChars, onlyRutChars } from '../utils/validators';

export default function ProveedoresPage() {
  const [searchParams] = useSearchParams();
  const {
    providers,
    products,
    lots,
    purchaseOrders,
    supplierReturns,
    getProductStockInfo,
    addProvider,
    updateProvider,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    receivePurchaseOrder,
    registerSupplierReturn,
    notify,
  } = useApp();

  const [tab, setTab] = useState(searchParams.get('tab') || 'directorio');
  const [provModal, setProvModal] = useState(null);
  const [retModal, setRetModal] = useState(false);
  const [receiveOrderModal, setReceiveOrderModal] = useState(null);
  const [receiveLines, setReceiveLines] = useState([]);

  // Cantidades editables por producto en sugerencia de compra (HU-12)
  const [suggestedQtyOverrides, setSuggestedQtyOverrides] = useState({});

  const [provForm, setProvForm] = useState({
    nombre: '',
    rut: '',
    contacto: '',
    telefono: '',
    email: '',
    diasEntrega: '',
    direccion: '',
  });

  const [retForm, setRetForm] = useState({
    proveedorId: providers[0]?.id || 1,
    productoId: products[0]?.id || 1,
    lotId: '',
    cantidad: 1,
    motivo: 'Dañado',
    detalle: '',
  });

  // Soporte cruce directo desde HU-03 (Lotes por vencer -> Devolución a Proveedor)
  useEffect(() => {
    const t = searchParams.get('tab');
    const pId = searchParams.get('productoId');
    const lId = searchParams.get('lotId');
    if (t) setTab(t);
    if (pId) {
      const prod = products.find((p) => p.id === Number(pId));
      setRetForm((prev) => ({
        ...prev,
        productoId: Number(pId),
        proveedorId: prod?.proveedorPrincipalId || prev.proveedorId,
        lotId: lId ? Number(lId) : '',
        motivo: 'Vencido',
      }));
      setRetModal(true);
    }
  }, [searchParams, products]);

  const lowProducts = products
    .filter((p) => p.activo)
    .map((p) => ({ ...p, ...getProductStockInfo(p.id) }))
    .filter((p) => p.stockDisponible <= p.stockMinimo);

  const groupedSuggestions = providers
    .filter((pr) => pr.activo)
    .map((pr) => {
      const items = lowProducts.filter((p) => p.proveedorPrincipalId === pr.id);
      return {
        provider: pr,
        items: items.map((item) => {
          const defaultSug = Math.max(1, (item.stockObjetivo || item.stockMinimo * 2) - item.stockDisponible);
          const sugerido = suggestedQtyOverrides[item.id] ?? defaultSug;
          const enCamino = purchaseOrders.some(
            (po) => po.proveedorId === pr.id && po.estado === 'Enviada' && po.items.some((i) => i.productoId === item.id)
          );
          return { ...item, sugerido, enCamino };
        }),
      };
    })
    .filter((g) => g.items.length > 0);

  const openNewProv = () => {
    setProvForm({ nombre: '', rut: '', contacto: '', telefono: '', email: '', diasEntrega: '', direccion: '' });
    setProvModal({ mode: 'create' });
  };

  const openEditProv = (pr) => {
    setProvForm({ ...pr });
    setProvModal({ mode: 'edit', id: pr.id });
  };

  const handleSaveProv = (e) => {
    e.preventDefault();
    if (provModal.mode === 'create') addProvider(provForm);
    else updateProvider(provModal.id, provForm);
    setProvModal(null);
  };

  const openReceiveOrder = (po) => {
    setReceiveOrderModal(po);
    setReceiveLines(
      po.items.map((it) => ({
        ...it,
        codigoLote: `OC${po.id}-P${it.productoId}`,
        fechaVencimiento: '2027-06-30',
      }))
    );
  };

  const handleConfirmReceiveOrder = (e) => {
    e.preventDefault();
    receivePurchaseOrder(receiveOrderModal.id, receiveLines);
    setReceiveOrderModal(null);
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    const lotsForProd = lots.filter((l) => l.productoId === Number(retForm.productoId) && l.stockActual > 0);
    const chosenLot = Number(retForm.lotId || lotsForProd[0]?.id);
    registerSupplierReturn({
      proveedorId: Number(retForm.proveedorId),
      productoId: Number(retForm.productoId),
      lotId: chosenLot,
      cantidad: Number(retForm.cantidad),
      motivo: retForm.motivo,
      detalle: retForm.detalle,
    });
    setRetModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Truck size={24} style={{ color: 'var(--primary)' }} />
            Proveedores, Reposición y Devoluciones
          </h1>
          <p className="page-subtitle">
            Directorio de proveedores, órdenes de compra sugeridas editables con recepción precargada y devoluciones.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => setRetModal(true)}>
            <Undo2 size={16} /> Devolución a Proveedor
          </button>
          <button className="btn btn-primary" onClick={openNewProv}>
            <Plus size={16} /> Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className="tabs-bar">
        <button className={`tab-btn ${tab === 'directorio' ? 'active' : ''}`} onClick={() => setTab('directorio')}>
          <Truck size={16} /> Proveedores ({providers.length})
        </button>
        <button className={`tab-btn ${tab === 'sugerencias' ? 'active' : ''}`} onClick={() => setTab('sugerencias')}>
          <ClipboardList size={16} /> Sugerencias de Compra ({lowProducts.length})
        </button>
        <button className={`tab-btn ${tab === 'ordenes' ? 'active' : ''}`} onClick={() => setTab('ordenes')}>
          <FileText size={16} /> Órdenes de Compra ({purchaseOrders.length})
        </button>
        <button className={`tab-btn ${tab === 'devoluciones' ? 'active' : ''}`} onClick={() => setTab('devoluciones')}>
          <Undo2 size={16} /> Devoluciones ({supplierReturns.length})
        </button>
      </div>

      {/* TAB 1: DIRECTORIO */}
      {tab === 'directorio' && (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Empresa / RUT</th>
                    <th>Contacto</th>
                    <th>Días de Entrega</th>
                    <th>Productos Asociados</th>
                    <th className="center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((pr) => {
                    const surtidos = products.filter((p) => p.proveedoresIds?.includes(pr.id));
                    return (
                      <tr key={pr.id}>
                        <td>
                          <div className="fw-bold">{pr.nombre}</div>
                          <div className="small text-muted">RUT: {pr.rut || 'No registrado'}</div>
                        </td>
                        <td>
                          <div>{pr.contacto}</div>
                          <div className="small text-muted">{pr.telefono} · {pr.email}</div>
                        </td>
                        <td><span className="badge badge-info">{pr.diasEntrega || 'Por coordinar'}</span></td>
                        <td className="small">{surtidos.length} producto(s)</td>
                        <td className="center">
                          <button className="btn btn-outline btn-sm" onClick={() => openEditProv(pr)}>
                            <Edit3 size={14} /> Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUGERENCIAS DE COMPRA EDITABLES (HU-12) */}
      {tab === 'sugerencias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {groupedSuggestions.length === 0 ? (
            <div className="card">
              <div className="empty-state">No hay productos bajo stock mínimo para sugerir reposición.</div>
            </div>
          ) : (
            groupedSuggestions.map(({ provider, items }) => {
              const totalEst = items.reduce((acc, i) => acc + Number(i.sugerido) * i.precioCompra, 0);
              return (
                <div key={provider.id} className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">{provider.nombre}</h2>
                      <span className="small text-muted">
                        Entrega: {provider.diasEntrega} · Contacto: {provider.telefono}
                      </span>
                    </div>
                    <div className="flex-center">
                      <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                        <Printer size={14} /> Imprimir
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          createPurchaseOrder({
                            proveedorId: provider.id,
                            estado: 'Borrador',
                            items: items.map((i) => ({
                              productoId: i.id,
                              cantidad: Number(i.sugerido),
                              costoEstimado: i.precioCompra,
                            })),
                          })
                        }
                      >
                        Guardar Borrador
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          createPurchaseOrder({
                            proveedorId: provider.id,
                            estado: 'Enviada',
                            items: items.map((i) => ({
                              productoId: i.id,
                              cantidad: Number(i.sugerido),
                              costoEstimado: i.precioCompra,
                            })),
                          })
                        }
                      >
                        <CheckCircle2 size={14} /> Confirmar Orden Enviada
                      </button>
                    </div>
                  </div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th className="center">Disp / Mín</th>
                          <th className="center">Cantidad a Pedir (Editable)</th>
                          <th className="num">Costo Unit.</th>
                          <th className="num">Subtotal Est.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it) => (
                          <tr key={it.id}>
                            <td>
                              <div className="fw-bold">{it.nombre}</div>
                              {it.enCamino && <span className="badge badge-info">En camino</span>}
                            </td>
                            <td className="center">
                              <span className="badge badge-danger">{it.stockDisponible}</span> / {it.stockMinimo}
                            </td>
                            <td className="center">
                              <input
                                {...integerInputProps(it.sugerido, (val) =>
                                  setSuggestedQtyOverrides((prev) => ({
                                    ...prev,
                                    [it.id]: val === '' ? 0 : Number(val),
                                  }))
                                )}
                                className="form-control"
                                style={{ width: 90, margin: '0 auto', textAlign: 'center' }}
                              />
                            </td>
                            <td className="num">{formatCLP(it.precioCompra)}</td>
                            <td className="num fw-bold">{formatCLP(Number(it.sugerido) * it.precioCompra)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="card-header" style={{ justifyContent: 'flex-end' }}>
                      <span>Total Estimado Orden: <strong>{formatCLP(totalEst)}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: ÓRDENES DE COMPRA Y RECEPCIÓN PRECARGADA (HU-12 -> HU-18) */}
      {tab === 'ordenes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {purchaseOrders.map((po) => {
            const prov = providers.find((p) => p.id === po.proveedorId);
            const total = po.items.reduce((a, b) => a + b.cantidad * b.costoEstimado, 0);
            const badgeMap = {
              Borrador: 'badge-neutral',
              Enviada: 'badge-info',
              Recibida: 'badge-success',
              Cancelada: 'badge-danger',
            };
            return (
              <div key={po.id} className="card">
                <div className="card-header">
                  <div className="flex-center">
                    <span className="fw-bold">Orden #{po.id}</span>
                    <span className={`badge ${badgeMap[po.estado] || 'badge-neutral'}`}>{po.estado}</span>
                    <span className="small text-muted">{prov?.nombre} · {po.fecha}</span>
                  </div>
                  <div className="flex-center">
                    {po.estado === 'Borrador' && (
                      <button className="btn btn-primary btn-sm" onClick={() => updatePurchaseOrderStatus(po.id, 'Enviada')}>
                        Marcar Enviada
                      </button>
                    )}
                    {(po.estado === 'Enviada' || po.estado === 'Borrador') && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => openReceiveOrder(po)}>
                          <PackageCheck size={14} /> Recibir Mercadería
                        </button>
                        <button className="btn btn-outline btn-sm text-danger" onClick={() => updatePurchaseOrderStatus(po.id, 'Cancelada')}>
                          <XCircle size={14} /> Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  <div className="flex-between small">
                    <span>
                      {po.items
                        .map((i) => {
                          const p = products.find((x) => x.id === i.productoId);
                          return `${i.cantidad}x ${p?.nombre}`;
                        })
                        .join(' · ')}
                    </span>
                    <strong>Total est: {formatCLP(total)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: DEVOLUCIONES A PROVEEDOR (HU-23) */}
      {tab === 'devoluciones' && (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Producto / Lote</th>
                  <th className="center">Cantidad</th>
                  <th>Motivo</th>
                  <th>Estado Reclamo</th>
                </tr>
              </thead>
              <tbody>
                {supplierReturns.map((r) => {
                  const pr = providers.find((x) => x.id === r.proveedorId);
                  const prod = products.find((x) => x.id === r.productoId);
                  return (
                    <tr key={r.id}>
                      <td className="small">{r.fecha}</td>
                      <td className="fw-bold">{pr?.nombre}</td>
                      <td>
                        <div>{prod?.nombre}</div>
                        <div className="small text-muted">Lote <code>{r.codigoLote}</code></div>
                      </td>
                      <td className="center fw-bold">{r.cantidad}</td>
                      <td className="small">{r.motivo} — {r.detalle}</td>
                      <td>
                        <span className={`badge ${r.estado === 'Reembolsada' ? 'badge-success' : 'badge-warning'}`}>
                          {r.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Recepción Precargada desde Orden (HU-12 -> HU-18) */}
      {receiveOrderModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog lg">
            <div className="modal-header">
              <h3 className="modal-title">Recibir Orden #{receiveOrderModal.id} (Precarga de Lotes)</h3>
            </div>
            <form onSubmit={handleConfirmReceiveOrder}>
              <div className="modal-body">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style={{ width: 95 }}>Cant.</th>
                      <th style={{ width: 125 }}>Lote</th>
                      <th style={{ width: 150 }}>Vencimiento</th>
                      <th style={{ width: 110 }}>Costo Unit.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiveLines.map((ln, idx) => {
                      const prod = products.find((p) => p.id === ln.productoId);
                      return (
                        <tr key={idx}>
                          <td className="fw-bold small">{prod?.nombre}</td>
                          <td>
                            <input
                              {...integerInputProps(ln.cantidad, (val) => {
                                const next = [...receiveLines];
                                next[idx].cantidad = val;
                                setReceiveLines(next);
                              })}
                              className="form-control"
                            />
                          </td>
                          <td>
                            <input
                              className="form-control"
                              value={ln.codigoLote}
                              onChange={(e) => {
                                const next = [...receiveLines];
                                next[idx].codigoLote = e.target.value;
                                setReceiveLines(next);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control"
                              value={ln.fechaVencimiento}
                              onChange={(e) => {
                                const next = [...receiveLines];
                                next[idx].fechaVencimiento = e.target.value;
                                setReceiveLines(next);
                              }}
                              required
                            />
                          </td>
                          <td>
                            <input
                              {...integerInputProps(ln.costoEstimado, (val) => {
                                const next = [...receiveLines];
                                next[idx].costoEstimado = val;
                                setReceiveLines(next);
                              })}
                              className="form-control"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setReceiveOrderModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-success">Confirmar Recepción y Sumar Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Proveedor */}
      {provModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">{provModal.mode === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}</h3>
            </div>
            <form onSubmit={handleSaveProv}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Razón Social *</label>
                    <input className="form-control" value={provForm.nombre} onChange={(e) => setProvForm({ ...provForm, nombre: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">RUT</label>
                    <input className="form-control" value={provForm.rut} onChange={(e) => setProvForm({ ...provForm, rut: onlyRutChars(e.target.value) })} placeholder="76.432.190-5" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre Contacto</label>
                    <input className="form-control" value={provForm.contacto} onChange={(e) => setProvForm({ ...provForm, contacto: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input className="form-control" value={provForm.telefono} onChange={(e) => setProvForm({ ...provForm, telefono: onlyPhoneChars(e.target.value) })} placeholder="+56 9 ..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo</label>
                    <input type="email" className="form-control" value={provForm.email} onChange={(e) => setProvForm({ ...provForm, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Días habituales de entrega</label>
                    <input className="form-control" value={provForm.diasEntrega} onChange={(e) => setProvForm({ ...provForm, diasEntrega: e.target.value })} placeholder="Ej: Lunes y Jueves" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setProvModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Proveedor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Devolución Proveedor (HU-23) */}
      {retModal && (() => {
        const availLots = lots.filter((l) => l.productoId === Number(retForm.productoId) && l.stockActual > 0);
        const selLot = lots.find((l) => l.id === Number(retForm.lotId || availLots[0]?.id));
        const maxRet = selLot?.stockActual || 0;
        const retExcede = Number(retForm.cantidad || 0) > maxRet;
        return (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Registrar Devolución a Proveedor</h3>
            </div>
            <form onSubmit={handleReturnSubmit}>
              <div className="modal-body">
                {retExcede && (
                  <div className="alert-box danger mb-3">
                    <AlertTriangle size={16} />
                    <span>Stock insuficiente en este lote: máximo {maxRet} unidades disponibles.</span>
                  </div>
                )}
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">Proveedor</label>
                    <select className="form-control" value={retForm.proveedorId} onChange={(e) => setRetForm({ ...retForm, proveedorId: e.target.value })}>
                      {providers.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Producto</label>
                    <select
                      className="form-control"
                      value={retForm.productoId}
                      onChange={(e) => setRetForm({ ...retForm, productoId: e.target.value, lotId: '' })}
                    >
                      {products.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lote a devolver</label>
                    <select className="form-control" value={retForm.lotId} onChange={(e) => setRetForm({ ...retForm, lotId: e.target.value })}>
                      {availLots.map((l) => (
                        <option key={l.id} value={l.id}>{l.codigoLote} (Disp: {l.stockActual})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cantidad (máx: {maxRet})</label>
                    <input
                      {...integerInputProps(retForm.cantidad, (val) => {
                        if (val !== '' && Number(val) > maxRet) {
                          notify(`Stock insuficiente en el lote: máximo ${maxRet} unidades.`, 'error');
                        }
                        setRetForm({ ...retForm, cantidad: val });
                      }, { min: 1 })}
                      className="form-control"
                      style={{ borderColor: retExcede ? 'var(--danger)' : undefined }}
                      required
                    />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Motivo obligatorio</label>
                    <select className="form-control" value={retForm.motivo} onChange={(e) => setRetForm({ ...retForm, motivo: e.target.value })}>
                      <option value="Dañado">Dañado</option>
                      <option value="Vencido">Vencido</option>
                      <option value="Enviado por error">Enviado por error</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Detalle</label>
                    <input className="form-control" value={retForm.detalle} onChange={(e) => setRetForm({ ...retForm, detalle: e.target.value })} placeholder="Observaciones del reclamo..." />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setRetModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={retExcede || !selLot || !retForm.cantidad}>Descontar y Registrar Reclamo</button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
