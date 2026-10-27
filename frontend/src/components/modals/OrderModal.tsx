import { Icon } from '../common/Icon'
import { Button } from '../common/Button'

interface OrderModalProps {
  close: () => void
}

const SUGGESTIONS = [
  { name: 'Leche entera 1L', stockInfo: '4 → 30 unidades', defaultQty: '26' },
  { name: 'Jugo de naranja', stockInfo: '7 → 25 unidades', defaultQty: '18' },
  { name: 'Aceite vegetal', stockInfo: '9 → 40 unidades', defaultQty: '31' },
]

export function OrderModal({ close }: OrderModalProps) {
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="slide-head">
          <div>
            <div className="section-title">Nueva orden a proveedor</div>
            <div className="section-subtitle">Sugerencias basadas en tu stock objetivo.</div>
          </div>
          <button className="icon-button" onClick={close} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>

        <label className="field">
          <span>Proveedor</span>
          <select>
            <option>Distribuidora Central</option>
            <option>Mercado Mayorista Sur</option>
          </select>
        </label>

        <div className="suggested-title">
          <span>Productos sugeridos</span>
          <span>Stock actual → objetivo</span>
        </div>

        {SUGGESTIONS.map((item) => (
          <div className="suggestion" key={item.name}>
            <input type="checkbox" defaultChecked />
            <div className="grow">
              <strong>{item.name}</strong>
              <small>{item.stockInfo}</small>
            </div>
            <label>
              <span>Cantidad</span>
              <input defaultValue={item.defaultQty} />
            </label>
          </div>
        ))}

        <div className="modal-actions">
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={close}>Crear orden · 75 unidades</Button>
        </div>
      </div>
    </div>
  )
}
