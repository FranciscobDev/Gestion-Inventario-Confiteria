import { Icon } from '../../components/common/Icon'
import type { Product } from '../../types/product'

interface InventoryTableProps {
  products: Product[]
  selectedProduct: Product | null
  onSelectProduct: (product: Product) => void
}

export function InventoryTable({
  products,
  selectedProduct,
  onSelectProduct,
}: InventoryTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Producto / Categoría</th>
            <th>Stock disponible</th>
            <th>Precio de venta</th>
            <th>Vencimiento próximo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr
              key={p.name}
              className={selectedProduct?.name === p.name ? 'selected' : ''}
              onClick={() => onSelectProduct(p)}
            >
              <td>
                <div className="product-cell">
                  <span className={`product-avatar a${i % 5}`}>
                    <Icon name="package" size={18} />
                  </span>
                  <div>
                    <strong>{p.name}</strong>
                    <small>
                      {p.category} · SKU 00{318 + i}
                    </small>
                  </div>
                </div>
              </td>
              <td>
                <span className={`stock-dot ${p.state}`} />
                <strong>{p.stock}</strong> unidades{' '}
                {p.state !== 'ok' && (
                  <span className={`badge ${p.state === 'out' ? 'badge-danger' : 'badge-warn'}`}>
                    {p.state === 'out' ? 'Agotado' : 'Stock bajo'}
                  </span>
                )}
              </td>
              <td>
                <strong>{p.price}</strong>
              </td>
              <td className={p.expiry === 'Hoy' ? 'danger-text' : ''}>{p.expiry}</td>
              <td>
                <button
                  className="icon-button"
                  aria-label="Acciones"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon name="more" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 && (
        <div className="empty">
          <Icon name="search" size={30} />
          <strong>Sin resultados</strong>
          <span>Prueba con otro término o filtro.</span>
        </div>
      )}
    </div>
  )
}
