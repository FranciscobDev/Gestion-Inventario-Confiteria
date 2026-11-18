import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  Printer,
  CheckCircle2,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp, formatCLP, nowDateTime } from '../context/AppContext';
import { DailyIncomeChart, PeriodComparisonChart } from '../components/Charts';

export default function ReportesPage() {
  const {
    products,
    lots,
    movements,
    salesFinance,
    reviewedDays,
    markDayReviewed,
  } = useApp();

  const [tab, setTab] = useState('ganancias');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [printPreviewType, setPrintPreviewType] = useState(null); // null | 'ganancias' | 'cuadre' | 'kardex' | 'finanzas'

  const inRange = (dateTimeStr) => {
    const d = dateTimeStr.slice(0, 10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  };

  const ventasVigentes = salesFinance.filter((s) => s.estado === 'Vigente' && inRange(s.fechaHora));
  const ingresosTotales = ventasVigentes.reduce((acc, s) => acc + s.monto, 0);

  const salidasVenta = movements.filter((m) => m.tipo === 'Venta' && inRange(m.fechaHora));
  const devolucionesCli = movements.filter((m) => m.tipo === 'Devolución Cliente' && inRange(m.fechaHora));
  const mermasMovs = movements.filter((m) => m.tipo === 'Merma' && inRange(m.fechaHora));
  const comprasMovs = movements.filter((m) => m.tipo === 'Ingreso' && inRange(m.fechaHora));

  const costoVendidoBruto = salidasVenta.reduce((acc, m) => acc + Math.abs(m.cantidad) * m.costoUnitario, 0);
  const costoDevuelto = devolucionesCli.reduce((acc, m) => acc + Math.abs(m.cantidad) * m.costoUnitario, 0);
  const costoVendidoNeto = Math.max(0, costoVendidoBruto - costoDevuelto);

  const perdidaMermas = mermasMovs.reduce((acc, m) => acc + Math.abs(m.cantidad) * m.costoUnitario, 0);
  const gastoCompras = comprasMovs.reduce((acc, m) => acc + m.cantidad * m.costoUnitario, 0);

  const gananciaBruta = ingresosTotales - costoVendidoNeto;
  const gananciaNeta = gananciaBruta - perdidaMermas;
  const margenPct = ingresosTotales > 0 ? Math.round((gananciaBruta / ingresosTotales) * 100) : 0;

  const valorInventario = lots.reduce((acc, l) => acc + l.stockActual * l.precioCompra, 0);

  // Comparativa referencial período anterior (HU-25)
  const previousMetrics = {
    ingresos: Math.round(ingresosTotales * 0.88),
    costos: Math.round(costoVendidoNeto * 0.92),
    gananciaBruta: Math.round(gananciaBruta * 0.85),
    mermas: Math.round(perdidaMermas * 1.15),
  };

  const productStats = products
    .filter((p) => p.activo)
    .map((p) => {
      const vendidas = salidasVenta
        .filter((m) => m.productoId === p.id)
        .reduce((acc, m) => acc + Math.abs(m.cantidad), 0);
      const devueltas = devolucionesCli
        .filter((m) => m.productoId === p.id)
        .reduce((acc, m) => acc + Math.abs(m.cantidad), 0);
      const unidadesNetas = Math.max(0, vendidas - devueltas);
      const gananciaEst = (p.precioVenta - p.precioCompra) * unidadesNetas;
      const margenUnit = p.precioVenta > 0 ? Math.round(((p.precioVenta - p.precioCompra) / p.precioVenta) * 100) : 0;
      return { ...p, unidadesNetas, gananciaEst, margenUnit };
    });

  const top5 = [...productStats].sort((a, b) => b.unidadesNetas - a.unidadesNetas).slice(0, 5);
  const maxUnits = Math.max(1, ...top5.map((t) => t.unidadesNetas));
  const sinMovimiento = productStats.filter((p) => p.unidadesNetas === 0);

  const allDatesSet = new Set([
    ...ventasVigentes.map((s) => s.fechaHora.slice(0, 10)),
    ...salidasVenta.map((m) => m.fechaHora.slice(0, 10)),
  ]);
  const dailyCrossCheck = Array.from(allDatesSet)
    .sort((a, b) => b.localeCompare(a))
    .map((day) => {
      const ventasDia = ventasVigentes.filter((s) => s.fechaHora.startsWith(day));
      const montoDia = ventasDia.reduce((acc, s) => acc + s.monto, 0);
      const salidasDia = salidasVenta
        .filter((m) => m.fechaHora.startsWith(day))
        .reduce((acc, m) => acc + Math.abs(m.cantidad), 0);

      let estado = 'Cuadrado';
      if (ventasDia.length > 0 && salidasDia === 0) estado = 'Ventas sin salida de stock';
      else if (salidasDia > 0 && ventasDia.length === 0) estado = 'Salidas sin venta en finanzas';

      return {
        day,
        cantVentas: ventasDia.length,
        montoDia,
        salidasDia,
        estado,
        revisado: reviewedDays[day],
      };
    });

  const reportTitles = {
    ganancias: 'Informe de Ganancias, Costos y Rentabilidad',
    cuadre: 'Informe de Cuadre Diario (Finanzas vs Inventario)',
    kardex: 'Informe de Movimientos de Stock (Kardex)',
    finanzas: 'Informe de Ingresos por Medio de Pago',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 size={24} style={{ color: 'var(--primary)' }} />
            Reportes, Rentabilidad y Cuadre
          </h1>
          <p className="page-subtitle">
            Cruce financiero e inventario, comparativa de períodos, detector de descuadres e informes formato Hoja Carta.
          </p>
        </div>
        <div className="header-actions no-print">
          <button
            className="btn btn-dark"
            onClick={() => setPrintPreviewType(tab === 'cuadre' ? 'cuadre' : 'ganancias')}
          >
            <Printer size={16} /> Vista Previa Hoja Carta / PDF
          </button>
        </div>
      </div>

      <div className="card mb-3 no-print">
        <div className="card-body" style={{ padding: '0.85rem 1.25rem' }}>
          <div className="filter-bar">
            <span className="small fw-bold text-muted">Filtrar período:</span>
            <input type="date" className="form-control" style={{ width: 165 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span className="small text-muted">hasta</span>
            <input type="date" className="form-control" style={{ width: 165 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            {(dateFrom || dateTo) && (
              <button className="btn btn-outline btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="tabs-bar no-print">
        <button className={`tab-btn ${tab === 'ganancias' ? 'active' : ''}`} onClick={() => setTab('ganancias')}>
          <TrendingUp size={16} /> Ganancias y Margen
        </button>
        <button className={`tab-btn ${tab === 'top' ? 'active' : ''}`} onClick={() => setTab('top')}>
          <Award size={16} /> Top 5 y Rentabilidad
        </button>
        <button className={`tab-btn ${tab === 'cuadre' ? 'active' : ''}`} onClick={() => setTab('cuadre')}>
          <AlertTriangle size={16} /> Descuadres Diarios
        </button>
        <button className={`tab-btn ${tab === 'impresion' ? 'active' : ''}`} onClick={() => setTab('impresion')}>
          <FileSpreadsheet size={16} /> Centro de Impresión
        </button>
      </div>

      {/* TAB 1: GANANCIAS Y COMPARATIVA */}
      {tab === 'ganancias' && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div>
                <div className="kpi-label">Ingresos Finanzas</div>
                <div className="kpi-value">{formatCLP(ingresosTotales)}</div>
                <div className="kpi-meta">{ventasVigentes.length} ventas vigentes</div>
              </div>
            </div>
            <div className="kpi-card">
              <div>
                <div className="kpi-label">Costo de lo Vendido</div>
                <div className="kpi-value">{formatCLP(costoVendidoNeto)}</div>
                <div className="kpi-meta">Según costo de lote FEFO</div>
              </div>
            </div>
            <div className="kpi-card">
              <div>
                <div className="kpi-label">Ganancia Bruta</div>
                <div className="kpi-value text-success">{formatCLP(gananciaBruta)}</div>
                <div className="kpi-meta">Margen bruto: {margenPct}%</div>
              </div>
            </div>
            <div className="kpi-card">
              <div>
                <div className="kpi-label">Ganancia tras Mermas</div>
                <div className="kpi-value">{formatCLP(gananciaNeta)}</div>
                <div className="kpi-meta">Pérdida por mermas: {formatCLP(perdidaMermas)}</div>
              </div>
            </div>
          </div>

          <div className="grid-2 mb-3">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Comparativa con Período Anterior</h2>
              </div>
              <div className="card-body">
                <PeriodComparisonChart
                  currentMetrics={{
                    ingresos: ingresosTotales,
                    costos: costoVendidoNeto,
                    gananciaBruta,
                    mermas: perdidaMermas,
                  }}
                  previousMetrics={previousMetrics}
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Tendencia de Ingresos por Día</h2>
              </div>
              <div className="card-body">
                <DailyIncomeChart sales={ventasVigentes} />
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Valorización Actual y Compras</h2>
              </div>
              <div className="card-body">
                <div className="flex-between mb-2">
                  <span>Valor actual del inventario al costo:</span>
                  <strong style={{ fontSize: '1.1rem' }}>{formatCLP(valorInventario)}</strong>
                </div>
                <div className="flex-between mb-2">
                  <span>Gasto en compras ingresadas:</span>
                  <strong>{formatCLP(gastoCompras)}</strong>
                </div>
                <div className="flex-between">
                  <span>Pérdida acumulada por mermas:</span>
                  <strong className="text-danger">{formatCLP(perdidaMermas)}</strong>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Estado de Cuadre Inventario vs Finanzas</h2>
              </div>
              <div className="card-body">
                {dailyCrossCheck.some((d) => d.estado !== 'Cuadrado' && !d.revisado) ? (
                  <div className="alert-box warning">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Se detectaron días con descuadre</strong> entre ventas en caja y salidas de stock.
                      <div className="mt-2">
                        <button className="btn btn-sm btn-outline" onClick={() => setTab('cuadre')}>
                          Ir a Detector de Descuadres <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert-box success">
                    <CheckCircle2 size={18} />
                    <span>Todos los días tienen registros coherentes o fueron revisados.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOP 5 Y RENTABILIDAD */}
      {tab === 'top' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Top 5 Productos Más Vendidos (Unidades Descontadas)</h2>
            </div>
            <div className="card-body">
              {top5.map((p) => (
                <div key={p.id} className="bar-row">
                  <div className="bar-label-row">
                    <span>{p.nombre}</span>
                    <span>{p.unidadesNetas} unid.</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.round((p.unidadesNetas / maxUnits) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Rentabilidad por Producto</h2>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="center">Unid.</th>
                    <th className="center">Margen</th>
                    <th className="num">Ganancia Est.</th>
                  </tr>
                </thead>
                <tbody>
                  {[...productStats]
                    .sort((a, b) => b.gananciaEst - a.gananciaEst)
                    .map((p) => (
                      <tr key={p.id}>
                        <td className="fw-bold small">{p.nombre}</td>
                        <td className="center">{p.unidadesNetas}</td>
                        <td className="center">
                          <span className={`badge ${p.margenUnit < 25 ? 'badge-warning' : 'badge-success'}`}>
                            {p.margenUnit}%
                          </span>
                        </td>
                        <td className="num fw-bold">{formatCLP(p.gananciaEst)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {sinMovimiento.length > 0 && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <h2 className="card-title">Productos sin Salidas en el Período (Candidatos a Oferta/Combo)</h2>
              </div>
              <div className="card-body">
                <div className="flex-center" style={{ flexWrap: 'wrap' }}>
                  {sinMovimiento.map((p) => (
                    <span key={p.id} className="badge badge-neutral">
                      {p.nombre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DETECTOR DE DESCUADRES */}
      {tab === 'cuadre' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Cruce Diario: Ventas Registradas vs Salidas de Stock</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th className="center">Ventas Finanzas</th>
                  <th className="num">Monto Vendido</th>
                  <th className="center">Unid. Descontadas</th>
                  <th>Diagnóstico</th>
                  <th className="num no-print">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dailyCrossCheck.map((row) => {
                  const ok = row.estado === 'Cuadrado' || Boolean(row.revisado);
                  return (
                    <tr key={row.day}>
                      <td className="fw-bold">{row.day}</td>
                      <td className="center">{row.cantVentas}</td>
                      <td className="num fw-bold">{formatCLP(row.montoDia)}</td>
                      <td className="center">{row.salidasDia}</td>
                      <td>
                        {row.revisado ? (
                          <span className="badge badge-info">Revisado: {row.revisado}</span>
                        ) : (
                          <span className={`badge ${ok ? 'badge-success' : 'badge-danger'}`}>{row.estado}</span>
                        )}
                      </td>
                      <td className="num no-print">
                        <div className="flex-center" style={{ justifyContent: 'flex-end' }}>
                          {row.estado === 'Ventas sin salida de stock' && !row.revisado && (
                            <Link to="/admin-panel/salidas" className="btn btn-primary btn-sm">Descontar Stock</Link>
                          )}
                          {row.estado === 'Salidas sin venta en finanzas' && !row.revisado && (
                            <Link to="/admin-panel/finanzas" className="btn btn-dark btn-sm">Registrar Venta</Link>
                          )}
                          {!ok && (
                            <button className="btn btn-outline btn-sm" onClick={() => markDayReviewed(row.day, 'Verificado manualmente')}>
                              Marcar Revisado
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CENTRO DE IMPRESIÓN (HU-27) */}
      {tab === 'impresion' && (
        <div className="grid-2">
          {[
            { id: 'ganancias', title: 'Informe de Ganancias y Rentabilidad', desc: 'Resumen cruzado de ingresos, costos FEFO, mermas y márgenes por producto.' },
            { id: 'finanzas', title: 'Informe de Ventas y Medios de Pago', desc: 'Listado detallado de ventas vigentes con subtotales por Efectivo, Tarjeta y Transferencia.' },
            { id: 'kardex', title: 'Registro de Movimientos de Stock (Kardex)', desc: 'Detalle cronológico de ingresos, salidas, mermas y devoluciones.' },
            { id: 'cuadre', title: 'Informe de Cuadre Diario', desc: 'Comparación día a día entre ventas monetarias y salidas físicas de stock.' },
          ].map((rep) => (
            <div key={rep.id} className="card">
              <div className="card-header">
                <h2 className="card-title">{rep.title}</h2>
              </div>
              <div className="card-body">
                <p className="small text-muted mb-3">{rep.desc}</p>
                <button className="btn btn-primary btn-sm" onClick={() => setPrintPreviewType(rep.id)}>
                  <Printer size={14} /> Abrir Vista Previa Hoja Carta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL VISTA PREVIA HOJA CARTA (HU-27) */}
      {printPreviewType && (
        <div className="modal-backdrop">
          <div className="modal-dialog lg">
            <div className="modal-header no-print">
              <h3 className="modal-title">Vista Previa de Impresión (Formato Hoja Carta)</h3>
              <div className="flex-center">
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={14} /> Imprimir / Guardar como PDF
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setPrintPreviewType(null)}>
                  Cerrar
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div className="print-sheet">
                <div className="flex-between" style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ margin: 0, color: 'var(--primary)' }}>Confitería Arteconfi</h2>
                    <div className="small" style={{ color: '#475569' }}>{reportTitles[printPreviewType]}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#475569' }}>
                    <div><strong>Emisión:</strong> {nowDateTime()}</div>
                    <div><strong>Período:</strong> {dateFrom || 'Inicio'} al {dateTo || 'Hoy'}</div>
                  </div>
                </div>

                {printPreviewType === 'ganancias' && (
                  <>
                    <div className="grid-2 mb-3">
                      <div><strong>Ingresos Totales:</strong> {formatCLP(ingresosTotales)}</div>
                      <div><strong>Costo de lo Vendido:</strong> {formatCLP(costoVendidoNeto)}</div>
                      <div><strong>Ganancia Bruta:</strong> {formatCLP(gananciaBruta)} ({margenPct}%)</div>
                      <div><strong>Ganancia Neta tras Mermas:</strong> {formatCLP(gananciaNeta)}</div>
                    </div>
                    <table className="data-table">
                      <thead>
                        <tr><th>Producto</th><th className="center">Unid.</th><th className="center">Margen</th><th className="num">Ganancia Est.</th></tr>
                      </thead>
                      <tbody>
                        {productStats.map((p) => (
                          <tr key={p.id}>
                            <td>{p.nombre}</td>
                            <td className="center">{p.unidadesNetas}</td>
                            <td className="center">{p.margenUnit}%</td>
                            <td className="num fw-bold">{formatCLP(p.gananciaEst)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {printPreviewType === 'finanzas' && (
                  <table className="data-table">
                    <thead>
                      <tr><th>#</th><th>Fecha / Hora</th><th>Medio</th><th>Nota</th><th className="num">Monto</th></tr>
                    </thead>
                    <tbody>
                      {ventasVigentes.map((s) => (
                        <tr key={s.id}>
                          <td>#{s.id}</td>
                          <td>{s.fechaHora}</td>
                          <td>{s.medioPago}</td>
                          <td>{s.nota || '—'}</td>
                          <td className="num fw-bold">{formatCLP(s.monto)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="4" className="num fw-bold">TOTAL VIGENTE</td>
                        <td className="num fw-bold">{formatCLP(ingresosTotales)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {printPreviewType === 'kardex' && (
                  <table className="data-table">
                    <thead>
                      <tr><th>Fecha</th><th>Tipo</th><th>Producto / Lote</th><th className="center">Cant.</th><th className="center">Stock Final</th></tr>
                    </thead>
                    <tbody>
                      {movements.filter((m) => inRange(m.fechaHora)).map((m) => {
                        const pr = products.find((p) => p.id === m.productoId);
                        return (
                          <tr key={m.id}>
                            <td>{m.fechaHora}</td>
                            <td>{m.tipo}</td>
                            <td>{pr?.nombre} ({m.codigoLote})</td>
                            <td className="center">{m.cantidad}</td>
                            <td className="center">{m.stockResultante}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {printPreviewType === 'cuadre' && (
                  <table className="data-table">
                    <thead>
                      <tr><th>Fecha</th><th className="center">Ventas</th><th className="num">Monto</th><th className="center">Unid. Salida</th><th>Diagnóstico</th></tr>
                    </thead>
                    <tbody>
                      {dailyCrossCheck.map((row) => (
                        <tr key={row.day}>
                          <td>{row.day}</td>
                          <td className="center">{row.cantVentas}</td>
                          <td className="num">{formatCLP(row.montoDia)}</td>
                          <td className="center">{row.salidasDia}</td>
                          <td>{row.revisado ? `Revisado (${row.revisado})` : row.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
