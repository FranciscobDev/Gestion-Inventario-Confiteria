import { useState } from 'react'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'
import type { Product } from '../../types/product'

interface ProductSlideoverProps {
  product: Product
  onClose: () => void
}

export function ProductSlideover({ product, onClose }: ProductSlideoverProps) {
  const [activeTab, setActiveTab] = useState<'lotes' | 'historial' | 'combos'>('lotes')

  return (
    <aside className="slideover">
      <div className="slide-head">
        <div>
          <small>Detalle del producto</small>
          <div className="section-title">{product.name}</div>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar">
          <Icon name="close" />
        </button>
      </div>

      <div className="slide-summary">
        <span className="product-avatar big">
          <Icon name="package" size={28} />
        </span>
        <div>
          <small>Stock disponible</small>
          <strong>{product.stock} unidades</strong>
        </div>
        <div>
          <small>Precio de venta</small>
          <strong>{product.price}</strong>
        </div>
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'lotes' ? 'active' : ''}
          onClick={() => setActiveTab('lotes')}
        >
          Lotes
        </button>
        <button
          className={activeTab === 'historial' ? 'active' : ''}
          onClick={() => setActiveTab('historial')}
        >
          Historial de precios
        </button>
        <button
          className={activeTab === 'combos' ? 'active' : ''}
          onClick={() => setActiveTab('combos')}
        >
          Combos
        </button>
      </div>

      <div className="lot">
        <div>
          <strong>Lote #LE-2406</strong>
          <small>Ingreso 02 Jun, 2025</small>
        </div>
        <div>
          <strong>4 unid.</strong>
          <small className="warn-text">Vence en 8 días</small>
        </div>
      </div>

      <div className="lot">
        <div>
          <strong>Lote #LE-1805</strong>
          <small>Ingreso 18 May, 2025</small>
        </div>
        <div>
          <strong>12 unid.</strong>
          <small>Vence en 32 días</small>
        </div>
      </div>

      <Button variant="secondary" className="full">
        <Icon name="plus" size={17} /> Añadir nuevo lote
      </Button>
    </aside>
  )
}
