import { useState } from 'react'
import { CartPanel } from './CartPanel'
import { PaymentPanel } from './PaymentPanel'

export function Register() {
  const [mode, setMode] = useState<'sale' | 'stock'>('sale')

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="title">Registro rápido</div>
          <div className="subtitle">
            Registra ventas o ajusta el inventario en segundos.
          </div>
        </div>
      </div>

      <div className="mode-tabs">
        <button
          className={mode === 'sale' ? 'active' : ''}
          onClick={() => setMode('sale')}
        >
          Registrar venta
        </button>
        <button
          className={mode === 'stock' ? 'active' : ''}
          onClick={() => setMode('stock')}
        >
          Descontar stock
        </button>
      </div>

      <div className="register-grid">
        <CartPanel mode={mode} />
        <PaymentPanel />
      </div>
    </div>
  )
}
