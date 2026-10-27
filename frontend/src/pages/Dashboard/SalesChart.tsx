import { Card } from '../../components/common/Card'
import { Icon } from '../../components/common/Icon'
import { WEEKLY_CHART } from '../../data/mockData'

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function SalesChart() {
  return (
    <Card className="chart-card">
      <div className="card-title-row">
        <div>
          <div className="section-title">Ventas últimos 7 días</div>
          <div className="big-inline">
            $1.284.300 <span>+9,8%</span>
          </div>
        </div>
        <button className="icon-button" aria-label="Más opciones">
          <Icon name="more" />
        </button>
      </div>

      <div className="bar-chart">
        {WEEKLY_CHART.map((val, idx) => (
          <div className="bar-wrap" key={idx}>
            <div className="bar" style={{ height: `${val}%` }} />
            <span>{DAYS[idx]}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
