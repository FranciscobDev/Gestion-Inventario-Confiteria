import { Icon } from '../common/Icon'
import { NAVIGATION_ITEMS } from '../../data/mockData'
import type { PageId } from '../../types/navigation'

interface SidebarProps {
  page: PageId
  setPage: (page: PageId) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

export function Sidebar({ page, setPage, collapsed, setCollapsed }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <span>
          <Icon name="box" size={21} />
        </span>
        {!collapsed && <strong>Nexo</strong>}
        <button onClick={() => setCollapsed(!collapsed)} aria-label="Colapsar menú">
          <Icon name="menu" size={18} />
        </button>
      </div>

      <nav>
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            className={page === item.id ? 'active' : ''}
            onClick={() => setPage(item.id)}
          >
            <Icon name={item.icon} />
            {!collapsed && <span>{item.label}</span>}
            {item.badgeCount && !collapsed && <i>{item.badgeCount}</i>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-help">
          <span>
            <Icon name="wifi" size={17} />
          </span>
          <strong>Todo sincronizado</strong>
          <small>Última vez: ahora</small>
        </div>
      )}

      <div className="profile">
        <span>MR</span>
        {!collapsed && (
          <div>
            <strong>Mariana Rojas</strong>
            <small>Almacén La Esquina</small>
          </div>
        )}
      </div>
    </aside>
  )
}
