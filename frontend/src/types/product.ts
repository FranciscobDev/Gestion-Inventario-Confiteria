export type StockState = 'ok' | 'low' | 'out'

export interface Product {
  name: string
  category: string
  stock: number
  price: string
  expiry: string
  state: StockState
}

export interface ProductLot {
  code: string
  entryDate: string
  quantity: number
  expiresIn: string
  isWarning?: boolean
}

export interface ExpiryAlert {
  name: string
  meta: string
  badge: string
  danger?: boolean
}

export interface StockDepletionAlert {
  name: string
  value: string
  pct: number
  danger?: boolean
}

export interface MetricItem {
  label: string
  value: string
  trend: string
  tone: 'green' | 'blue' | 'violet'
  spark: number[]
}
