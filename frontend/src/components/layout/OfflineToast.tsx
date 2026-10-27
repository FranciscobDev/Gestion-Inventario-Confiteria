import { Icon } from '../common/Icon'

export function OfflineToast() {
  return (
    <div className="offline-toast">
      <span>
        <Icon name="wifi" />
      </span>
      <div>
        <strong>Estás trabajando sin conexión</strong>
        <small>Los datos se sincronizarán luego.</small>
      </div>
      <button aria-label="Cerrar">
        <Icon name="close" size={17} />
      </button>
    </div>
  )
}
