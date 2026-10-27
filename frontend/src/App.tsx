import { useMemo, useState, type ReactNode } from 'react'

type IconName =
  | 'home' | 'box' | 'sale' | 'truck' | 'chart' | 'settings' | 'bell' | 'search'
  | 'plus' | 'more' | 'chevron' | 'menu' | 'arrow' | 'wifi' | 'close' | 'package'

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-7h6v7"/></>,
    box: <><path d="m21 8-9 5-9-5"/><path d="m3 8 9-5 9 5v8l-9 5-9-5Z"/><path d="M12 13v8"/></>,
    sale: <><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/></>,
    truck: <><path d="M10 17h4V5H2v12h3"/><path d="M14 9h4l4 4v4h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></>,
    chart: <><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    wifi: <><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    package: <><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

const products = [
  { name: 'Leche entera 1L', category: 'Lácteos', stock: 4, price: '$1.250', expiry: '14 Jun, 2025', state: 'low' },
  { name: 'Café molido 250g', category: 'Despensa', stock: 28, price: '$3.890', expiry: '22 Nov, 2025', state: 'ok' },
  { name: 'Yogur natural', category: 'Lácteos', stock: 0, price: '$890', expiry: 'Hoy', state: 'out' },
  { name: 'Pan integral', category: 'Panadería', stock: 12, price: '$1.490', expiry: '18 Jun, 2025', state: 'ok' },
  { name: 'Jugo de naranja', category: 'Bebidas', stock: 7, price: '$1.990', expiry: '09 Jul, 2025', state: 'low' },
  { name: 'Arroz grado 1', category: 'Despensa', stock: 42, price: '$1.690', expiry: '02 Mar, 2026', state: 'ok' },
]

function Dashboard({ openOrder }: { openOrder: () => void }) {
  const chart = [42, 62, 48, 76, 58, 89, 68]
  return <div className="page">
    <div className="page-heading"><div><div className="eyebrow">Lunes, 16 de junio</div><div className="title">Buenos días, Mariana</div><div className="subtitle">Aquí tienes el resumen de tu negocio.</div></div><Button onClick={openOrder}><Icon name="plus" size={18}/> Orden a proveedor</Button></div>
    <div className="metrics">
      <Metric label="Ventas del día" value="$248.650" trend="+12,5%" tone="green" spark={[18,28,24,40,35,54,64]} />
      <Metric label="Stock valorizado" value="$4.860.200" trend="+3,2%" tone="blue" spark={[30,35,32,38,44,46,52]} />
      <Metric label="Ganancia bruta" value="$86.430" trend="+8,4%" tone="violet" spark={[20,18,32,28,45,44,58]} />
    </div>
    <div className="dashboard-grid">
      <Card className="alerts-card">
        <div className="card-title-row"><div><div className="section-title">Alertas de inventario</div><div className="section-subtitle">Requieren tu atención</div></div><span className="alert-count">5 pendientes</span></div>
        <div className="alert-columns">
          <div><div className="mini-title">Lotes próximos a vencer</div>
            <AlertRow name="Yogur natural" meta="Lote #YN-042 • 8 unidades" badge="Vence hoy" danger />
            <AlertRow name="Jamón de pavo" meta="Lote #JP-118 • 5 unidades" badge="2 días" />
            <AlertRow name="Queso fresco" meta="Lote #QF-091 • 12 unidades" badge="5 días" />
          </div>
          <div><div className="mini-title">Productos por agotar</div>
            <StockAlert name="Leche entera 1L" value="4 / 30" pct={14} danger />
            <StockAlert name="Jugo de naranja" value="7 / 25" pct={28} />
            <StockAlert name="Aceite vegetal" value="9 / 40" pct={23} />
          </div>
        </div>
      </Card>
      <Card className="chart-card">
        <div className="card-title-row"><div><div className="section-title">Ventas últimos 7 días</div><div className="big-inline">$1.284.300 <span>+9,8%</span></div></div><button className="icon-button" aria-label="Más opciones"><Icon name="more"/></button></div>
        <div className="bar-chart">{chart.map((n,i)=><div className="bar-wrap" key={i}><div className="bar" style={{height:`${n}%`}}/><span>{['L','M','M','J','V','S','D'][i]}</span></div>)}</div>
      </Card>
    </div>
    <Card>
      <div className="card-title-row"><div><div className="section-title">Productos más vendidos</div><div className="section-subtitle">Este mes</div></div><Button variant="ghost">Ver reporte <Icon name="arrow" size={17}/></Button></div>
      <div className="top-list">
        {['Café molido 250g','Leche entera 1L','Pan integral','Arroz grado 1','Jugo de naranja'].map((p,i)=><div className="top-row" key={p}><span className="rank">{i+1}</span><span className={`product-icon tone-${i}`}><Icon name="package" size={18}/></span><div className="grow"><strong>{p}</strong><small>{['Despensa','Lácteos','Panadería','Despensa','Bebidas'][i]}</small></div><strong>{[142,128,97,84,76][i]} <small>unid.</small></strong><div className="mini-bar"><i style={{width:`${100-i*13}%`}}/></div></div>)}
      </div>
    </Card>
  </div>
}

function Metric({label,value,trend,tone,spark}:{label:string;value:string;trend:string;tone:string;spark:number[]}) {
  return <Card className="metric"><div className={`metric-icon ${tone}`}><Icon name={tone==='green'?'sale':tone==='blue'?'box':'chart'}/></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-foot"><span>↗ {trend}</span><small>vs. ayer</small><div className="spark">{spark.map((v,i)=><i key={i} style={{height:v}}/>)}</div></div></Card>
}
function AlertRow({name,meta,badge,danger=false}:{name:string;meta:string;badge:string;danger?:boolean}) {
  return <div className="alert-row"><div className={`alert-dot ${danger?'danger':''}`}/><div className="grow"><strong>{name}</strong><small>{meta}</small></div><span className={`badge ${danger?'badge-danger':'badge-warn'}`}>{badge}</span></div>
}
function StockAlert({name,value,pct,danger=false}:{name:string;value:string;pct:number;danger?:boolean}) {
  return <div className="stock-alert"><div className="stock-line"><strong>{name}</strong><span>{value}</span></div><div className="progress"><i className={danger?'danger':''} style={{width:`${pct}%`}}/></div></div>
}

function Inventory() {
  const [query,setQuery] = useState('')
  const [filter,setFilter] = useState('Todos')
  const [selected,setSelected] = useState<(typeof products)[0] | null>(products[0])
  const filtered = useMemo(()=>products.filter(p=>(p.name.toLowerCase().includes(query.toLowerCase())) && (filter==='Todos'||filter==='Por agotar'&&p.stock<10||filter==='Con oferta'&&p.name.includes('Café'))),[query,filter])
  return <div className="page">
    <div className="page-heading"><div><div className="title">Inventario</div><div className="subtitle">Administra productos, existencias y vencimientos.</div></div><Button><Icon name="plus" size={18}/> Nuevo producto</Button></div>
    <Card>
      <div className="inventory-tools"><label className="search"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nombre, categoría o código..."/></label><div className="filters">{['Todos','Categorías','Por agotar','Con oferta'].map(f=><button key={f} onClick={()=>setFilter(f)} className={filter===f?'active':''}>{f}{f==='Categorías'&&<Icon name="chevron" size={14}/>}</button>)}</div></div>
      <div className="table-wrap"><table><thead><tr><th>Producto / Categoría</th><th>Stock disponible</th><th>Precio de venta</th><th>Vencimiento próximo</th><th></th></tr></thead><tbody>
        {filtered.map((p,i)=><tr key={p.name} className={selected?.name===p.name?'selected':''} onClick={()=>setSelected(p)}><td><div className="product-cell"><span className={`product-avatar a${i}`}><Icon name="package" size={18}/></span><div><strong>{p.name}</strong><small>{p.category} · SKU 00{318+i}</small></div></div></td><td><span className={`stock-dot ${p.state}`}/><strong>{p.stock}</strong> unidades {p.state!=='ok'&&<span className={`badge ${p.state==='out'?'badge-danger':'badge-warn'}`}>{p.state==='out'?'Agotado':'Stock bajo'}</span>}</td><td><strong>{p.price}</strong></td><td className={p.expiry==='Hoy'?'danger-text':''}>{p.expiry}</td><td><button className="icon-button" aria-label="Acciones"><Icon name="more"/></button></td></tr>)}
      </tbody></table>{filtered.length===0&&<div className="empty"><Icon name="search" size={30}/><strong>Sin resultados</strong><span>Prueba con otro término o filtro.</span></div>}</div>
    </Card>
    {selected&&<aside className="slideover"><div className="slide-head"><div><small>Detalle del producto</small><div className="section-title">{selected.name}</div></div><button className="icon-button" onClick={()=>setSelected(null)} aria-label="Cerrar"><Icon name="close"/></button></div><div className="slide-summary"><span className="product-avatar big"><Icon name="package" size={28}/></span><div><small>Stock disponible</small><strong>{selected.stock} unidades</strong></div><div><small>Precio de venta</small><strong>{selected.price}</strong></div></div><div className="tabs"><button className="active">Lotes</button><button>Historial de precios</button><button>Combos</button></div><div className="lot"><div><strong>Lote #LE-2406</strong><small>Ingreso 02 Jun, 2025</small></div><div><strong>4 unid.</strong><small className="warn-text">Vence en 8 días</small></div></div><div className="lot"><div><strong>Lote #LE-1805</strong><small>Ingreso 18 May, 2025</small></div><div><strong>12 unid.</strong><small>Vence en 32 días</small></div></div><Button variant="secondary" className="full"><Icon name="plus" size={17}/> Añadir nuevo lote</Button></aside>}
  </div>
}

function Register() {
  const [mode,setMode]=useState<'sale'|'stock'>('sale')
  const [amount,setAmount]=useState('24.850')
  return <div className="page"><div className="page-heading"><div><div className="title">Registro rápido</div><div className="subtitle">Registra ventas o ajusta el inventario en segundos.</div></div></div>
    <div className="mode-tabs"><button className={mode==='sale'?'active':''} onClick={()=>setMode('sale')}>Registrar venta</button><button className={mode==='stock'?'active':''} onClick={()=>setMode('stock')}>Descontar stock</button></div>
    <div className="register-grid">
      <Card className="scan-panel"><div className="section-title">{mode==='sale'?'Productos de la venta':'Descuento de stock'}</div><label className="search large"><Icon name="search"/><input placeholder="Escanear código o buscar producto..."/><kbd>F2</kbd></label><div className="cart-item"><span className="product-avatar"><Icon name="package" size={18}/></span><div className="grow"><strong>Leche entera 1L</strong><small>$1.250 · Stock: 4</small></div><div className="stepper"><button>−</button><span>2</span><button>+</button></div><strong>$2.500</strong></div><div className="cart-item"><span className="product-avatar a1"><Icon name="package" size={18}/></span><div className="grow"><strong>Café molido 250g</strong><small>$3.890 · Stock: 28</small></div><div className="stepper"><button>−</button><span>1</span><button>+</button></div><strong>$3.890</strong></div><div className="cart-spacer"><div className="scan-hint"><Icon name="box" size={28}/><span>Agrega más productos con el buscador</span></div></div><div className="cart-total"><span>Total · 3 productos</span><strong>${mode==='sale'?'6.390':'—'}</strong></div>{mode==='stock'&&<Button className="full">Descontar de inventario (FEFO)</Button>}</Card>
      <Card className="payment-panel"><div className="section-title">Ingreso recibido</div><div className="amount"><span>$</span><input value={amount} onChange={e=>setAmount(e.target.value)}/></div><div className="keypad">{['1','2','3','4','5','6','7','8','9','00','0','⌫'].map(k=><button key={k} onClick={()=>k==='⌫'?setAmount(amount.slice(0,-1)):setAmount(amount+k)}>{k}</button>)}</div><div className="mini-title">Medio de pago</div><div className="payments"><button className="active">Efectivo</button><button>Tarjeta</button><button>Transferencia</button></div><Button className="full register-button">Registrar venta <Icon name="arrow" size={18}/></Button></Card>
    </div>
  </div>
}

function OrderModal({close}:{close:()=>void}) {
  return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="slide-head"><div><div className="section-title">Nueva orden a proveedor</div><div className="section-subtitle">Sugerencias basadas en tu stock objetivo.</div></div><button className="icon-button" onClick={close}><Icon name="close"/></button></div><label className="field"><span>Proveedor</span><select><option>Distribuidora Central</option><option>Mercado Mayorista Sur</option></select></label><div className="suggested-title"><span>Productos sugeridos</span><span>Stock actual → objetivo</span></div>{[['Leche entera 1L','4 → 30','26'],['Jugo de naranja','7 → 25','18'],['Aceite vegetal','9 → 40','31']].map(x=><div className="suggestion" key={x[0]}><input type="checkbox" defaultChecked/><div className="grow"><strong>{x[0]}</strong><small>{x[1]} unidades</small></div><label><span>Cantidad</span><input defaultValue={x[2]}/></label></div>)}<div className="modal-actions"><Button variant="secondary" onClick={close}>Cancelar</Button><Button onClick={close}>Crear orden · 75 unidades</Button></div></div></div>
}

export default function App() {
  const [page,setPage]=useState('Inicio')
  const [collapsed,setCollapsed]=useState(false)
  const [modal,setModal]=useState(false)
  const nav:[string,IconName][]=[['Inicio','home'],['Inventario','box'],['Registro','sale'],['Proveedores','truck'],['Reportes','chart'],['Configuración','settings']]
  return <div className="app-shell">
    <aside className={`sidebar ${collapsed?'collapsed':''}`}><div className="brand"><span><Icon name="box" size={21}/></span>{!collapsed&&<strong>Nexo</strong>}<button onClick={()=>setCollapsed(!collapsed)} aria-label="Colapsar menú"><Icon name="menu" size={18}/></button></div><nav>{nav.map(([label,icon])=><button key={label} className={page===label?'active':''} onClick={()=>setPage(label)}><Icon name={icon}/>{!collapsed&&<span>{label}</span>}{label==='Inventario'&&!collapsed&&<i>3</i>}</button>)}</nav>{!collapsed&&<div className="sidebar-help"><span><Icon name="wifi" size={17}/></span><strong>Todo sincronizado</strong><small>Última vez: ahora</small></div>}<div className="profile"><span>MR</span>{!collapsed&&<div><strong>Mariana Rojas</strong><small>Almacén La Esquina</small></div>}</div></aside>
    <main className="main"><header><div className="mobile-brand"><Icon name="box"/><strong>Nexo</strong></div><div className="connection"><i/><span>En línea</span></div><button className="icon-button notification"><Icon name="bell"/><i/></button><div className="avatar">MR</div></header>{page==='Inventario'?<Inventory/>:page==='Registro'?<Register/>:<Dashboard openOrder={()=>setModal(true)}/>}</main>
    <div className="offline-toast"><span><Icon name="wifi"/></span><div><strong>Estás trabajando sin conexión</strong><small>Los datos se sincronizarán luego.</small></div><button aria-label="Cerrar"><Icon name="close" size={17}/></button></div>
    {modal&&<OrderModal close={()=>setModal(false)}/>}
  </div>
}
