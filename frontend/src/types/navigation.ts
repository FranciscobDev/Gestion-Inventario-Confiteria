import type { IconName } from './icons'

export type PageId =
  | 'Inicio'
  | 'Inventario'
  | 'Registro'
  | 'Proveedores'
  | 'Reportes'
  | 'Configuración'

export interface NavItem {
  id: PageId
  label: string
  icon: IconName
  badgeCount?: number
}
