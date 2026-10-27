import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'

export function Settings() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="title">Configuración</div>
          <div className="subtitle">
            Ajustes generales del local, alertas y preferencias.
          </div>
        </div>
        <Button>Guardar cambios</Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card>
          <div className="section-title">Datos del Negocio</div>
          <div className="section-subtitle">Información que aparece en boletas y reportes.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <label className="field">
              <span>Nombre comercial</span>
              <input defaultValue="Almacén La Esquina" className="search" style={{ height: '40px', padding: '0 12px' }} />
            </label>
            <label className="field">
              <span>RUT o Identificador Fiscal</span>
              <input defaultValue="76.543.210-K" className="search" style={{ height: '40px', padding: '0 12px' }} />
            </label>
            <label className="field">
              <span>Encargado / Administrador</span>
              <input defaultValue="Mariana Rojas" className="search" style={{ height: '40px', padding: '0 12px' }} />
            </label>
          </div>
        </Card>

        <Card>
          <div className="section-title">Parámetros de Inventario</div>
          <div className="section-subtitle">Configuración del método de rotación y alertas de caducidad.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <label className="field">
              <span>Método de despacho</span>
              <select defaultValue="FEFO">
                <option value="FEFO">FEFO (Primero en expirar, primero en salir)</option>
                <option value="FIFO">FIFO (Primero en entrar, primero en salir)</option>
              </select>
            </label>
            <label className="field">
              <span>Anticipación de alertas de vencimiento</span>
              <select defaultValue="7">
                <option value="3">3 días antes</option>
                <option value="7">7 días antes</option>
                <option value="15">15 días antes</option>
              </select>
            </label>
          </div>
        </Card>
      </div>
    </div>
  )
}
