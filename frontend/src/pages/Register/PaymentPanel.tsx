import { useState } from 'react'
import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫']
const PAYMENT_METHODS = ['Efectivo', 'Tarjeta', 'Transferencia']

export function PaymentPanel() {
  const [amount, setAmount] = useState('24.850')
  const [selectedPayment, setSelectedPayment] = useState('Efectivo')

  const handleKeyClick = (key: string) => {
    if (key === '⌫') {
      setAmount((prev) => (prev.length > 0 ? prev.slice(0, -1) : ''))
    } else {
      setAmount((prev) => prev + key)
    }
  }

  return (
    <Card className="payment-panel">
      <div className="section-title">Ingreso recibido</div>

      <div className="amount">
        <span>$</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Monto recibido"
        />
      </div>

      <div className="keypad">
        {KEYPAD_KEYS.map((k) => (
          <button key={k} onClick={() => handleKeyClick(k)}>
            {k}
          </button>
        ))}
      </div>

      <div className="mini-title">Medio de pago</div>
      <div className="payments">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method}
            className={selectedPayment === method ? 'active' : ''}
            onClick={() => setSelectedPayment(method)}
          >
            {method}
          </button>
        ))}
      </div>

      <Button className="full register-button">
        Registrar venta <Icon name="arrow" size={18} />
      </Button>
    </Card>
  )
}
