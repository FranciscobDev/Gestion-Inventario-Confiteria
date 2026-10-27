import { Card } from '../../components/common/Card'
import { Icon } from '../../components/common/Icon'
import type { MetricItem } from '../../types/product'

export function MetricCard({ label, value, trend, tone, spark }: MetricItem) {
  const iconName = tone === 'green' ? 'sale' : tone === 'blue' ? 'box' : 'chart'

  return (
    <Card className="metric">
      <div className={`metric-icon ${tone}`}>
        <Icon name={iconName} />
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">
        <span>↗ {trend}</span>
        <small>vs. ayer</small>
        <div className="spark">
          {spark.map((val, idx) => (
            <i key={idx} style={{ height: val }} />
          ))}
        </div>
      </div>
    </Card>
  )
}
