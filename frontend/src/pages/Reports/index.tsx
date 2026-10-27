import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'
import { SalesChart } from '../Dashboard/SalesChart'
import { TopProducts } from '../Dashboard/TopProducts'

export function Reports() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="title">Reportes y Analítica</div>
          <div className="subtitle">
            Métricas de rotación, márgenes y ventas consolidadas.
          </div>
        </div>
        <Button variant="secondary">
          <Icon name="arrow" size={17} /> Exportar CSV
        </Button>
      </div>

      <div className="dashboard-grid">
        <SalesChart />
        <Card>
          <div className="card-title-row">
            <div>
              <div className="section-title">Resumen del Período</div>
              <div className="section-subtitle">Últimos 30 días</div>
            </div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="alert-row">
              <div className="grow">
                <strong>Ticket Promedio</strong>
                <small>Calculado sobre 412 transacciones</small>
              </div>
              <strong>$8.450</strong>
            </div>
            <div className="alert-row">
              <div className="grow">
                <strong>Rotación de Inventario</strong>
                <small>Días promedio en estantería</small>
              </div>
              <strong>14 días</strong>
            </div>
            <div className="alert-row">
              <div className="grow">
                <strong>Mermas / Vencimientos</strong>
                <small>0.8% del stock total</small>
              </div>
              <strong style={{ color: '#ef4444' }}>-$38.200</strong>
            </div>
          </div>
        </Card>
      </div>

      <TopProducts />
    </div>
  )
}
