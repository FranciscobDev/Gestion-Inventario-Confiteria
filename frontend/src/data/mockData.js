// Utilidades de fechas relativas para datos de demostración
const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const todayStr = () => new Date().toISOString().split('T')[0];

export const INITIAL_CATEGORIES = [
  { id: 1, nombre: 'Chocolates', descripcion: 'Barras, bombones y coberturas' },
  { id: 2, nombre: 'Caramelos y Gomitas', descripcion: 'Dulces masticables, gomitas y masticables' },
  { id: 3, nombre: 'Galletas y Alfajores', descripcion: 'Biscuits, obleas y alfajores artesanales' },
  { id: 4, nombre: 'Snacks Salados', descripcion: 'Papas fritas, frutos secos y ramitas' },
  { id: 5, nombre: 'Insumos Repostería', descripcion: 'Mostacillas, esencias y coberturas por kilo' },
];

export const INITIAL_PROVIDERS = [
  {
    id: 1,
    nombre: 'Distribuidora DulceSur Ltda.',
    rut: '76.432.190-5',
    contacto: 'Claudia Morales',
    telefono: '+56 9 8234 5511',
    email: 'ventas@dulcesur.cl',
    diasEntrega: 'Lunes y Jueves',
    direccion: 'Av. Los Conquistadores 412, Santiago',
    activo: true,
  },
  {
    id: 2,
    nombre: 'Chocolatería Cordillera S.A.',
    rut: '96.811.204-K',
    contacto: 'Matías Rojas',
    telefono: '+56 9 7120 3389',
    email: 'pedidos@cordillerachoc.cl',
    diasEntrega: 'Martes y Viernes',
    direccion: 'Camino El Alba 1180, Maipú',
    activo: true,
  },
  {
    id: 3,
    nombre: 'Confites Mayoristas Central',
    rut: '77.120.890-2',
    contacto: 'Sergio Paredes',
    telefono: '+56 9 9455 1102',
    email: 'sergio@confitescentral.cl',
    diasEntrega: 'Miércoles',
    direccion: 'San Pablo 2450, Santiago',
    activo: true,
  },
];

export const INITIAL_PRODUCTS = [
  {
    id: 1,
    codigoBarras: '7801620001123',
    nombre: 'Bombones Surtidos Caja 250g',
    descripcion: 'Caja surtida chocolate leche y bitter con relleno praliné',
    categoriaId: 1,
    proveedorPrincipalId: 2,
    proveedoresIds: [2, 1],
    precioCompra: 3200,
    precioVenta: 5490,
    stockMinimo: 10,
    stockObjetivo: 30,
    unidadMedida: 'Unidad',
    perecible: true,
    activo: true,
    historialPrecios: [
      { fecha: addDays(-45), precioCompra: 3000, precioVenta: 4990, motivo: 'Registro inicial' },
      { fecha: addDays(-12), precioCompra: 3200, precioVenta: 5490, motivo: 'Alza de cacao proveedor' },
    ],
  },
  {
    id: 2,
    codigoBarras: '7801620002245',
    nombre: 'Gomitas Ositos Frutales 1kg',
    descripcion: 'Bolsa a granel de gomitas surtidas sabor fruta',
    categoriaId: 2,
    proveedorPrincipalId: 3,
    proveedoresIds: [3, 1],
    precioCompra: 2400,
    precioVenta: 4200,
    stockMinimo: 8,
    stockObjetivo: 25,
    unidadMedida: 'Kilos',
    perecible: true,
    activo: true,
    historialPrecios: [
      { fecha: addDays(-30), precioCompra: 2400, precioVenta: 4200, motivo: 'Registro inicial' },
    ],
  },
  {
    id: 3,
    codigoBarras: '7801620003389',
    nombre: 'Alfajor Artesanal Manjar Nuez',
    descripcion: 'Alfajor bañado en chocolate semi amargo relleno con manjar',
    categoriaId: 3,
    proveedorPrincipalId: 1,
    proveedoresIds: [1],
    precioCompra: 650,
    precioVenta: 1200,
    stockMinimo: 15,
    stockObjetivo: 50,
    unidadMedida: 'Unidad',
    perecible: true,
    activo: true,
    historialPrecios: [
      { fecha: addDays(-25), precioCompra: 650, precioVenta: 1200, motivo: 'Registro inicial' },
    ],
  },
  {
    id: 4,
    codigoBarras: '7801620004490',
    nombre: 'Mix Frutos Secos Salados 500g',
    descripcion: 'Maní, almendras y pasas tostadas con sal marina',
    categoriaId: 4,
    proveedorPrincipalId: 3,
    proveedoresIds: [3],
    precioCompra: 2800,
    precioVenta: 4600,
    stockMinimo: 12,
    stockObjetivo: 30,
    unidadMedida: 'Unidad',
    perecible: true,
    activo: true,
    historialPrecios: [
      { fecha: addDays(-20), precioCompra: 2800, precioVenta: 4600, motivo: 'Registro inicial' },
    ],
  },
  {
    id: 5,
    codigoBarras: '7801620005511',
    nombre: 'Cobertura Chocolate Blanco 1kg',
    descripcion: 'Tableta de cobertura para baño de repostería',
    categoriaId: 5,
    proveedorPrincipalId: 2,
    proveedoresIds: [2],
    precioCompra: 4500,
    precioVenta: 6990,
    stockMinimo: 6,
    stockObjetivo: 20,
    unidadMedida: 'Kilos',
    perecible: true,
    activo: true,
    historialPrecios: [
      { fecha: addDays(-60), precioCompra: 4500, precioVenta: 6990, motivo: 'Registro inicial' },
    ],
  },
  {
    id: 6,
    codigoBarras: '7801620006602',
    nombre: 'Calugas de Leche Tradicionales (Bolsa 30u)',
    descripcion: 'Calugas blandas artesanales envueltas individualmente',
    categoriaId: 2,
    proveedorPrincipalId: 1,
    proveedoresIds: [1, 3],
    precioCompra: 1500,
    precioVenta: 2800,
    stockMinimo: 10,
    stockObjetivo: 30,
    unidadMedida: 'Unidad',
    perecible: true,
    activo: true,
    historialPrecios: [
      { fecha: addDays(-15), precioCompra: 1500, precioVenta: 2800, motivo: 'Registro inicial' },
    ],
  },
];

// Lotes para demostrar FEFO, alertas Ámbar (<=30d), Rojo (<=15d) y Vencido (<0d)
export const INITIAL_LOTS = [
  { id: 101, productoId: 1, codigoLote: 'L-BOM-01', fechaVencimiento: addDays(11), precioCompra: 3000, stockActual: 6, precioOferta: null },
  { id: 102, productoId: 1, codigoLote: 'L-BOM-02', fechaVencimiento: addDays(65), precioCompra: 3200, stockActual: 18, precioOferta: null },
  { id: 103, productoId: 2, codigoLote: 'L-GOM-08', fechaVencimiento: addDays(24), precioCompra: 2400, stockActual: 5, precioOferta: 3500 },
  { id: 104, productoId: 2, codigoLote: 'L-GOM-09', fechaVencimiento: addDays(120), precioCompra: 2400, stockActual: 10, precioOferta: null },
  { id: 105, productoId: 3, codigoLote: 'L-ALF-14', fechaVencimiento: addDays(-2), precioCompra: 650, stockActual: 4, precioOferta: null },
  { id: 106, productoId: 3, codigoLote: 'L-ALF-15', fechaVencimiento: addDays(9), precioCompra: 650, stockActual: 12, precioOferta: null },
  { id: 107, productoId: 4, codigoLote: 'L-MIX-03', fechaVencimiento: addDays(48), precioCompra: 2800, stockActual: 7, precioOferta: null },
  { id: 108, productoId: 5, codigoLote: 'L-COB-05', fechaVencimiento: addDays(22), precioCompra: 4500, stockActual: 4, precioOferta: null },
  { id: 109, productoId: 6, codigoLote: 'L-CAL-11', fechaVencimiento: addDays(90), precioCompra: 1500, stockActual: 22, precioOferta: null },
];

export const INITIAL_COMBOS = [
  {
    id: 1,
    nombre: 'Pack Dulce Regalo',
    precioEspecial: 7990,
    fechaInicio: addDays(-5),
    fechaFin: addDays(25),
    activo: true,
    componentes: [
      { productoId: 1, cantidad: 1 },
      { productoId: 3, cantidad: 2 },
      { productoId: 6, cantidad: 1 },
    ],
  },
  {
    id: 2,
    nombre: 'Combo Tarde de Picoteo',
    precioEspecial: 7800,
    fechaInicio: addDays(-10),
    fechaFin: addDays(15),
    activo: true,
    componentes: [
      { productoId: 2, cantidad: 1 },
      { productoId: 4, cantidad: 1 },
    ],
  },
];

export const INITIAL_ORDERS = [
  {
    id: 1,
    clienteNombre: 'María José Fuentes',
    clienteTelefono: '+56 9 6543 2109',
    fechaEntrega: todayStr(),
    horaEntrega: '17:30',
    estado: 'En preparación',
    notas: 'Caja regalo cumpleaños infantil',
    items: [
      { productoId: 1, cantidad: 2 },
      { productoId: 3, cantidad: 6 },
    ],
    historial: [
      { fecha: addDays(-2) + ' 10:15', estado: 'Pendiente', motivo: 'Encargo agendado' },
      { fecha: todayStr() + ' 09:00', estado: 'En preparación', motivo: 'Armado de cajas iniciado' },
    ],
  },
  {
    id: 2,
    clienteNombre: 'Colegio San Gabriel (Centro Padres)',
    clienteTelefono: '+56 9 8812 3400',
    fechaEntrega: addDays(-1),
    horaEntrega: '12:00',
    estado: 'Pendiente',
    notas: 'Bolsitas para convivencia',
    items: [
      { productoId: 6, cantidad: 4 },
    ],
    historial: [
      { fecha: addDays(-3) + ' 16:40', estado: 'Pendiente', motivo: 'Encargo agendado' },
    ],
  },
  {
    id: 3,
    clienteNombre: 'Javier Contreras',
    clienteTelefono: '+56 9 7701 9981',
    fechaEntrega: addDays(3),
    horaEntrega: '15:00',
    estado: 'Pendiente',
    notas: 'Mesa dulce bautizo',
    items: [
      { productoId: 2, cantidad: 2 },
      { productoId: 5, cantidad: 1 },
    ],
    historial: [
      { fecha: todayStr() + ' 11:20', estado: 'Pendiente', motivo: 'Encargo agendado' },
    ],
  },
];

export const INITIAL_MOVEMENTS = [
  {
    id: 1001,
    fechaHora: addDays(-2) + ' 09:30',
    tipo: 'Ingreso',
    productoId: 1,
    loteId: 102,
    codigoLote: 'L-BOM-02',
    cantidad: 20,
    stockResultante: 26,
    costoUnitario: 3200,
    motivo: 'Recepción orden de compra Chocolatería Cordillera',
  },
  {
    id: 1002,
    fechaHora: addDays(-1) + ' 16:15',
    tipo: 'Venta',
    productoId: 1,
    loteId: 101,
    codigoLote: 'L-BOM-01',
    cantidad: -2,
    stockResultante: 24,
    costoUnitario: 3000,
    motivo: 'Salida por venta mostrador (FEFO)',
  },
  {
    id: 1003,
    fechaHora: addDays(-1) + ' 18:40',
    tipo: 'Venta',
    productoId: 3,
    loteId: 106,
    codigoLote: 'L-ALF-15',
    cantidad: -4,
    stockResultante: 16,
    costoUnitario: 650,
    motivo: 'Salida por venta mostrador (FEFO)',
  },
  {
    id: 1004,
    fechaHora: todayStr() + ' 10:05',
    tipo: 'Merma',
    productoId: 4,
    loteId: 107,
    codigoLote: 'L-MIX-03',
    cantidad: -1,
    stockResultante: 7,
    costoUnitario: 2800,
    motivo: 'Dañado — Envase rasgado en bodega',
  },
];

export const INITIAL_SALES_FINANCE = [
  {
    id: 501,
    fechaHora: addDays(-1) + ' 16:18',
    monto: 10980,
    medioPago: 'Efectivo',
    nota: '2 cajas bombones',
    estado: 'Vigente',
    motivoAnulacion: null,
    correcciones: [],
  },
  {
    id: 502,
    fechaHora: addDays(-1) + ' 18:45',
    monto: 4800,
    medioPago: 'Tarjeta',
    nota: '4 alfajores',
    estado: 'Vigente',
    motivoAnulacion: null,
    correcciones: [],
  },
  {
    id: 503,
    fechaHora: todayStr() + ' 11:10',
    monto: 8400,
    medioPago: 'Transferencia',
    nota: 'Venta directa mostrador (sin registrar salida aún)',
    estado: 'Vigente',
    motivoAnulacion: null,
    correcciones: [],
  },
  {
    id: 504,
    fechaHora: todayStr() + ' 12:30',
    monto: 5490,
    medioPago: 'Efectivo',
    nota: 'Error de digitación inicial',
    estado: 'Anulada',
    motivoAnulacion: 'Error de registro — Monto duplicado',
    correcciones: [],
  },
];

export const INITIAL_SUPPLIER_RETURNS = [
  {
    id: 1,
    fecha: addDays(-3),
    proveedorId: 1,
    productoId: 3,
    codigoLote: 'L-ALF-12',
    cantidad: 5,
    motivo: 'Dañado',
    detalle: 'Cajas aplastadas en transporte',
    estado: 'Reembolsada',
  },
];

export const INITIAL_PURCHASE_ORDERS = [
  {
    id: 1,
    fecha: addDays(-1),
    proveedorId: 3,
    estado: 'Enviada',
    items: [
      { productoId: 4, cantidad: 23, costoEstimado: 2800 },
    ],
  },
];

export const INITIAL_BACKUPS = [
  {
    id: 'bkp-01',
    fechaHora: todayStr() + ' 08:00',
    tipo: 'Automático Diario',
    destino: 'Local + Nube',
    tamano: '1.4 MB',
    cifrado: true,
    integridad: 'Verificado',
  },
  {
    id: 'bkp-02',
    fechaHora: addDays(-1) + ' 21:15',
    tipo: 'Al cerrar app',
    destino: 'Local + Nube',
    tamano: '1.38 MB',
    cifrado: true,
    integridad: 'Verificado',
  },
  {
    id: 'bkp-03',
    fechaHora: addDays(-7) + ' 20:00',
    tipo: 'Semanal',
    destino: 'Local',
    tamano: '1.21 MB',
    cifrado: true,
    integridad: 'Verificado',
  },
];
