# Datos Iniciales de Prueba — Arteconfi (PostgreSQL)



```sql
-- ============================================================================
-- ARTECONFI - Carga Inicial de Datos (PostgreSQL)
-- ============================================================================

ROLLBACK;
BEGIN;

-- ----------------------------------------------------------------------------
-- 1. USUARIOS Y CONFIGURACIÓN DEL NEGOCIO
-- ----------------------------------------------------------------------------

INSERT INTO usuarios_user (
    id, password, last_login, is_superuser, username,
    first_name, last_name, email, is_staff, is_active, date_joined
) VALUES (
    1,
    'pbkdf2_sha256$1500000$CG84jO0zXxmFRN3Jiu8T00$ELszjO9xI9o6FfdJ/1lAcYNMSOANW0xIfNfxRREhRho=',
    NULL,
    TRUE,
    'admin',
    'Dueño',
    'Arteconfi',
    'admin@arteconfi.cl',
    TRUE,
    TRUE,
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO configuracion_negocio (
    id, amber_days, red_days, inactivity_minutes,
    codigo_recuperacion, failed_attempts, locked_until
) VALUES (
    1, 30, 15, 15, 'ARTE-9482-CONF', 0, NULL
) ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. CATEGORÍAS Y PROVEEDORES
-- ----------------------------------------------------------------------------

INSERT INTO categorias (id_categoria, nombre_categoria, descripcion) VALUES
    (1, 'Chocolates', 'Barras, bombones y coberturas'),
    (2, 'Caramelos y Gomitas', 'Dulces masticables, gomitas y calugas'),
    (3, 'Galletas y Alfajores', 'Biscuits, obleas y alfajores artesanales'),
    (4, 'Snacks Salados', 'Papas fritas, frutos secos y ramitas'),
    (5, 'Insumos Repostería', 'Mostacillas, esencias y coberturas por kilo')
ON CONFLICT DO NOTHING;

INSERT INTO proveedores (
    id_proveedor, nombre_empresa, rut, contacto_nombre,
    telefono, email, dias_entrega, direccion, activo
) VALUES
    (1, 'Distribuidora DulceSur Ltda.', '76.432.190-5', 'Claudia Morales', '+56 9 8234 5511', 'ventas@dulcesur.cl', 'Lunes y Jueves', 'Av. Los Conquistadores 412, Santiago', TRUE),
    (2, 'Chocolatería Cordillera S.A.', '96.811.204-K', 'Matías Rojas', '+56 9 7120 3389', 'pedidos@cordillerachoc.cl', 'Martes y Viernes', 'Camino El Alba 1180, Maipú', TRUE),
    (3, 'Confites Mayoristas Central', '77.120.890-2', 'Sergio Paredes', '+56 9 9455 1102', 'sergio@confitescentral.cl', 'Miércoles', 'San Pablo 2450, Santiago', TRUE)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. PRODUCTOS, RELACIÓN PROVEEDORES E HISTORIAL DE PRECIOS
-- ----------------------------------------------------------------------------

INSERT INTO productos (
    id_producto, codigo_barras, nombre, descripcion,
    id_categoria, id_proveedor, precio_compra, precio_venta,
    stock_actual, stock_minimo, stock_objetivo, unidad_medida,
    fecha_vencimiento, perecible, activo, imagen
) VALUES
    (1, '7801620001123', 'Bombones Surtidos Caja 250g', 'Caja surtida chocolate leche y bitter con relleno praliné', 1, 2, 3200.00, 5490.00, 24, 10, 30, 'Unidad', NULL, TRUE, TRUE, NULL),
    (2, '7801620002245', 'Gomitas Ositos Frutales 1kg', 'Bolsa a granel de gomitas surtidas sabor fruta', 2, 3, 2400.00, 4200.00, 15, 8, 25, 'Kilos', NULL, TRUE, TRUE, NULL),
    (3, '7801620003389', 'Alfajor Artesanal Manjar Nuez', 'Alfajor bañado en chocolate semi amargo relleno con manjar', 3, 1, 650.00, 1200.00, 16, 15, 50, 'Unidad', NULL, TRUE, TRUE, NULL),
    (4, '7801620004490', 'Mix Frutos Secos Salados 500g', 'Maní, almendras y pasas tostadas con sal marina', 4, 3, 2800.00, 4600.00, 7, 12, 30, 'Unidad', NULL, TRUE, TRUE, NULL),
    (5, '7801620005511', 'Cobertura Chocolate Blanco 1kg', 'Tableta de cobertura para baño de repostería', 5, 2, 4500.00, 6990.00, 4, 6, 20, 'Kilos', NULL, TRUE, TRUE, NULL),
    (6, '7801620006602', 'Calugas de Leche Tradicionales (Bolsa 30u)', 'Calugas blandas artesanales envueltas individualmente', 2, 1, 1500.00, 2800.00, 22, 10, 30, 'Unidad', NULL, TRUE, TRUE, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO productos_proveedores (producto_id, proveedor_id) VALUES
    (1, 2), (1, 1),
    (2, 3), (2, 1),
    (3, 1),
    (4, 3),
    (5, 2),
    (6, 1), (6, 3)
ON CONFLICT DO NOTHING;

INSERT INTO historial_precios (id, producto_id, fecha, precio_compra, precio_venta, motivo) VALUES
    (1, 1, CURRENT_DATE - INTERVAL '45 days', 3000.00, 4990.00, 'Registro inicial'),
    (2, 1, CURRENT_DATE - INTERVAL '12 days', 3200.00, 5490.00, 'Alza de cacao proveedor'),
    (3, 2, CURRENT_DATE - INTERVAL '30 days', 2400.00, 4200.00, 'Registro inicial'),
    (4, 3, CURRENT_DATE - INTERVAL '25 days', 650.00, 1200.00, 'Registro inicial'),
    (5, 4, CURRENT_DATE - INTERVAL '20 days', 2800.00, 4600.00, 'Registro inicial'),
    (6, 5, CURRENT_DATE - INTERVAL '60 days', 4500.00, 6990.00, 'Registro inicial'),
    (7, 6, CURRENT_DATE - INTERVAL '15 days', 1500.00, 2800.00, 'Registro inicial')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. LOTES (FEFO, ALERTAS ÁMBAR, ROJAS Y VENCIDO)
-- ----------------------------------------------------------------------------

INSERT INTO lotes (id, producto_id, codigo_lote, fecha_vencimiento, precio_compra, stock_actual, precio_oferta) VALUES
    (101, 1, 'L-BOM-01', CURRENT_DATE + INTERVAL '11 days', 3000.00, 6, NULL),
    (102, 1, 'L-BOM-02', CURRENT_DATE + INTERVAL '65 days', 3200.00, 18, NULL),
    (103, 2, 'L-GOM-08', CURRENT_DATE + INTERVAL '24 days', 2400.00, 5, 3500.00),
    (104, 2, 'L-GOM-09', CURRENT_DATE + INTERVAL '120 days', 2400.00, 10, NULL),
    (105, 3, 'L-ALF-14', CURRENT_DATE - INTERVAL '2 days', 650.00, 4, NULL),
    (106, 3, 'L-ALF-15', CURRENT_DATE + INTERVAL '9 days', 650.00, 12, NULL),
    (107, 4, 'L-MIX-03', CURRENT_DATE + INTERVAL '48 days', 2800.00, 7, NULL),
    (108, 5, 'L-COB-05', CURRENT_DATE + INTERVAL '22 days', 4500.00, 4, NULL),
    (109, 6, 'L-CAL-11', CURRENT_DATE + INTERVAL '90 days', 1500.00, 22, NULL)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. COMBOS PROMOCIONALES
-- ----------------------------------------------------------------------------

INSERT INTO combos (id, nombre, precio_especial, fecha_inicio, fecha_fin, activo) VALUES
    (1, 'Pack Dulce Regalo', 7990.00, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', TRUE),
    (2, 'Combo Tarde de Picoteo', 7800.00, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '15 days', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO combo_items (id, combo_id, producto_id, cantidad) VALUES
    (1, 1, 1, 1),
    (2, 1, 3, 2),
    (3, 1, 6, 1),
    (4, 2, 2, 1),
    (5, 2, 4, 1)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. ENCARGOS Y RESERVAS
-- ----------------------------------------------------------------------------

INSERT INTO encargos (
    id, cliente_nombre, cliente_telefono, fecha_entrega,
    hora_entrega, estado, notas, creado_en
) VALUES
    (1, 'María José Fuentes', '+56 9 6543 2109', CURRENT_DATE, '17:30', 'En preparación', 'Caja regalo cumpleaños infantil', NOW() - INTERVAL '2 days'),
    (2, 'Colegio San Gabriel (Centro Padres)', '+56 9 8812 3400', CURRENT_DATE - INTERVAL '1 day', '12:00', 'Pendiente', 'Bolsitas para convivencia', NOW() - INTERVAL '3 days'),
    (3, 'Javier Contreras', '+56 9 7701 9981', CURRENT_DATE + INTERVAL '3 days', '15:00', 'Pendiente', 'Mesa dulce bautizo', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO detalle_encargos (id, encargo_id, producto_id, cantidad) VALUES
    (1, 1, 1, 2),
    (2, 1, 3, 6),
    (3, 2, 6, 4),
    (4, 3, 2, 2),
    (5, 3, 5, 1)
ON CONFLICT DO NOTHING;

INSERT INTO historial_encargos (id, encargo_id, fecha, estado, motivo) VALUES
    (1, 1, NOW() - INTERVAL '2 days', 'Pendiente', 'Encargo agendado y stock reservado'),
    (2, 1, NOW() - INTERVAL '2 hours', 'En preparación', 'Armado de cajas iniciado'),
    (3, 2, NOW() - INTERVAL '3 days', 'Pendiente', 'Encargo agendado y stock reservado'),
    (4, 3, NOW(), 'Pendiente', 'Encargo agendado y stock reservado')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. MOVIMIENTOS DE INVENTARIO (KARDEX)
-- ----------------------------------------------------------------------------

INSERT INTO movimientos_inventario (
    id, fecha_hora, tipo, producto_id, lote_id,
    codigo_lote, cantidad, stock_resultante, costo_unitario, motivo
) VALUES
    (1001, NOW() - INTERVAL '2 days', 'Ingreso', 1, 102, 'L-BOM-02', 20, 26, 3200.00, 'Recepción orden de compra Chocolatería Cordillera'),
    (1002, NOW() - INTERVAL '1 day', 'Venta', 1, 101, 'L-BOM-01', -2, 24, 3000.00, 'Salida por venta mostrador (FEFO)'),
    (1003, NOW() - INTERVAL '1 day', 'Venta', 3, 106, 'L-ALF-15', -4, 16, 650.00, 'Salida por venta mostrador (FEFO)'),
    (1004, NOW() - INTERVAL '1 hour', 'Merma', 4, 107, 'L-MIX-03', -1, 7, 2800.00, 'Dañado — Envase rasgado en bodega')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. FINANZAS Y CAJA
-- ----------------------------------------------------------------------------

INSERT INTO ventas_finanzas (
    id, fecha_hora, monto, medio_pago, nota,
    estado, motivo_anulacion, fecha_anulacion
) VALUES
    (501, NOW() - INTERVAL '1 day', 10980, 'Efectivo', '2 cajas bombones', 'Vigente', NULL, NULL),
    (502, NOW() - INTERVAL '1 day', 4800, 'Tarjeta', '4 alfajores', 'Vigente', NULL, NULL),
    (503, NOW() - INTERVAL '2 hours', 8400, 'Transferencia', 'Venta directa mostrador', 'Vigente', NULL, NULL),
    (504, NOW() - INTERVAL '1 hour', 5490, 'Efectivo', 'Error de digitación inicial', 'Anulada', 'Error de registro — Monto duplicado', NOW() - INTERVAL '50 minutes')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 9. ÓRDENES DE COMPRA, DEVOLUCIONES A PROVEEDOR Y RESPALDOS
-- ----------------------------------------------------------------------------

INSERT INTO ordenes_compra (id, fecha, proveedor_id, estado) VALUES
    (1, CURRENT_DATE - INTERVAL '1 day', 3, 'Enviada')
ON CONFLICT DO NOTHING;

INSERT INTO detalle_ordenes_compra (id, orden_id, producto_id, cantidad, costo_estimado) VALUES
    (1, 1, 4, 23, 2800.00)
ON CONFLICT DO NOTHING;

INSERT INTO devoluciones_proveedor (
    id, fecha, proveedor_id, producto_id, lote_id,
    codigo_lote, cantidad, motivo, detalle, estado
) VALUES
    (1, CURRENT_DATE - INTERVAL '3 days', 1, 3, NULL, 'L-ALF-12', 5, 'Dañado', 'Cajas aplastadas en transporte', 'Reembolsada')
ON CONFLICT DO NOTHING;

INSERT INTO registros_respaldo (
    id, fecha_hora, tipo, destino, tamano, cifrado, integridad, archivo_ruta
) VALUES
    (1, NOW() - INTERVAL '4 hours', 'Automático Diario', 'Local + Nube', '1.4 MB', TRUE, 'Verificado', 'respaldo_auto.json'),
    (2, NOW() - INTERVAL '1 day', 'Al cerrar app', 'Local + Nube', '1.38 MB', TRUE, 'Verificado', 'respaldo_cierre.json')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 10. SINCRONIZACIÓN DE SECUENCIAS EN POSTGRESQL
-- ----------------------------------------------------------------------------

SELECT setval(pg_get_serial_sequence('usuarios_user', 'id'), COALESCE((SELECT MAX(id) FROM usuarios_user), 1));
SELECT setval(pg_get_serial_sequence('configuracion_negocio', 'id'), COALESCE((SELECT MAX(id) FROM configuracion_negocio), 1));
SELECT setval(pg_get_serial_sequence('categorias', 'id_categoria'), COALESCE((SELECT MAX(id_categoria) FROM categorias), 1));
SELECT setval(pg_get_serial_sequence('proveedores', 'id_proveedor'), COALESCE((SELECT MAX(id_proveedor) FROM proveedores), 1));
SELECT setval(pg_get_serial_sequence('productos', 'id_producto'), COALESCE((SELECT MAX(id_producto) FROM productos), 1));
SELECT setval(pg_get_serial_sequence('historial_precios', 'id'), COALESCE((SELECT MAX(id) FROM historial_precios), 1));
SELECT setval(pg_get_serial_sequence('lotes', 'id'), COALESCE((SELECT MAX(id) FROM lotes), 1));
SELECT setval(pg_get_serial_sequence('combos', 'id'), COALESCE((SELECT MAX(id) FROM combos), 1));
SELECT setval(pg_get_serial_sequence('combo_items', 'id'), COALESCE((SELECT MAX(id) FROM combo_items), 1));
SELECT setval(pg_get_serial_sequence('encargos', 'id'), COALESCE((SELECT MAX(id) FROM encargos), 1));
SELECT setval(pg_get_serial_sequence('detalle_encargos', 'id'), COALESCE((SELECT MAX(id) FROM detalle_encargos), 1));
SELECT setval(pg_get_serial_sequence('historial_encargos', 'id'), COALESCE((SELECT MAX(id) FROM historial_encargos), 1));
SELECT setval(pg_get_serial_sequence('movimientos_inventario', 'id'), COALESCE((SELECT MAX(id) FROM movimientos_inventario), 1));
SELECT setval(pg_get_serial_sequence('ventas_finanzas', 'id'), COALESCE((SELECT MAX(id) FROM ventas_finanzas), 1));
SELECT setval(pg_get_serial_sequence('ordenes_compra', 'id'), COALESCE((SELECT MAX(id) FROM ordenes_compra), 1));
SELECT setval(pg_get_serial_sequence('detalle_ordenes_compra', 'id'), COALESCE((SELECT MAX(id) FROM detalle_ordenes_compra), 1));
SELECT setval(pg_get_serial_sequence('devoluciones_proveedor', 'id'), COALESCE((SELECT MAX(id) FROM devoluciones_proveedor), 1));
SELECT setval(pg_get_serial_sequence('registros_respaldo', 'id'), COALESCE((SELECT MAX(id) FROM registros_respaldo), 1));

COMMIT;
```
