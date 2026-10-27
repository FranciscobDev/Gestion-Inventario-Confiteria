import { Card } from '../../components/common/Card'
import { EXPIRY_ALERTS, STOCK_ALERTS } from '../../data/mockData'
import type { ExpiryAlert, StockDepletionAlert } from '../../types/product'

function AlertRow({ name, meta, badge, danger = false }: ExpiryAlert) {
  return (
    <div className="alert-row">
      <div className={`alert-dot ${danger ? 'danger' : ''}`} />
      <div className="grow">
        <strong>{name}</strong>
        <small>{meta}</small>
      </div>
      <span className={`badge ${danger ? 'badge-danger' : 'badge-warn'}`}>{badge}</span>
    </div>
  )
}

function StockAlert({ name, value, pct, danger = false }: StockDepletionAlert) {
  return (
    <div className="stock-alert">
      <div className="stock-line">
        <strong>{name}</strong>
        <span>{value}</span>
      </div>
      <div className="progress">
        <i className={danger ? 'danger' : ''} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function InventoryAlerts() {
  return (
    <Card className="alerts-card">
      <div className="card-title-row">
        <div>
          <div className="section-title">Alertas de inventario</div>
          <div className="section-subtitle">Requieren tu atención</div>
        </div>
        <span className="alert-count">5 pendientes</span>
      </div>

      <div className="alert-columns">
        <div>
          <div className="mini-title">Lotes próximos a vencer</div>
          {EXPIRY_ALERTS.map((alert) => (
            <AlertRow key={alert.name} {...alert} />
          ))}
        </div>

        <div>
          <div className="mini-title">Productos por agotar</div>
          {STOCK_ALERTS.map((alert) => (
            <StockAlert key={alert.name} {...alert} />
          ))}
        </div>
      </div>
    </Card>
  )
}
