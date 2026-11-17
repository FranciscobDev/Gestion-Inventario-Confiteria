import React, { useState, useRef } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  LayoutGrid,
  List,
  Barcode,
} from 'lucide-react';
import { useApp, formatCLP, todayStr } from '../context/AppContext';
import { ProductAvatar } from '../components/Charts';
import { integerInputProps } from '../utils/validators';

function playScanBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch {
    // Ignorar si navegador bloquea audio sin gesto previo
  }
}

export default function SalidasStockPage() {
  const {
    products,
    combos,
    lots,
    getProductStockInfo,
    getComboAvailableStock,
    registerStockSales,
    registerClientReturn,
    notify,
  } = useApp();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [cart, setCart] = useState([]);
  const [fechaSalida, setFechaSalida] = useState(todayStr());
  const searchInputRef = useRef(null);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [retProductId, setRetProductId] = useState(products[0]?.id || 1);
  const [retLotId, setRetLotId] = useState('');
  const [retQty, setRetQty] = useState('1');
  const [retGood, setRetGood] = useState(true);
  const [retMotivo, setRetMotivo] = useState('');

  const activeProducts = products.filter((p) => p.activo);
  const activeCombos = combos.filter((c) => c.activo);

  const filteredProducts = activeProducts.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigoBarras && p.codigoBarras.includes(search))
  );

  const filteredCombos = activeCombos.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const addProductToCart = (prod) => {
    const info = getProductStockInfo(prod.id);
    if (info.stockDisponible <= 0) {
      notify(`Sin stock disponible para "${prod.nombre}".`, 'error');
      return;
    }
    const existing = cart.find((i) => !i.isCombo && i.productoId === prod.id);
    if (existing && Number(existing.cantidad) + 1 > info.stockDisponible) {
      notify(
        `No tienes suficiente stock de "${prod.nombre}". Disponible: ${info.stockDisponible} ${prod.unidadMedida}.`,
        'error'
      );
      return;
    }
    setCart((prev) => {
      const curr = prev.find((i) => !i.isCombo && i.productoId === prod.id);
      if (curr) {
        return prev.map((i) =>
          !i.isCombo && i.productoId === prod.id
            ? { ...i, cantidad: String(Number(i.cantidad || 0) + 1) }
            : i
        );
      }
      return [
        ...prev,
        {
          key: `p-${prod.id}`,
          isCombo: false,
          productoId: prod.id,
          nombre: prod.nombre,
          precioRef: prod.precioVenta,
          cantidad: '1',
          stockDisponible: info.stockDisponible,
          proximoLote: info.proximoLote,
        },
      ];
    });
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    const term = search.trim();
    if (!term) return;
    const exactCode = activeProducts.find((p) => p.codigoBarras === term);
    const target = exactCode || (filteredProducts.length === 1 ? filteredProducts[0] : null);
    if (target) {
      e.preventDefault();
      addProductToCart(target);
      playScanBeep();
      setSearch('');
      searchInputRef.current?.focus();
    }
  };

  const addComboToCart = (combo) => {
    const disp = getComboAvailableStock(combo);
    if (disp <= 0) {
      notify(`Stock insuficiente de componentes para el combo "${combo.nombre}".`, 'error');
      return;
    }
    const existing = cart.find((i) => i.isCombo && i.comboId === combo.id);
    if (existing && Number(existing.cantidad) + 1 > disp) {
      notify(`No tienes suficiente stock para otro "${combo.nombre}". Máximo disponible: ${disp}.`, 'error');
      return;
    }
    setCart((prev) => {
      const curr = prev.find((i) => i.isCombo && i.comboId === combo.id);
      if (curr) {
        return prev.map((i) =>
          i.isCombo && i.comboId === combo.id ? { ...i, cantidad: String(Number(i.cantidad || 0) + 1) } : i
        );
      }
      return [
        ...prev,
        {
          key: `c-${combo.id}`,
          isCombo: true,
          comboId: combo.id,
          nombre: `Combo: ${combo.nombre}`,
          precioRef: combo.precioEspecial,
          cantidad: '1',
          stockDisponible: disp,
        },
      ];
    });
  };

  const updateCartQty = (key, rawVal) => {
    const target = cart.find((i) => i.key === key);
    if (target && rawVal !== '') {
      const num = Number(rawVal);
      if (num > target.stockDisponible) {
        notify(
          `Stock insuficiente para "${target.nombre}": quedan ${target.stockDisponible} disponibles y marcaste ${num}.`,
          'error'
        );
      }
    }
    setCart((prev) => prev.map((i) => (i.key === key ? { ...i, cantidad: rawVal } : i)));
  };

  const removeCartItem = (key) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  };

  // Validar conflicto acumulado entre productos individuales y combos
  const requiredByProduct = {};
  cart.forEach((item) => {
    const qty = Number(item.cantidad || 0);
    if (item.isCombo) {
      const combo = combos.find((c) => c.id === item.comboId);
      combo?.componentes.forEach((comp) => {
        requiredByProduct[comp.productoId] = (requiredByProduct[comp.productoId] || 0) + comp.cantidad * qty;
      });
    } else {
      requiredByProduct[item.productoId] = (requiredByProduct[item.productoId] || 0) + qty;
    }
  });

  const combinedShortages = Object.entries(requiredByProduct)
    .map(([pidStr, req]) => {
      const pid = Number(pidStr);
      const prod = products.find((p) => p.id === pid);
      const { stockDisponible } = getProductStockInfo(pid);
      return req > stockDisponible ? { nombre: prod?.nombre, req, stockDisponible } : null;
    })
    .filter(Boolean);

  const hasInvalidQty = cart.some((i) => !i.cantidad || Number(i.cantidad) <= 0);
  const hasInsufficient =
    cart.some((i) => Number(i.cantidad || 0) > i.stockDisponible) || combinedShortages.length > 0;

  const handleConfirm = async () => {
    if (cart.length === 0 || hasInvalidQty || hasInsufficient) {
      if (hasInsufficient) {
        notify('No puedes confirmar una salida que deje el stock bajo cero.', 'error');
      }
      return;
    }
    const ok = await registerStockSales(
      cart.map((i) => ({ ...i, cantidad: Number(i.cantidad) })),
      fechaSalida
    );
    if (ok !== false) setCart([]);
  };

  const lotsForReturn = lots.filter((l) => l.productoId === Number(retProductId));

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    const targetLotId = Number(retLotId || lotsForReturn[0]?.id);
    if (!targetLotId) {
      notify('No hay lotes registrados para ese producto.', 'error');
      return;
    }
    const qtyNum = Number(retQty || 0);
    if (qtyNum <= 0) {
      notify('Ingresa una cantidad entera mayor a 0.', 'error');
      return;
    }
    await registerClientReturn({
      productoId: Number(retProductId),
      lotId: targetLotId,
      cantidad: qtyNum,
      enBuenEstado: retGood,
      motivo: retMotivo || 'Devolución en mostrador',
    });
    setShowReturnModal(false);
    setRetMotivo('');
    setRetQty('1');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShoppingCart size={24} style={{ color: 'var(--primary)' }} />
            Salida de Stock por Venta (FEFO)
          </h1>
          <p className="page-subtitle">
            Modo mostrador / escáner de código de barras. Descuenta del lote que vence antes (no registra dinero en Finanzas).
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => setShowReturnModal(true)}>
            <RotateCcw size={16} /> Reingreso Devolución Cliente
          </button>
        </div>
      </div>

      <div className="grid-pos">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Catálogo Rápido (Productos y Combos)</h2>
            <div className="flex-center">
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={14} /> POS
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setViewMode('table')}
              >
                <List size={14} /> Lista
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="input-icon-wrap mb-3">
              <Barcode size={16} />
              <input
                ref={searchInputRef}
                type="text"
                className="form-control"
                placeholder="Escanea código de barras + Enter, o busca por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                autoFocus
              />
            </div>

            {filteredCombos.length > 0 && (
              <div className="mb-3">
                <div className="small fw-bold text-muted mb-2 flex-center">
                  <Layers size={14} /> COMBOS DISPONIBLES
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem' }}>
                  {filteredCombos.map((c) => {
                    const disp = getComboAvailableStock(c);
                    return (
                      <div
                        key={c.id}
                        style={{
                          border: '1px solid var(--primary-border)',
                          background: 'var(--primary-soft)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.7rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <div>
                          <div className="fw-bold small">{c.nombre}</div>
                          <div className="small text-muted">
                            {formatCLP(c.precioEspecial)} · Disp: <strong>{disp}</strong>
                          </div>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => addComboToCart(c)}
                          disabled={disp <= 0}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'grid' ? (
              <div className="pos-cards-grid">
                {filteredProducts.map((p) => {
                  const info = getProductStockInfo(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className="pos-tile"
                      onClick={() => addProductToCart(p)}
                      disabled={info.stockDisponible <= 0}
                    >
                      <div className="flex-between" style={{ width: '100%' }}>
                        <ProductAvatar product={p} />
                        <span className={`badge ${info.stockDisponible <= p.stockMinimo ? 'badge-warning' : 'badge-success'}`}>
                          {info.stockDisponible} {p.unidadMedida}
                        </span>
                      </div>
                      <div>
                        <div className="fw-bold small" style={{ lineHeight: 1.25 }}>{p.nombre}</div>
                        <div className="small text-muted mt-1">{formatCLP(p.precioVenta)}</div>
                      </div>
                      <div className="small text-muted">
                        {info.proximoLote ? `FEFO: ${info.proximoLote.codigoLote}` : 'Sin stock'}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="center">Disponible</th>
                      <th>Lote FEFO</th>
                      <th className="num">Agregar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const info = getProductStockInfo(p.id);
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="flex-center">
                              <ProductAvatar product={p} />
                              <div>
                                <div className="fw-bold">{p.nombre}</div>
                                <div className="small text-muted">
                                  {p.codigoBarras} · Ref. {formatCLP(p.precioVenta)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="center">
                            <span className={`badge ${info.stockDisponible <= p.stockMinimo ? 'badge-warning' : 'badge-success'}`}>
                              {info.stockDisponible} {p.unidadMedida}
                            </span>
                          </td>
                          <td className="small">
                            {info.proximoLote ? (
                              <>
                                <code>{info.proximoLote.codigoLote}</code>
                                <div className="text-muted">Vence {info.proximoLote.fechaVencimiento}</div>
                              </>
                            ) : (
                              <span className="text-danger">Sin stock</span>
                            )}
                          </td>
                          <td className="num">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => addProductToCart(p)}
                              disabled={info.stockDisponible <= 0}
                            >
                              <Plus size={14} /> Añadir
                            </button>
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

        {/* Lista de salida a confirmar */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Detalle de Salida a Descontar</h2>
            <span className="badge badge-neutral">{cart.length} ítem(s)</span>
          </div>
          <div className="card-body">
            <div className="form-group mb-3">
              <label className="form-label">Fecha real de la salida</label>
              <input
                type="date"
                className="form-control"
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
              />
            </div>

            {hasInsufficient && (
              <div className="alert-box danger mb-3">
                <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Stock insuficiente:</strong> No puedes sacar más unidades de las que hay disponibles (dejaría el inventario bajo 0).
                  {combinedShortages.map((s, idx) => (
                    <div key={idx} className="small mt-1">
                      • <strong>{s.nombre}</strong>: disponibles {s.stockDisponible}, solicitadas {s.req}.
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="empty-state">
                Escanea un código de barras o pulsa una tarjeta de producto para comenzar.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {cart.map((item) => {
                  const qtyNum = Number(item.cantidad || 0);
                  const excede = qtyNum > item.stockDisponible;
                  return (
                    <div
                      key={item.key}
                      style={{
                        border: `1px solid ${excede ? 'var(--danger)' : 'var(--border)'}`,
                        background: excede ? 'var(--danger-bg)' : undefined,
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.7rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="fw-bold small">{item.nombre}</div>
                        <div className={`small ${excede ? 'text-danger fw-bold' : 'text-muted'}`}>
                          {excede
                            ? `¡Insuficiente! Quedan solo ${item.stockDisponible} disponibles`
                            : `Disp: ${item.stockDisponible}${item.proximoLote ? ` · FEFO: ${item.proximoLote.codigoLote}` : ''}`}
                        </div>
                      </div>
                      <input
                        {...integerInputProps(item.cantidad, (val) => updateCartQty(item.key, val), { min: 1 })}
                        className="form-control"
                        style={{ width: 76, textAlign: 'center', borderColor: excede ? 'var(--danger)' : undefined }}
                      />
                      <button
                        className="btn btn-ghost btn-sm text-danger"
                        onClick={() => removeCartItem(item.key)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="alert-box info mt-3">
              <span className="small">
                Al confirmar, cada línea genera un movimiento tipo <strong>Venta</strong> en el Kardex y guarda el costo del lote descontado.
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-lg mt-3"
              style={{ width: '100%' }}
              disabled={cart.length === 0 || hasInvalidQty || hasInsufficient}
              onClick={handleConfirm}
            >
              <CheckCircle2 size={18} /> Confirmar Descuento de Stock
            </button>
          </div>
        </div>
      </div>

      {/* Modal Reingreso Devolución Cliente */}
      {showReturnModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Reingreso por Devolución de Cliente</h3>
            </div>
            <form onSubmit={handleReturnSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">Producto devuelto</label>
                    <select
                      className="form-control"
                      value={retProductId}
                      onChange={(e) => {
                        setRetProductId(e.target.value);
                        setRetLotId('');
                      }}
                    >
                      {activeProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lote de destino</label>
                    <select
                      className="form-control"
                      value={retLotId}
                      onChange={(e) => setRetLotId(e.target.value)}
                    >
                      {lotsForReturn.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.codigoLote} (Vence {l.fechaVencimiento})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cantidad devuelta (entero)</label>
                    <input
                      {...integerInputProps(retQty, setRetQty, { min: 1 })}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Estado físico del producto</label>
                    <select
                      className="form-control"
                      value={retGood ? 'bueno' : 'malo'}
                      onChange={(e) => setRetGood(e.target.value === 'bueno')}
                    >
                      <option value="bueno">Buen estado (Reingresa al stock del lote)</option>
                      <option value="malo">Dañado / Abierto (Registrar como Merma)</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Motivo de la devolución</label>
                    <input
                      type="text"
                      className="form-control"
                      value={retMotivo}
                      onChange={(e) => setRetMotivo(e.target.value)}
                      placeholder="Ej: Cambio por otro sabor, empaque equivocado..."
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowReturnModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Reingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
