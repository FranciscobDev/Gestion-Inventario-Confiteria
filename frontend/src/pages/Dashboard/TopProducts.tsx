import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'
import { TOP_PRODUCTS } from '../../data/mockData'

export function TopProducts() {
  return (
    <Card>
      <div className="card-title-row">
        <div>
          <div className="section-title">Productos más vendidos</div>
          <div className="section-subtitle">Este mes</div>
        </div>
        <Button variant="ghost">
          Ver reporte <Icon name="arrow" size={17} />
        </Button>
      </div>

      <div className="top-list">
        {TOP_PRODUCTS.map((prod, idx) => (
          <div className="top-row" key={prod.name}>
            <span className="rank">{idx + 1}</span>
            <span className={`product-icon tone-${prod.toneIndex}`}>
              <Icon name="package" size={18} />
            </span>
            <div className="grow">
              <strong>{prod.name}</strong>
              <small>{prod.category}</small>
            </div>
            <strong>
              {prod.sales} <small>unid.</small>
            </strong>
            <div className="mini-bar">
              <i style={{ width: `${100 - idx * 13}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
