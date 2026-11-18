import React from 'react';
import { formatCLP } from '../context/AppContext';

const AVATAR_PALETTE = [
  { bg: '#ccfbf1', fg: '#0f766e' },
  { bg: '#cffafe', fg: '#0e7490' },
  { bg: '#d1fae5', fg: '#047857' },
  { bg: '#e0f2fe', fg: '#0369a1' },
  { bg: '#fef3c7', fg: '#b45309' },
];

export function ProductAvatar({ product }) {
  if (product?.imagen) {
    return <img src={product.imagen} alt={product.nombre} className="prod-thumb" />;
  }
  const idx = (product?.categoriaId || 1) % AVATAR_PALETTE.length;
  const colors = AVATAR_PALETTE[idx];
  const initials = (product?.nombre || 'PR')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <span
      className="prod-avatar"
      style={{ backgroundColor: colors.bg, color: colors.fg, borderColor: 'transparent' }}
    >
      {initials}
    </span>
  );
}

/**
 * Gráfico SVG de Ingresos Diarios por Medio de Pago (HU-31)
 */
export function DailyIncomeChart({ sales }) {
  const map = {};
  sales
    .filter((s) => s.estado === 'Vigente')
    .forEach((s) => {
      const day = s.fechaHora.slice(0, 10);
      if (!map[day]) map[day] = { day, Efectivo: 0, Tarjeta: 0, Transferencia: 0, total: 0 };
      map[day][s.medioPago] = (map[day][s.medioPago] || 0) + s.monto;
      map[day].total += s.monto;
    });

  const rows = Object.values(map).sort((a, b) => a.day.localeCompare(b.day)).slice(-7);
  if (rows.length === 0) {
    return <div className="empty-state">No hay ventas vigentes para graficar en este período.</div>;
  }

  const maxTotal = Math.max(1, ...rows.map((r) => r.total));
  const chartH = 160;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: chartH + 40, paddingTop: 20 }}>
        {rows.map((r) => {
          const hTotal = Math.max(8, Math.round((r.total / maxTotal) * chartH));
          const hEfec = Math.round((r.Efectivo / r.total) * hTotal) || 0;
          const hTarj = Math.round((r.Tarjeta / r.total) * hTotal) || 0;
          const hTrans = Math.max(0, hTotal - hEfec - hTarj);

          return (
            <div
              key={r.day}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
              title={`${r.day}: ${formatCLP(r.total)}`}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {formatCLP(r.total)}
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: 44,
                  height: hTotal,
                  borderRadius: '6px 6px 2px 2px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  border: '1px solid var(--border)',
                }}
              >
                {hEfec > 0 && <div style={{ height: hEfec, background: '#e11d48' }} title={`Efectivo: ${formatCLP(r.Efectivo)}`} />}
                {hTarj > 0 && <div style={{ height: hTarj, background: '#f59e0b' }} title={`Tarjeta: ${formatCLP(r.Tarjeta)}`} />}
                {hTrans > 0 && <div style={{ height: hTrans, background: '#10b981' }} title={`Transferencia: ${formatCLP(r.Transferencia)}`} />}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {r.day.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex-center mt-2" style={{ justifyContent: 'center', fontSize: '0.76rem', gap: '1rem' }}>
        <span className="flex-center"><span style={{ width: 10, height: 10, borderRadius: 2, background: '#e11d48', display: 'inline-block' }} /> Efectivo</span>
        <span className="flex-center"><span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} /> Tarjeta</span>
        <span className="flex-center"><span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} /> Transferencia</span>
      </div>
    </div>
  );
}

/**
 * Comparativa visual Periodo Actual vs Periodo Anterior (HU-25)
 */
export function PeriodComparisonChart({ currentMetrics, previousMetrics }) {
  const items = [
    { label: 'Ingresos', curr: currentMetrics.ingresos, prev: previousMetrics.ingresos, color: '#e11d48' },
    { label: 'Costo Vendido', curr: currentMetrics.costos, prev: previousMetrics.costos, color: '#ea580c' },
    { label: 'Ganancia Bruta', curr: currentMetrics.gananciaBruta, prev: previousMetrics.gananciaBruta, color: '#10b981' },
    { label: 'Mermas', curr: currentMetrics.mermas, prev: previousMetrics.mermas, color: '#ef4444' },
  ];

  const maxVal = Math.max(1, ...items.flatMap((i) => [i.curr, i.prev]));

  return (
    <div>
      {items.map((it) => {
        const wCurr = Math.round((Math.max(0, it.curr) / maxVal) * 100);
        const wPrev = Math.round((Math.max(0, it.prev) / maxVal) * 100);
        const deltaPct = it.prev > 0 ? Math.round(((it.curr - it.prev) / it.prev) * 100) : null;

        return (
          <div key={it.label} style={{ marginBottom: '0.9rem' }}>
            <div className="flex-between small mb-1">
              <strong>{it.label}</strong>
              <span>
                Actual: <strong>{formatCLP(it.curr)}</strong> · Anterior: {formatCLP(it.prev)}{' '}
                {deltaPct !== null && (
                  <span className={deltaPct >= 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 700 }}>
                    ({deltaPct >= 0 ? `+${deltaPct}%` : `${deltaPct}%`})
                  </span>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="bar-track" style={{ height: 8 }}>
                <div className="bar-fill" style={{ width: `${wCurr}%`, background: it.color }} />
              </div>
              <div className="bar-track" style={{ height: 6 }}>
                <div className="bar-fill" style={{ width: `${wPrev}%`, background: '#94a3b8', opacity: 0.65 }} />
              </div>
            </div>
          </div>
        );
      })}
      <div className="small text-muted">Barra superior: Período actual · Barra inferior: Período anterior estimado</div>
    </div>
  );
}
