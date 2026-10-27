import { useState, useMemo } from 'react'
import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'
import { PRODUCTS } from '../../data/mockData'
import type { Product } from '../../types/product'
import { InventoryTable } from './InventoryTable'
import { ProductSlideover } from './ProductSlideover'

const FILTER_OPTIONS = ['Todos', 'Categorías', 'Por agotar', 'Con oferta']

export function Inventory() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [selected, setSelected] = useState<Product | null>(PRODUCTS[0])

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())

      if (!matchQuery) return false

      if (filter === 'Por agotar') return p.stock < 10
      if (filter === 'Con oferta') return p.name.includes('Café')
      return true
    })
  }, [query, filter])

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="title">Inventario</div>
          <div className="subtitle">Administra productos, existencias y vencimientos.</div>
        </div>
        <Button>
          <Icon name="plus" size={18} /> Nuevo producto
        </Button>
      </div>

      <Card>
        <div className="inventory-tools">
          <label className="search">
            <Icon name="search" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, categoría o código..."
            />
          </label>
          <div className="filters">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? 'active' : ''}
              >
                {f}
                {f === 'Categorías' && <Icon name="chevron" size={14} />}
              </button>
            ))}
          </div>
        </div>

        <InventoryTable
          products={filtered}
          selectedProduct={selected}
          onSelectProduct={setSelected}
        />
      </Card>

      {selected && (
        <ProductSlideover
          product={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
