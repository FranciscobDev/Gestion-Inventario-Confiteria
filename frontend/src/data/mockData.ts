import type { Product, ExpiryAlert, StockDepletionAlert, MetricItem } from '../types/product'
import type { NavItem } from '../types/navigation'

export const NAVIGATION_ITEMS: NavItem[] = [
  { id: 'Inicio', label: 'Inicio', icon: 'home' },
  { id: 'Inventario', label: 'Inventario', icon: 'box', badgeCount: 3 },
  { id: 'Registro', label: 'Registro', icon: 'sale' },
  { id: 'Proveedores', label: 'Proveedores', icon: 'truck' },
  { id: 'Reportes', label: 'Reportes', icon: 'chart' },
  { id: 'Configuración', label: 'Configuración', icon: 'settings' },
]

export const PRODUCTS: Product[] = [
  { name: 'Leche entera 1L', category: 'Lácteos', stock: 4, price: '$1.250', expiry: '14 Jun, 2025', state: 'low' },
  { name: 'Café molido 250g', category: 'Despensa', stock: 28, price: '$3.890', expiry: '22 Nov, 2025', state: 'ok' },
  { name: 'Yogur natural', category: 'Lácteos', stock: 0, price: '$890', expiry: 'Hoy', state: 'out' },
  { name: 'Pan integral', category: 'Panadería', stock: 12, price: '$1.490', expiry: '18 Jun, 2025', state: 'ok' },
  { name: 'Jugo de naranja', category: 'Bebidas', stock: 7, price: '$1.990', expiry: '09 Jul, 2025', state: 'low' },
  { name: 'Arroz grado 1', category: 'Despensa', stock: 42, price: '$1.690', expiry: '02 Mar, 2026', state: 'ok' },
]

export const DASHBOARD_METRICS: MetricItem[] = [
  { label: 'Ventas del día', value: '$248.650', trend: '+12,5%', tone: 'green', spark: [18, 28, 24, 40, 35, 54, 64] },
  { label: 'Stock valorizado', value: '$4.860.200', trend: '+3,2%', tone: 'blue', spark: [30, 35, 32, 38, 44, 46, 52] },
  { label: 'Ganancia bruta', value: '$86.430', trend: '+8,4%', tone: 'violet', spark: [20, 18, 32, 28, 45, 44, 58] },
]

export const EXPIRY_ALERTS: ExpiryAlert[] = [
  { name: 'Yogur natural', meta: 'Lote #YN-042 • 8 unidades', badge: 'Vence hoy', danger: true },
  { name: 'Jamón de pavo', meta: 'Lote #JP-118 • 5 unidades', badge: '2 días' },
  { name: 'Queso fresco', meta: 'Lote #QF-091 • 12 unidades', badge: '5 días' },
]

export const STOCK_ALERTS: StockDepletionAlert[] = [
  { name: 'Leche entera 1L', value: '4 / 30', pct: 14, danger: true },
  { name: 'Jugo de naranja', value: '7 / 25', pct: 28 },
  { name: 'Aceite vegetal', value: '9 / 40', pct: 23 },
]

export const WEEKLY_CHART = [42, 62, 48, 76, 58, 89, 68]

export const TOP_PRODUCTS = [
  { name: 'Café molido 250g', category: 'Despensa', sales: 142, toneIndex: 0 },
  { name: 'Leche entera 1L', category: 'Lácteos', sales: 128, toneIndex: 1 },
  { name: 'Pan integral', category: 'Panadería', sales: 97, toneIndex: 2 },
  { name: 'Arroz grado 1', category: 'Despensa', sales: 84, toneIndex: 3 },
  { name: 'Jugo de naranja', category: 'Bebidas', sales: 76, toneIndex: 4 },
]
