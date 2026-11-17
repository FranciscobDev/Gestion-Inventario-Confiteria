import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Boxes, ShoppingCart, Wallet, CalendarClock, BarChart3, Truck, X } from 'lucide-react';
import { useApp, formatCLP } from '../context/AppContext';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { products, orders, getProductStockInfo } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  const quickActions = [
    { label: 'Ir a Salidas de Stock (FEFO)', to: '/salidas', icon: ShoppingCart },
    { label: 'Ir a Registrar Venta en Caja (Finanzas)', to: '/finanzas', icon: Wallet },
    { label: 'Ir a Inventario, Lotes y Kardex', to: '/inventario', icon: Boxes },
    { label: 'Ir a Lotes Próximos a Vencer', to: '/inventario?tab=lotes', icon: Boxes },
    { label: 'Ir a Encargos y Reservas', to: '/encargos', icon: CalendarClock },
    { label: 'Ir a Proveedores y Sugerencias de Compra', to: '/proveedores?tab=sugerencias', icon: Truck },
    { label: 'Ir a Reportes y Detector de Descuadres', to: '/reportes', icon: BarChart3 },
  ];

  const q = query.trim().toLowerCase();

  const matchedActions = quickActions.filter((a) => a.label.toLowerCase().includes(q));
  const matchedProducts = q
    ? products
        .filter((p) => p.activo && (p.nombre.toLowerCase().includes(q) || (p.codigoBarras || '').includes(q)))
        .slice(0, 5)
    : [];
  const matchedOrders = q
    ? orders
        .filter((o) => o.clienteNombre.toLowerCase().includes(q) || String(o.id) === q)
        .slice(0, 3)
    : [];

  const go = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '0.75rem 1rem' }}>
          <div className="input-icon-wrap" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              type="text"
              className="form-control"
              style={{ border: 'none', boxShadow: 'none' }}
              placeholder="Buscar producto, código de barras, cliente o acción..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '0.75rem', maxHeight: 380 }}>
          {matchedProducts.length > 0 && (
            <div className="mb-3">
              <div className="small fw-bold text-muted" style={{ padding: '0.25rem 0.6rem' }}>
                PRODUCTOS EN CATÁLOGO
              </div>
              {matchedProducts.map((p) => {
                const info = getProductStockInfo(p.id);
                return (
                  <button key={p.id} className="cmd-item" onClick={() => go('/inventario')}>
                    <div>
                      <div className="fw-bold">{p.nombre}</div>
                      <div className="small text-muted">
                        Stock disp: {info.stockDisponible} · {formatCLP(p.precioVenta)}
                      </div>
                    </div>
                    <ArrowRight size={15} />
                  </button>
                );
              })}
            </div>
          )}

          {matchedOrders.length > 0 && (
            <div className="mb-3">
              <div className="small fw-bold text-muted" style={{ padding: '0.25rem 0.6rem' }}>
                ENCARGOS
              </div>
              {matchedOrders.map((o) => (
                <button key={o.id} className="cmd-item" onClick={() => go('/encargos')}>
                  <div>
                    <div className="fw-bold">#{o.id} — {o.clienteNombre}</div>
                    <div className="small text-muted">
                      Entrega {o.fechaEntrega} · {o.estado}
                    </div>
                  </div>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          )}

          <div>
            <div className="small fw-bold text-muted" style={{ padding: '0.25rem 0.6rem' }}>
              ACCESOS RÁPIDOS
            </div>
            {matchedActions.map((act) => (
              <button key={act.to} className="cmd-item" onClick={() => go(act.to)}>
                <span className="flex-center">
                  <act.icon size={15} />
                  <span>{act.label}</span>
                </span>
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
