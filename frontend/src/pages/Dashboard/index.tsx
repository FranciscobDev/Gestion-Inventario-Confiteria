import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'
import { DASHBOARD_METRICS } from '../../data/mockData'
import { MetricCard } from './MetricCard'
import { InventoryAlerts } from './InventoryAlerts'
import { SalesChart } from './SalesChart'
import { TopProducts } from './TopProducts'

interface DashboardProps {
  openOrder: () => void
}

export function Dashboard({ openOrder }: DashboardProps) {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Lunes, 16 de junio</div>
          <div className="title">Buenos días, Mariana</div>
          <div className="subtitle">Aquí tienes el resumen de tu negocio.</div>
        </div>
        <Button onClick={openOrder}>
          <Icon name="plus" size={18} /> Orden a proveedor
        </Button>
      </div>

      <div className="metrics">
        {DASHBOARD_METRICS.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="dashboard-grid">
        <InventoryAlerts />
        <SalesChart />
      </div>

      <TopProducts />
    </div>
  )
}
