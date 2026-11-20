const TOKEN_KEY = 'arteconfi_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // noop
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getStoredToken();
  if (auth && token) {
    headers.Authorization = `Token ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || 'Error de comunicación con el servidor.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// --- Mappers Backend (snake_case) -> Frontend (camelCase) ---
const fmtDt = (iso) => (iso ? iso.replace('T', ' ').slice(0, 16) : '');

export const mapOrder = (o) => ({
  id: o.id,
  clienteNombre: o.cliente_nombre,
  clienteTelefono: o.cliente_telefono,
  fechaEntrega: o.fecha_entrega,
  horaEntrega: o.hora_entrega,
  creadoEn: o.creado_en ? fmtDt(o.creado_en) : (o.hora_entrega ? `${o.fecha_entrega} ${o.hora_entrega}` : null),
  estado: o.estado,
  notas: o.notas || '',
  origen: o.origen,
  clienteId: o.cliente_id ?? null,
  items: (o.items || []).map((it) => ({
    productoId: it.producto,
    cantidad: it.cantidad,
  })),
  historial: (o.historial || []).map((h) => ({
    fecha: fmtDt(h.fecha),
    estado: h.estado,
    motivo: h.motivo,
  })),
});

export function mapBootstrapData(raw) {
  return {
    configAlerts: {
      amberDays: raw.config?.amber_days ?? 30,
      redDays: raw.config?.red_days ?? 15,
    },
    inactivityMinutes: raw.config?.inactivity_minutes ?? 15,
    recoveryCode: raw.config?.codigo_recuperacion || 'ARTE-9482-CONF',
    categories: (raw.categories || []).map((c) => ({
      id: c.id_categoria,
      nombre: c.nombre_categoria,
      descripcion: c.descripcion || '',
    })),
    providers: (raw.providers || []).map((p) => ({
      id: p.id_proveedor,
      nombre: p.nombre_empresa,
      rut: p.rut || '',
      contacto: p.contacto_nombre || '',
      telefono: p.telefono || '',
      email: p.email || '',
      diasEntrega: p.dias_entrega || '',
      direccion: p.direccion || '',
      activo: p.activo,
    })),
    products: (raw.products || []).map((p) => ({
      id: p.id_producto,
      codigoBarras: p.codigo_barras || '',
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      categoriaId: p.categoria,
      proveedorPrincipalId: p.proveedor,
      proveedoresIds: p.proveedores || [],
      precioCompra: Number(p.precio_compra),
      precioVenta: Number(p.precio_venta),
      stockMinimo: p.stock_minimo,
      stockObjetivo: p.stock_objetivo,
      unidadMedida: p.unidad_medida,
      perecible: p.perecible,
      activo: p.activo,
      imagen: p.imagen || '',
      historialPrecios: (p.historial_precios || []).map((hp) => ({
        fecha: hp.fecha,
        precioCompra: Number(hp.precio_compra),
        precioVenta: Number(hp.precio_venta),
        motivo: hp.motivo,
      })),
    })),
    lots: (raw.lots || []).map((l) => ({
      id: l.id,
      productoId: l.producto,
      codigoLote: l.codigo_lote,
      fechaVencimiento: l.fecha_vencimiento || '',
      precioCompra: Number(l.precio_compra),
      stockActual: l.stock_actual,
      precioOferta: l.precio_oferta ? Number(l.precio_oferta) : null,
    })),
    combos: (raw.combos || []).map((c) => ({
      id: c.id,
      nombre: c.nombre,
      precioEspecial: Number(c.precio_especial),
      fechaInicio: c.fecha_inicio || '',
      fechaFin: c.fecha_fin || '',
      activo: c.activo,
      componentes: (c.componentes || []).map((it) => ({
        productoId: it.producto,
        cantidad: it.cantidad,
      })),
    })),
    orders: (raw.orders || []).map(mapOrder),
    movements: (raw.movements || []).map((m) => ({
      id: m.id,
      fechaHora: fmtDt(m.fecha_hora),
      tipo: m.tipo,
      productoId: m.producto,
      loteId: m.lote,
      codigoLote: m.codigo_lote,
      cantidad: m.cantidad,
      stockResultante: m.stock_resultante,
      costoUnitario: Number(m.costo_unitario),
      motivo: m.motivo,
    })),
    salesFinance: (raw.sales_finance || []).map((s) => ({
      id: s.id,
      fechaHora: fmtDt(s.fecha_hora),
      monto: Number(s.monto),
      medioPago: s.medio_pago,
      nota: s.nota || '',
      estado: s.estado,
      motivoAnulacion: s.motivo_anulacion,
      correcciones: (s.correcciones || []).map((c) => ({
        fecha: fmtDt(c.fecha),
        anterior: c.anterior,
        nuevo: c.nuevo,
      })),
    })),
    supplierReturns: (raw.supplier_returns || []).map((r) => ({
      id: r.id,
      fecha: r.fecha,
      proveedorId: r.proveedor,
      productoId: r.producto,
      codigoLote: r.codigo_lote,
      cantidad: r.cantidad,
      motivo: r.motivo,
      detalle: r.detalle || '',
      estado: r.estado,
    })),
    purchaseOrders: (raw.purchase_orders || []).map((po) => ({
      id: po.id,
      fecha: po.fecha,
      proveedorId: po.proveedor,
      estado: po.estado,
      items: (po.items || []).map((i) => ({
        productoId: i.producto,
        cantidad: i.cantidad,
        costoEstimado: Number(i.costo_estimado),
      })),
    })),
    reviewedDays: raw.reviewed_days || {},
    backups: raw.backups || [],
  };
}

export const api = {
  health: () => request('/api/health/', { auth: false }),

  // Usuarios & Seguridad
  login: (username, password) =>
    request('/api/usuarios/login/', { method: 'POST', body: { username, password }, auth: false }),
  loginUnified: (identificador, password) =>
    request('/api/usuarios/login-unificado/', { method: 'POST', body: { identificador, password }, auth: false }),
  logout: () => request('/api/usuarios/logout/', { method: 'POST' }),
  authStatus: () => request('/api/usuarios/status/'),
  verifyPassword: (password) =>
    request('/api/usuarios/verificar-password/', { method: 'POST', body: { password } }),
  changePassword: (current_password, new_password) =>
    request('/api/usuarios/cambiar-password/', { method: 'POST', body: { current_password, new_password } }),
  recoverAccess: (code, new_password) =>
    request('/api/usuarios/recuperar-acceso/', { method: 'POST', body: { code, new_password }, auth: false }),
  updateConfig: (payload) =>
    request('/api/usuarios/configuracion/', { method: 'PATCH', body: payload }),

  // Bootstrap & Reportes
  bootstrap: () => request('/api/reportes/bootstrap/'),
  reviewDay: (fecha, nota) =>
    request('/api/reportes/revisar-dia/', { method: 'POST', body: { fecha, nota } }),
  createBackup: (tipo = 'Manual') =>
    request('/api/reportes/respaldos/', { method: 'POST', body: { tipo } }),

  // Inventario
  createCategory: (nombre_categoria, descripcion) =>
    request('/api/inventario/categorias/', { method: 'POST', body: { nombre_categoria, descripcion } }),
  updateCategory: (id, nombre_categoria, descripcion) =>
    request(`/api/inventario/categorias/${id}/`, { method: 'PATCH', body: { nombre_categoria, descripcion } }),

  createProduct: (payload) =>
    request('/api/inventario/productos/', { method: 'POST', body: payload }),
  updateProduct: (id, payload) =>
    request(`/api/inventario/productos/${id}/`, { method: 'PATCH', body: payload }),
  deactivateProduct: (id) =>
    request(`/api/inventario/productos/${id}/desactivar/`, { method: 'POST' }),
  reactivateProduct: (id) =>
    request(`/api/inventario/productos/${id}/reactivar/`, { method: 'POST' }),

  receiveStock: (payload) =>
    request('/api/inventario/ingresos/', { method: 'POST', body: payload }),
  applyLotOffer: (lotId, precio_oferta) =>
    request(`/api/inventario/lotes/${lotId}/aplicar-oferta/`, { method: 'POST', body: { precio_oferta } }),
  registerMerma: (payload) =>
    request('/api/inventario/mermas/', { method: 'POST', body: payload }),
  registerStockSales: (items, fecha_real) =>
    request('/api/inventario/salidas-venta/', { method: 'POST', body: { items, fecha_real } }),
  registerClientReturn: (payload) =>
    request('/api/inventario/devoluciones-cliente/', { method: 'POST', body: payload }),
  createCombo: (payload) =>
    request('/api/inventario/combos/', { method: 'POST', body: payload }),

  // Encargos
  listOrders: () => request('/api/encargos/'),
  createOrder: (payload) =>
    request('/api/encargos/', { method: 'POST', body: payload }),
  updateOrderStatus: (orderId, estado, motivo) =>
    request(`/api/encargos/${orderId}/cambiar-estado/`, { method: 'POST', body: { estado, motivo } }),

  // Finanzas
  createSaleFinance: (payload) =>
    request('/api/finanzas/ventas/', { method: 'POST', body: payload }),
  editSaleFinance: (saleId, payload) =>
    request(`/api/finanzas/ventas/${saleId}/`, { method: 'PATCH', body: payload }),
  annulSaleFinance: (saleId, motivo) =>
    request(`/api/finanzas/ventas/${saleId}/anular/`, { method: 'POST', body: { motivo } }),

  // Compras y Proveedores
  createProvider: (payload) =>
    request('/api/compras/proveedores/', { method: 'POST', body: payload }),
  updateProvider: (id, payload) =>
    request(`/api/compras/proveedores/${id}/`, { method: 'PATCH', body: payload }),
  createPurchaseOrder: (payload) =>
    request('/api/compras/ordenes/', { method: 'POST', body: payload }),
  updatePurchaseOrderStatus: (id, estado) =>
    request(`/api/compras/ordenes/${id}/`, { method: 'PATCH', body: { estado } }),
  receivePurchaseOrder: (id, items) =>
    request(`/api/compras/ordenes/${id}/recibir/`, { method: 'POST', body: { items } }),
  createSupplierReturn: (payload) =>
    request('/api/compras/devoluciones/', { method: 'POST', body: payload }),
};
