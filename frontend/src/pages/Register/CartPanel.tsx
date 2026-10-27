import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'

interface CartPanelProps {
  mode: 'sale' | 'stock'
}

export function CartPanel({ mode }: CartPanelProps) {
  return (
    <Card className="scan-panel">
      <div className="section-title">
        {mode === 'sale' ? 'Productos de la venta' : 'Descuento de stock'}
      </div>

      <label className="search large">
        <Icon name="search" />
        <input placeholder="Escanear código o buscar producto..." />
        <kbd>F2</kbd>
      </label>

      <div className="cart-item">
        <span className="product-avatar">
          <Icon name="package" size={18} />
        </span>
        <div className="grow">
          <strong>Leche entera 1L</strong>
          <small>$1.250 · Stock: 4</small>
        </div>
        <div className="stepper">
          <button>−</button>
          <span>2</span>
          <button>+</button>
        </div>
        <strong>$2.500</strong>
      </div>

      <div className="cart-item">
        <span className="product-avatar a1">
          <Icon name="package" size={18} />
        </span>
        <div className="grow">
          <strong>Café molido 250g</strong>
          <small>$3.890 · Stock: 28</small>
        </div>
        <div className="stepper">
          <button>−</button>
          <span>1</span>
          <button>+</button>
        </div>
        <strong>$3.890</strong>
      </div>

      <div className="cart-spacer">
        <div className="scan-hint">
          <Icon name="box" size={28} />
          <span>Agrega más productos con el buscador</span>
        </div>
      </div>

      <div className="cart-total">
        <span>Total · 3 productos</span>
        <strong>{mode === 'sale' ? '$6.390' : '—'}</strong>
      </div>

      {mode === 'stock' && (
        <Button className="full">Descontar de inventario (FEFO)</Button>
      )}
    </Card>
  )
}
