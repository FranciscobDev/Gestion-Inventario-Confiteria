import { Icon } from '../common/Icon'

export function Header() {
  return (
    <header>
      <div className="mobile-brand">
        <Icon name="box" />
        <strong>Nexo</strong>
      </div>
      <div className="connection">
        <i />
        <span>En línea</span>
      </div>
      <button className="icon-button notification" aria-label="Notificaciones">
        <Icon name="bell" />
        <i />
      </button>
      <div className="avatar">MR</div>
    </header>
  )
}
