import { Card } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'

interface SuppliersProps {
  openOrder: () => void
}

const SUPPLIERS_LIST = [
  {
    name: 'Distribuidora Central',
    contact: 'contacto@distribuidoracentral.cl',
    phone: '+56 9 8765 4321',
    category: 'Abarrotes & Lácteos',
    leadTime: '24-48 hrs',
    status: 'Activo',
  },
  {
    name: 'Mercado Mayorista Sur',
    contact: 'pedidos@mayoristasur.cl',
    phone: '+56 9 7654 3210',
    category: 'Bebidas & Snacks',
    leadTime: '24 hrs',
    status: 'Activo',
  },
  {
    name: 'Cecinas del Valle',
    contact: 'ventas@cecinasvalle.cl',
    phone: '+56 9 6543 2109',
    category: 'Fiambrería & Cecinas',
    leadTime: '48 hrs',
    status: 'Activo',
  },
]

export function Suppliers({ openOrder }: SuppliersProps) {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="title">Proveedores</div>
          <div className="subtitle">
            Gestiona tus contactos, pedidos y condiciones de entrega.
          </div>
        </div>
        <Button onClick={openOrder}>
          <Icon name="plus" size={18} /> Nueva orden
        </Button>
      </div>

      <Card>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Proveedor / Contacto</th>
                <th>Rubro principal</th>
                <th>Tiempo de entrega</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {SUPPLIERS_LIST.map((s, idx) => (
                <tr key={s.name}>
                  <td>
                    <div className="product-cell">
                      <span className={`product-avatar a${idx + 1}`}>
                        <Icon name="truck" size={18} />
                      </span>
                      <div>
                        <strong>{s.name}</strong>
                        <small>{s.contact} · {s.phone}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{s.category}</strong>
                  </td>
                  <td>{s.leadTime}</td>
                  <td>
                    <span className="badge badge-warn" style={{ color: '#16815f', background: '#e8f5f0' }}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <button className="icon-button" aria-label="Acciones">
                      <Icon name="more" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
