import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Boxes,
  Search,
  Plus,
  Edit3,
  Eye,
  Power,
  Clock,
  Tag,
  AlertTriangle,
  PackagePlus,
  Trash2,
  Layers,
  History,
  FolderKanban,
  Undo2,
  ImagePlus,
} from 'lucide-react';
import { useApp, formatCLP, todayStr } from '../context/AppContext';
import PasswordModal from '../components/PasswordModal';
import Pagination from '../components/Pagination';
import { ProductAvatar } from '../components/Charts';
import { integerInputProps } from '../utils/validators';

export default function InventarioPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    categories,
    addCategory,
    updateCategory,
    providers,
    products,
    lots,
    combos,
    movements,
    getProductStockInfo,
    getLotExpirationStatus,
    getComboAvailableStock,
    addProduct,
    updateProduct,
    toggleProductActive,
    receiveStock,
    applyLotOffer,
    registerMerma,
    addCombo,
    notify,
  } = useApp();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'catalogo');
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState('nombre');

  // Paginación
  const [catPage, setCatPage] = useState(1);
  const [movPage, setMovPage] = useState(1);
  const PAGE_SIZE = 7;

  // Filtro Kardex (HU-28)
  const [movTipo, setMovTipo] = useState('');

  // Modales
  const [detailProd, setDetailProd] = useState(null);
  const [productModal, setProductModal] = useState(null);
  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const [receiveModal, setReceiveModal] = useState(false);
  const [mermaModal, setMermaModal] = useState(null);
  const [offerModal, setOfferModal] = useState(null);
  const [comboModal, setComboModal] = useState(false);
  const [pwdAction, setPwdAction] = useState(null);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    setCatPage(1);
  }, [query, catFilter, onlyLowStock, showInactive, sortBy]);

  useEffect(() => {
    setMovPage(1);
  }, [movTipo]);

  const [prodForm, setProdForm] = useState({
    codigoBarras: '',
    nombre: '',
    descripcion: '',
    categoriaId: 1,
    proveedorPrincipalId: 1,
    precioCompra: '',
    precioVenta: '',
    stockMinimo: 5,
    stockObjetivo: 20,
    unidadMedida: 'Unidad',
    perecible: true,
    imagen: '',
    loteInicialCodigo: '',
    loteInicialCantidad: '',
    loteInicialVencimiento: '',
  });

  const [recForm, setRecForm] = useState({
    productoId: products[0]?.id || 1,
    codigoLote: '',
    fechaVencimiento: '',
    cantidad: 10,
    precioCompra: products[0]?.precioCompra || 0,
    actualizarPrecioFicha: true,
    motivo: '',
  });

  const [mermaForm, setMermaForm] = useState({
    productoId: 1,
    lotId: '',
    cantidad: 1,
    motivo: 'Vencido',
    detalle: '',
  });

  const [offerPrice, setOfferPrice] = useState('');

  const [comboForm, setComboForm] = useState({
    nombre: '',
    precioEspecial: '',
    fechaInicio: todayStr(),
    fechaFin: '',
    componentes: [{ productoId: products[0]?.id || 1, cantidad: 1 }],
  });

  const openCreateProduct = () => {
    setProdForm({
      codigoBarras: '',
      nombre: '',
      descripcion: '',
      categoriaId: categories[0]?.id || 1,
      proveedorPrincipalId: providers[0]?.id || 1,
      precioCompra: '',
      precioVenta: '',
      stockMinimo: 5,
      stockObjetivo: 20,
      unidadMedida: 'Unidad',
      perecible: true,
      imagen: '',
      loteInicialCodigo: '',
      loteInicialCantidad: '',
      loteInicialVencimiento: '',
    });
    setProductModal({ mode: 'create' });
  };

  const openEditProduct = (p) => {
    setProdForm({
      ...p,
      imagen: p.imagen || '',
      loteInicialCodigo: '',
      loteInicialCantidad: '',
      loteInicialVencimiento: '',
    });
    setProductModal({ mode: 'edit', id: p.id });
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProdForm((prev) => ({ ...prev, imagen: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!prodForm.nombre.trim() || !prodForm.precioCompra || !prodForm.precioVenta) {
      notify('Completa los campos obligatorios.', 'error');
      return;
    }
    const payload = {
      codigoBarras: prodForm.codigoBarras,
      nombre: prodForm.nombre,
      descripcion: prodForm.descripcion,
      categoriaId: Number(prodForm.categoriaId),
      proveedorPrincipalId: Number(prodForm.proveedorPrincipalId),
      proveedoresIds: [Number(prodForm.proveedorPrincipalId)],
      precioCompra: Number(prodForm.precioCompra),
      precioVenta: Number(prodForm.precioVenta),
      stockMinimo: Number(prodForm.stockMinimo),
      stockObjetivo: Number(prodForm.stockObjetivo),
      unidadMedida: prodForm.unidadMedida,
      perecible: Boolean(prodForm.perecible),
      imagen: prodForm.imagen || '',
    };

    if (productModal.mode === 'create') {
      addProduct(payload, {
        codigoLote: prodForm.loteInicialCodigo,
        cantidad: prodForm.loteInicialCantidad,
        fechaVencimiento: prodForm.loteInicialVencimiento || '2027-06-30',
      });
    } else {
      updateProduct(productModal.id, payload);
    }
    setProductModal(null);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    if (editingCat) {
      updateCategory(editingCat.id, catName, catDesc);
    } else {
      addCategory(catName, catDesc);
    }
    setEditingCat(null);
    setCatName('');
    setCatDesc('');
  };

  const handleReceiveSubmit = (e) => {
    e.preventDefault();
    receiveStock({
      ...recForm,
      productoId: Number(recForm.productoId),
    });
    setReceiveModal(false);
  };

  const openMermaModal = (productoId, lotId = '') => {
    const firstLot = lots.find((l) => l.productoId === productoId && l.stockActual > 0);
    setMermaForm({
      productoId,
      lotId: lotId || firstLot?.id || '',
      cantidad: firstLot?.stockActual || 1,
      motivo: lotId ? 'Vencido' : 'Dañado',
      detalle: '',
    });
    setMermaModal(true);
  };

  const handleMermaSubmit = (e) => {
    e.preventDefault();
    const ok = registerMerma({
      productoId: Number(mermaForm.productoId),
      lotId: Number(mermaForm.lotId),
      cantidad: Number(mermaForm.cantidad),
      motivo: `${mermaForm.motivo}${mermaForm.detalle ? ` — ${mermaForm.detalle}` : ''}`,
    });
    if (ok) setMermaModal(false);
  };

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    applyLotOffer(offerModal.id, offerPrice);
    setOfferModal(null);
  };

  const openComboFromLot = (lot) => {
    setComboForm({
      nombre: `Pack Liquidación ${lot.producto?.nombre?.split(' ')[0] || 'Oferta'}`,
      precioEspecial: Math.round((lot.producto?.precioVenta || 2000) * 0.85),
      fechaInicio: todayStr(),
      fechaFin: lot.fechaVencimiento,
      componentes: [{ productoId: lot.productoId, cantidad: 1 }],
    });
    setComboModal(true);
  };

  const handleCreateCombo = (e) => {
    e.preventDefault();
    addCombo({
      nombre: comboForm.nombre,
      precioEspecial: Number(comboForm.precioEspecial),
      fechaInicio: comboForm.fechaInicio,
      fechaFin: comboForm.fechaFin,
      componentes: comboForm.componentes.map((c) => ({
        productoId: Number(c.productoId),
        cantidad: Number(c.cantidad),
      })),
    });
    setComboModal(false);
  };

  const filteredCatalog = products
    .filter((p) => (showInactive ? true : p.activo))
    .filter((p) => {
      const q = query.toLowerCase();
      return p.nombre.toLowerCase().includes(q) || (p.codigoBarras && p.codigoBarras.includes(q));
    })
    .filter((p) => (!catFilter ? true : p.categoriaId === Number(catFilter)))
    .map((p) => ({ ...p, ...getProductStockInfo(p.id) }))
    .filter((p) => (!onlyLowStock ? true : p.stockDisponible <= p.stockMinimo))
    .sort((a, b) => {
      if (sortBy === 'stock') return a.stockDisponible - b.stockDisponible;
      if (sortBy === 'precio') return b.precioVenta - a.precioVenta;
      return a.nombre.localeCompare(b.nombre);
    });

  const pagedCatalog = filteredCatalog.slice((catPage - 1) * PAGE_SIZE, catPage * PAGE_SIZE);

  const filteredMovements = movements.filter((m) => (!movTipo ? true : m.tipo === movTipo));
  const pagedMovements = filteredMovements.slice((movPage - 1) * PAGE_SIZE, movPage * PAGE_SIZE);

  const lotsSorted = lots
    .filter((l) => l.stockActual > 0)
    .map((l) => {
      const prod = products.find((p) => p.id === l.productoId);
      const st = getLotExpirationStatus(l.fechaVencimiento);
      return { ...l, producto: prod, status: st };
    })
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));

  const expiredLots = lotsSorted.filter((l) => l.status.expired);
  const activeLots = lotsSorted.filter((l) => !l.status.expired);

  const comboNormalPrice = comboForm.componentes.reduce((acc, c) => {
    const prod = products.find((p) => p.id === Number(c.productoId));
    return acc + (prod ? prod.precioVenta * Number(c.cantidad) : 0);
  }, 0);
  const comboCost = comboForm.componentes.reduce((acc, c) => {
    const prod = products.find((p) => p.id === Number(c.productoId));
    return acc + (prod ? prod.precioCompra * Number(c.cantidad) : 0);
  }, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Boxes size={24} style={{ color: 'var(--primary)' }} />
            Inventario, Lotes y Catálogo
          </h1>
          <p className="page-subtitle">
            Catálogo con categorías, control de stock disponible/reservado, vencimientos por lote (FEFO), combos y Kardex.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => setCategoryModal(true)}>
            <FolderKanban size={16} /> Categorías
          </button>
          <button className="btn btn-outline" onClick={() => setReceiveModal(true)}>
            <PackagePlus size={16} /> Ingreso Mercadería
          </button>
          <button className="btn btn-outline" onClick={() => openMermaModal(products[0]?.id || 1)}>
            <Trash2 size={16} /> Merma
          </button>
          <button className="btn btn-primary" onClick={openCreateProduct}>
            <Plus size={16} /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="tabs-bar">
        <button className={`tab-btn ${activeTab === 'catalogo' ? 'active' : ''}`} onClick={() => setActiveTab('catalogo')}>
          <Boxes size={16} /> Catálogo ({products.filter((p) => p.activo).length})
        </button>
        <button className={`tab-btn ${activeTab === 'lotes' ? 'active' : ''}`} onClick={() => setActiveTab('lotes')}>
          <Clock size={16} /> Lotes y Vencimientos ({lotsSorted.length})
        </button>
        <button className={`tab-btn ${activeTab === 'combos' ? 'active' : ''}`} onClick={() => setActiveTab('combos')}>
          <Layers size={16} /> Combos ({combos.length})
        </button>
        <button className={`tab-btn ${activeTab === 'kardex' ? 'active' : ''}`} onClick={() => setActiveTab('kardex')}>
          <History size={16} /> Kardex ({movements.length})
        </button>
      </div>

      {/* TAB 1: CATÁLOGO */}
      {activeTab === 'catalogo' && (
        <div className="card">
          <div className="card-header">
            <div className="filter-bar" style={{ width: '100%' }}>
              <div className="input-icon-wrap" style={{ flex: 1, minWidth: 220 }}>
                <Search size={16} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre o código de barras..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select className="form-control" style={{ width: 190 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <select className="form-control" style={{ width: 170 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="nombre">Orden: Nombre (A-Z)</option>
                <option value="stock">Orden: Menor Stock</option>
                <option value="precio">Orden: Mayor Precio</option>
              </select>
              <label className="flex-center small" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={onlyLowStock} onChange={(e) => setOnlyLowStock(e.target.checked)} />
                Solo "Por agotar"
              </label>
              <label className="flex-center small" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                Ver dados de baja
              </label>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="num">P. Compra / Venta</th>
                    <th className="center">Stock Disponible</th>
                    <th className="center">Reservado</th>
                    <th>Próx. Vencimiento</th>
                    <th className="center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCatalog.map((p) => {
                    const cat = categories.find((c) => c.id === p.categoriaId);
                    const low = p.stockDisponible <= p.stockMinimo;
                    const expSt = p.proximoLote ? getLotExpirationStatus(p.proximoLote.fechaVencimiento) : null;
                    return (
                      <tr key={p.id} style={{ opacity: p.activo ? 1 : 0.55 }}>
                        <td>
                          <div className="flex-center">
                            <ProductAvatar product={p} />
                            <div>
                              <div className="fw-bold">
                                {p.nombre} {!p.activo && <span className="badge badge-neutral">Inactivo</span>}
                              </div>
                              <div className="small text-muted">Cód: {p.codigoBarras || 'S/C'}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-neutral">{cat?.nombre}</span></td>
                        <td className="num">
                          <div className="fw-bold">{formatCLP(p.precioVenta)}</div>
                          <div className="small text-muted">Costo: {formatCLP(p.precioCompra)}</div>
                        </td>
                        <td className="center">
                          <span className={`badge ${low ? 'badge-danger' : 'badge-success'}`}>
                            {low && <AlertTriangle size={11} />}
                            {p.stockDisponible} {p.unidadMedida}
                          </span>
                          <div className="small text-muted">Mín: {p.stockMinimo}</div>
                        </td>
                        <td className="center">
                          {p.stockReservado > 0 ? (
                            <span className="badge badge-info">{p.stockReservado} res.</span>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>
                          {expSt ? <span className={`badge ${expSt.badge}`}>{expSt.label}</span> : <span className="text-muted small">Sin stock</span>}
                        </td>
                        <td className="center">
                          <div className="flex-center" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-outline btn-sm" title="Detalle, lotes e historial" onClick={() => setDetailProd(p)}>
                              <Eye size={14} />
                            </button>
                            <button className="btn btn-outline btn-sm" title="Editar" onClick={() => openEditProduct(p)}>
                              <Edit3 size={14} />
                            </button>
                            <button
                              className={`btn btn-sm ${p.activo ? 'btn-outline text-danger' : 'btn-success'}`}
                              title={p.activo ? 'Dar de baja lógica' : 'Reactivar'}
                              onClick={() => {
                                if (p.activo && p.stockFisico > 0) {
                                  notify(`El producto tiene ${p.stockFisico} unidades en stock. Registra una merma antes de dar de baja.`, 'warning');
                                  return;
                                }
                                setPwdAction({
                                  title: p.activo ? 'Desactivar Producto' : 'Reactivar Producto',
                                  message: `Confirma con tu contraseña ${p.activo ? 'la baja lógica' : 'la reactivación'} de "${p.nombre}".`,
                                  onConfirm: () => toggleProductActive(p.id, !p.activo),
                                });
                              }}
                            >
                              <Power size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination totalItems={filteredCatalog.length} pageSize={PAGE_SIZE} currentPage={catPage} onPageChange={setCatPage} />
          </div>
        </div>
      )}

      {/* TAB 2: LOTES Y VENCIMIENTOS (HU-03) */}
      {activeTab === 'lotes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {expiredLots.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
              <div className="card-header" style={{ background: 'var(--danger-bg)' }}>
                <h2 className="card-title text-danger">
                  <AlertTriangle size={17} /> Lotes Ya Vencidos — Acción Requerida
                </h2>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Lote</th>
                        <th>Fecha Vencimiento</th>
                        <th className="center">Stock</th>
                        <th className="num">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiredLots.map((l) => (
                        <tr key={l.id}>
                          <td className="fw-bold">{l.producto?.nombre}</td>
                          <td><code>{l.codigoLote}</code></td>
                          <td><span className="badge badge-danger">{l.status.label} ({l.fechaVencimiento})</span></td>
                          <td className="center fw-bold">{l.stockActual}</td>
                          <td className="num">
                            <div className="flex-center" style={{ justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => navigate(`/admin-panel/proveedores?tab=devoluciones&productoId=${l.productoId}&lotId=${l.id}`)}
                              >
                                <Undo2 size={14} /> Devolver Proveedor
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => openMermaModal(l.productoId, l.id)}>
                                <Trash2 size={14} /> Baja como merma
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Lotes Vigentes Ordenados por Vencimiento (FEFO)</h2>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producto / Lote</th>
                      <th>Vencimiento</th>
                      <th className="center">Stock</th>
                      <th className="num">Costo Lote</th>
                      <th className="num">Precio Venta / Oferta</th>
                      <th className="num">Acciones Rápidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLots.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <div className="fw-bold">{l.producto?.nombre}</div>
                          <div className="small text-muted">Lote <code>{l.codigoLote}</code></div>
                        </td>
                        <td>
                          <span className={`badge ${l.status.badge}`}>{l.status.label}</span>
                          <div className="small text-muted mt-1">{l.fechaVencimiento}</div>
                        </td>
                        <td className="center fw-bold">{l.stockActual}</td>
                        <td className="num">{formatCLP(l.precioCompra)}</td>
                        <td className="num">
                          {l.precioOferta ? (
                            <>
                              <span className="badge badge-primary">{formatCLP(l.precioOferta)}</span>
                              <div className="small text-muted" style={{ textDecoration: 'line-through' }}>
                                {formatCLP(l.producto?.precioVenta)}
                              </div>
                            </>
                          ) : (
                            <span>{formatCLP(l.producto?.precioVenta)}</span>
                          )}
                        </td>
                        <td className="num">
                          <div className="flex-center" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => {
                                setOfferModal(l);
                                setOfferPrice(l.precioOferta || Math.round((l.producto?.precioVenta || 0) * 0.85));
                              }}
                            >
                              <Tag size={14} /> {l.precioOferta ? 'Editar oferta' : 'Oferta'}
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              title="Crear combo para dar salida a este lote"
                              onClick={() => openComboFromLot(l)}
                            >
                              <Layers size={14} /> Combo
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              title="Devolver al proveedor"
                              onClick={() => navigate(`/proveedores?tab=devoluciones&productoId=${l.productoId}&lotId=${l.id}`)}
                            >
                              <Undo2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMBOS (HU-09) */}
      {activeTab === 'combos' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Combos Promocionales Activos</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setComboModal(true)}>
              <Plus size={14} /> Nuevo Combo
            </button>
          </div>
          <div className="card-body">
            <div className="grid-2">
              {combos.map((c) => {
                const normal = c.componentes.reduce((acc, comp) => {
                  const pr = products.find((p) => p.id === comp.productoId);
                  return acc + (pr ? pr.precioVenta * comp.cantidad : 0);
                }, 0);
                const cost = c.componentes.reduce((acc, comp) => {
                  const pr = products.find((p) => p.id === comp.productoId);
                  return acc + (pr ? pr.precioCompra * comp.cantidad : 0);
                }, 0);
                const ahorro = normal - c.precioEspecial;
                const margen = c.precioEspecial - cost;
                const disp = getComboAvailableStock(c);

                return (
                  <div key={c.id} className="card" style={{ borderColor: 'var(--border)' }}>
                    <div className="card-header">
                      <span className="fw-bold">{c.nombre}</span>
                      <span className={`badge ${disp > 0 ? 'badge-success' : 'badge-danger'}`}>
                        Stock disp: {disp} combos
                      </span>
                    </div>
                    <div className="card-body">
                      <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.1rem', fontSize: '0.85rem' }}>
                        {c.componentes.map((comp, idx) => {
                          const pr = products.find((p) => p.id === comp.productoId);
                          return (
                            <li key={idx}>
                              <strong>{comp.cantidad}x</strong> {pr?.nombre}
                            </li>
                          );
                        })}
                      </ul>
                      <div className="flex-between small">
                        <span>Precio normal: <del>{formatCLP(normal)}</del></span>
                        <span>Ahorro cliente: <strong className="text-success">{formatCLP(ahorro)}</strong></span>
                      </div>
                      <div className="flex-between mt-2">
                        <span className="small text-muted">Margen sobre costo: {formatCLP(margen)}</span>
                        <span className="fw-bold" style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>
                          {formatCLP(c.precioEspecial)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KARDEX (HU-28) */}
      {activeTab === 'kardex' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Registro Inmutable de Movimientos (Kardex)</h2>
            <select className="form-control" style={{ width: 210 }} value={movTipo} onChange={(e) => setMovTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              <option value="Ingreso">Ingreso</option>
              <option value="Venta">Venta</option>
              <option value="Merma">Merma</option>
              <option value="Reserva Encargo">Reserva Encargo</option>
              <option value="Devolución Cliente">Devolución Cliente</option>
              <option value="Devolución Proveedor">Devolución Proveedor</option>
            </select>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Tipo</th>
                    <th>Producto / Lote</th>
                    <th className="center">Cantidad</th>
                    <th className="center">Stock Final</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMovements.map((m) => {
                    const pr = products.find((p) => p.id === m.productoId);
                    const badgeCls =
                      m.tipo === 'Ingreso' || m.tipo === 'Devolución Cliente'
                        ? 'badge-success'
                        : m.tipo === 'Merma' || m.tipo === 'Devolución Proveedor'
                          ? 'badge-danger'
                          : m.tipo === 'Reserva Encargo'
                            ? 'badge-info'
                            : 'badge-primary';
                    return (
                      <tr key={m.id}>
                        <td className="small text-muted">{m.fechaHora}</td>
                        <td><span className={`badge ${badgeCls}`}>{m.tipo}</span></td>
                        <td>
                          <div className="fw-bold">{pr?.nombre}</div>
                          <div className="small text-muted">Lote: <code>{m.codigoLote}</code></div>
                        </td>
                        <td className={`center fw-bold ${m.cantidad > 0 ? 'text-success' : m.cantidad < 0 ? 'text-danger' : ''}`}>
                          {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                        </td>
                        <td className="center">{m.stockResultante}</td>
                        <td className="small">{m.motivo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination totalItems={filteredMovements.length} pageSize={PAGE_SIZE} currentPage={movPage} onPageChange={setMovPage} />
          </div>
        </div>
      )}

      {/* MODAL DETALLE PRODUCTO (HU-15) */}
      {detailProd && (
        <div className="modal-backdrop">
          <div className="modal-dialog lg">
            <div className="modal-header">
              <div className="flex-center">
                <ProductAvatar product={detailProd} />
                <h3 className="modal-title">{detailProd.nombre}</h3>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setDetailProd(null)}>Cerrar</button>
            </div>
            <div className="modal-body">
              <div className="grid-2 mb-3">
                <div>
                  <div className="small text-muted">Descripción</div>
                  <p className="small">{detailProd.descripcion || 'Sin descripción'}</p>
                </div>
                <div className="flex-between">
                  <div>
                    <div className="small text-muted">Disponible / Reservado</div>
                    <div className="fw-bold">{detailProd.stockDisponible} disp. / {detailProd.stockReservado} res.</div>
                  </div>
                  <div>
                    <div className="small text-muted">Precio Venta</div>
                    <div className="fw-bold">{formatCLP(detailProd.precioVenta)}</div>
                  </div>
                </div>
              </div>
              <h4 className="small fw-bold text-muted mb-2">LOTES ACTUALES</h4>
              <table className="data-table mb-3">
                <thead>
                  <tr><th>Lote</th><th>Vencimiento</th><th className="center">Stock</th><th className="num">Costo</th></tr>
                </thead>
                <tbody>
                  {detailProd.lotes.map((l) => (
                    <tr key={l.id}>
                      <td><code>{l.codigoLote}</code></td>
                      <td>{l.fechaVencimiento}</td>
                      <td className="center fw-bold">{l.stockActual}</td>
                      <td className="num">{formatCLP(l.precioCompra)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h4 className="small fw-bold text-muted mb-2">HISTORIAL DE PRECIOS</h4>
              <table className="data-table">
                <thead>
                  <tr><th>Fecha</th><th className="num">Compra</th><th className="num">Venta</th><th>Motivo</th></tr>
                </thead>
                <tbody>
                  {detailProd.historialPrecios.map((hp, i) => (
                    <tr key={i}>
                      <td className="small">{hp.fecha}</td>
                      <td className="num">{formatCLP(hp.precioCompra)}</td>
                      <td className="num fw-bold">{formatCLP(hp.precioVenta)}</td>
                      <td className="small text-muted">{hp.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PRODUCTO (HU-01, HU-16) */}
      {productModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog lg">
            <div className="modal-header">
              <h3 className="modal-title">
                {productModal.mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
              </h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setProductModal(null)}>
                Cerrar
              </button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input className="form-control" value={prodForm.nombre} onChange={(e) => setProdForm({ ...prodForm, nombre: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Código de Barras (solo números)</label>
                    <input {...integerInputProps(prodForm.codigoBarras, (val) => setProdForm({ ...prodForm, codigoBarras: val }))} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select className="form-control" value={prodForm.categoriaId} onChange={(e) => setProdForm({ ...prodForm, categoriaId: e.target.value })}>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proveedor Principal</label>
                    <select className="form-control" value={prodForm.proveedorPrincipalId} onChange={(e) => setProdForm({ ...prodForm, proveedorPrincipalId: e.target.value })}>
                      {providers.map((pr) => <option key={pr.id} value={pr.id}>{pr.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio Compra *</label>
                    <input {...integerInputProps(prodForm.precioCompra, (val) => setProdForm({ ...prodForm, precioCompra: val }), { min: 1 })} className="form-control" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio Venta *</label>
                    <input {...integerInputProps(prodForm.precioVenta, (val) => setProdForm({ ...prodForm, precioVenta: val }), { min: 1 })} className="form-control" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock Mínimo</label>
                    <input {...integerInputProps(prodForm.stockMinimo, (val) => setProdForm({ ...prodForm, stockMinimo: val }))} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unidad de Medida</label>
                    <select className="form-control" value={prodForm.unidadMedida} onChange={(e) => setProdForm({ ...prodForm, unidadMedida: e.target.value })}>
                      <option value="Unidad">Unidad</option>
                      <option value="Gramos">Gramos</option>
                      <option value="Kilos">Kilos</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label className="form-label flex-center"><ImagePlus size={14} /> Imagen del Producto (Opcional)</label>
                    <div className="flex-center">
                      {prodForm.imagen && <img src={prodForm.imagen} alt="Vista previa" className="prod-thumb" />}
                      <input type="file" accept="image/*" className="form-control" onChange={handleImagePick} />
                    </div>
                  </div>
                  {productModal.mode === 'create' && (
                    <>
                      <div className="form-group full" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        <strong className="small">Lote y Stock Inicial (Opcional)</strong>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Código de Lote</label>
                        <input className="form-control" placeholder="Ej: L-001" value={prodForm.loteInicialCodigo} onChange={(e) => setProdForm({ ...prodForm, loteInicialCodigo: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Cantidad Inicial</label>
                        <input {...integerInputProps(prodForm.loteInicialCantidad, (val) => setProdForm({ ...prodForm, loteInicialCantidad: val }))} className="form-control" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Fecha de Vencimiento</label>
                        <input type="date" className="form-control" value={prodForm.loteInicialVencimiento} onChange={(e) => setProdForm({ ...prodForm, loteInicialVencimiento: e.target.value })} />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setProductModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATEGORÍAS (HU-01) */}
      {categoryModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Gestionar Categorías</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setCategoryModal(false)}>Cerrar</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveCategory} className="mb-3" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">{editingCat ? 'Editar nombre' : 'Nueva categoría'}</label>
                    <input className="form-control" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Ej: Helados y Paletas" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descripción breve</label>
                    <input className="form-control" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} placeholder="Opcional" />
                  </div>
                </div>
                <div className="flex-center mt-2">
                  <button type="submit" className="btn btn-primary btn-sm">
                    {editingCat ? 'Guardar cambios' : 'Agregar categoría'}
                  </button>
                  {editingCat && (
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => { setEditingCat(null); setCatName(''); setCatDesc(''); }}>
                      Cancelar edición
                    </button>
                  )}
                </div>
              </form>
              <table className="data-table">
                <thead>
                  <tr><th>Nombre</th><th>Descripción</th><th className="num">Editar</th></tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-bold">{c.nombre}</td>
                      <td className="small text-muted">{c.descripcion || '—'}</td>
                      <td className="num">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setEditingCat(c);
                            setCatName(c.nombre);
                            setCatDesc(c.descripcion || '');
                          }}
                        >
                          <Edit3 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INGRESO MERCADERÍA (HU-18) */}
      {receiveModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Ingreso de Mercadería por Lote</h3>
            </div>
            <form onSubmit={handleReceiveSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">Producto *</label>
                    <select
                      className="form-control"
                      value={recForm.productoId}
                      onChange={(e) => {
                        const pr = products.find((p) => p.id === Number(e.target.value));
                        setRecForm({ ...recForm, productoId: e.target.value, precioCompra: pr?.precioCompra || 0 });
                      }}
                    >
                      {products.filter((p) => p.activo).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cantidad recibida *</label>
                    <input {...integerInputProps(recForm.cantidad, (val) => setRecForm({ ...recForm, cantidad: val }), { min: 1 })} className="form-control" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio Compra Unitario *</label>
                    <input {...integerInputProps(recForm.precioCompra, (val) => setRecForm({ ...recForm, precioCompra: val }), { min: 1 })} className="form-control" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Código de Lote</label>
                    <input className="form-control" placeholder="Automático si se omite" value={recForm.codigoLote} onChange={(e) => setRecForm({ ...recForm, codigoLote: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de Vencimiento *</label>
                    <input type="date" className="form-control" value={recForm.fechaVencimiento} onChange={(e) => setRecForm({ ...recForm, fechaVencimiento: e.target.value })} required />
                  </div>
                  <div className="form-group full">
                    <label className="flex-center small">
                      <input type="checkbox" checked={recForm.actualizarPrecioFicha} onChange={(e) => setRecForm({ ...recForm, actualizarPrecioFicha: e.target.checked })} />
                      Actualizar precio de compra en la ficha del producto si cambió
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setReceiveModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Confirmar Ingreso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MERMA (HU-08) */}
      {mermaModal && (() => {
        const selectedMermaLot = lots.find((l) => l.id === Number(mermaForm.lotId));
        const maxMerma = selectedMermaLot?.stockActual || 0;
        const mermaExcede = Number(mermaForm.cantidad || 0) > maxMerma;
        return (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-header">
                <h3 className="modal-title">Registrar Merma / Producto Dañado</h3>
              </div>
              <form onSubmit={handleMermaSubmit}>
                <div className="modal-body">
                  {mermaExcede && (
                    <div className="alert-box danger mb-3">
                      <AlertTriangle size={16} />
                      <span>Stock insuficiente en este lote: solo hay {maxMerma} unidades disponibles.</span>
                    </div>
                  )}
                  <div className="form-grid">
                    <div className="form-group full">
                      <label className="form-label">Producto</label>
                      <select
                        className="form-control"
                        value={mermaForm.productoId}
                        onChange={(e) => {
                          const pid = Number(e.target.value);
                          const firstLot = lots.find((l) => l.productoId === pid && l.stockActual > 0);
                          setMermaForm({ ...mermaForm, productoId: pid, lotId: firstLot?.id || '' });
                        }}
                      >
                        {products.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lote afectado</label>
                      <select className="form-control" value={mermaForm.lotId} onChange={(e) => setMermaForm({ ...mermaForm, lotId: e.target.value })} required>
                        {lots.filter((l) => l.productoId === Number(mermaForm.productoId) && l.stockActual > 0).map((l) => (
                          <option key={l.id} value={l.id}>{l.codigoLote} (Disp: {l.stockActual})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cantidad (máx: {maxMerma})</label>
                      <input
                        {...integerInputProps(mermaForm.cantidad, (val) => {
                          if (val !== '' && Number(val) > maxMerma) {
                            notify(`Stock insuficiente en el lote: máximo ${maxMerma} unidades.`, 'error');
                          }
                          setMermaForm({ ...mermaForm, cantidad: val });
                        }, { min: 1 })}
                        className="form-control"
                        style={{ borderColor: mermaExcede ? 'var(--danger)' : undefined }}
                        required
                      />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Motivo</label>
                      <select className="form-control" value={mermaForm.motivo} onChange={(e) => setMermaForm({ ...mermaForm, motivo: e.target.value })}>
                        <option value="Vencido">Vencido</option>
                        <option value="Dañado">Dañado</option>
                        <option value="Pérdida">Pérdida</option>
                        <option value="Muestra">Muestra</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setMermaModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-danger" disabled={mermaExcede || !mermaForm.lotId || !mermaForm.cantidad}>Registrar Merma</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL OFERTA LOTE CON PORCENTAJES (HU-03) */}
      {offerModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 className="modal-title">Oferta para Lote {offerModal.codigoLote}</h3>
            </div>
            <form onSubmit={handleOfferSubmit}>
              <div className="modal-body">
                <p className="small text-muted mb-2">
                  Precio normal: <strong>{formatCLP(offerModal.producto?.precioVenta)}</strong> · Costo lote: <strong>{formatCLP(offerModal.precioCompra)}</strong>
                </p>
                <div className="flex-center mb-3">
                  {[15, 25, 40].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setOfferPrice(Math.round((offerModal.producto?.precioVenta || 0) * (1 - pct / 100)))}
                    >
                      -{pct}% dcto
                    </button>
                  ))}
                  {offerModal.precioOferta && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm text-danger"
                      onClick={() => {
                        applyLotOffer(offerModal.id, null);
                        setOfferModal(null);
                      }}
                    >
                      Quitar oferta
                    </button>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Nuevo precio de oferta (CLP)</label>
                  <input {...integerInputProps(offerPrice, setOfferPrice, { min: 1 })} className="form-control" required />
                </div>
                {Number(offerPrice) > 0 && Number(offerPrice) < offerModal.precioCompra && (
                  <div className="alert-box danger mt-2">
                    <AlertTriangle size={16} />
                    <span>Advertencia: El precio de oferta queda bajo el costo de compra ({formatCLP(offerModal.precioCompra)}).</span>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setOfferModal(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Oferta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR COMBO (HU-09) */}
      {comboModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Crear Combo Promocional</h3>
            </div>
            <form onSubmit={handleCreateCombo}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nombre del Combo *</label>
                    <input className="form-control" value={comboForm.nombre} onChange={(e) => setComboForm({ ...comboForm, nombre: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio Especial Combo *</label>
                    <input {...integerInputProps(comboForm.precioEspecial, (val) => setComboForm({ ...comboForm, precioEspecial: val }), { min: 1 })} className="form-control" required />
                  </div>
                  <div className="form-group full">
                    <div className="flex-between mb-2">
                      <label className="form-label">Productos componentes</label>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setComboForm({ ...comboForm, componentes: [...comboForm.componentes, { productoId: products[0]?.id || 1, cantidad: 1 }] })}
                      >
                        + Producto
                      </button>
                    </div>
                    {comboForm.componentes.map((comp, idx) => (
                      <div key={idx} className="flex-center mb-2">
                        <select
                          className="form-control"
                          value={comp.productoId}
                          onChange={(e) => {
                            const next = [...comboForm.componentes];
                            next[idx].productoId = e.target.value;
                            setComboForm({ ...comboForm, componentes: next });
                          }}
                        >
                          {products.filter((p) => p.activo).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                        <input
                          {...integerInputProps(comp.cantidad, (val) => {
                            const next = [...comboForm.componentes];
                            next[idx].cantidad = val;
                            setComboForm({ ...comboForm, componentes: next });
                          }, { min: 1 })}
                          className="form-control"
                          style={{ width: 85 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="alert-box info mt-2">
                  <span className="small">
                    Precio normal suma: <strong>{formatCLP(comboNormalPrice)}</strong> · Margen estimado:{' '}
                    <strong>{formatCLP((Number(comboForm.precioEspecial) || 0) - comboCost)}</strong>
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setComboModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Combo</button>
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
