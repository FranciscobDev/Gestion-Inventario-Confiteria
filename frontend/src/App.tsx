import { useState } from 'react'
import type { PageId } from './types/navigation'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { OfflineToast } from './components/layout/OfflineToast'
import { OrderModal } from './components/modals/OrderModal'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Register } from './pages/Register'
import { Suppliers } from './pages/Suppliers'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'

export default function App() {
  const [page, setPage] = useState<PageId>('Inicio')
  const [collapsed, setCollapsed] = useState(false)
  const [modal, setModal] = useState(false)

  const renderCurrentPage = () => {
    switch (page) {
      case 'Inventario':
        return <Inventory />
      case 'Registro':
        return <Register />
      case 'Proveedores':
        return <Suppliers openOrder={() => setModal(true)} />
      case 'Reportes':
        return <Reports />
      case 'Configuración':
        return <Settings />
      case 'Inicio':
      default:
        return <Dashboard openOrder={() => setModal(true)} />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={setPage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main className="main">
        <Header />
        {renderCurrentPage()}
      </main>

      <OfflineToast />

      {modal && <OrderModal close={() => setModal(false)} />}
    </div>
  )
}
