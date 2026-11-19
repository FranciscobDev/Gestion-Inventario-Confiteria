import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  Candy,
  Calendar,
  Clock,
  ShoppingBag,
  Store,
  LogOut,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Plus,
  Trash2,
  User,
  Phone,
  Package,
  Boxes,
  Check,
  CalendarClock,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { clienteApi, setClienteSesion, clearClienteSesion } from './clienteApi';
import { useApp } from '../context/AppContext';
import { validatePasswordStrength } from '../utils/validators';

const ACTIVOS = ['Pendiente', 'En preparación'];
const HISTORIAL = ['Entregado', 'Cancelado'];

function formatCLPLocal(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatFechaElegante(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  const texto = d.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatFechaYHoraCreacion(creadoEn, hora) {
  if (creadoEn) {
    try {
      const d = new Date(creadoEn);
      if (!isNaN(d.getTime())) {
        const fechaStr = d.toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'short',
        });
        const horaStr = d.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        return `${fechaStr} a las ${horaStr} hrs`;
      }
    } catch {
      // fallback
    }
  }
  if (hora) {
    return `a las ${hora} hrs`;
  }
  return 'Registrado en sistema';
}

function getDiasRelativos(fechaIso) {
  if (!fechaIso) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const target = new Date(`${fechaIso}T00:00:00`);
  const diffDays = Math.round((target - hoy) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return { texto: '¡Retiro programado para Hoy!', color: '#e11d48', urgente: true };
  if (diffDays === 1) return { texto: 'Retiro programado para Mañana', color: '#ea580c', urgente: false };
  if (diffDays > 1) return { texto: `Retiro en ${diffDays} días`, color: '#64748b', urgente: false };
  return { texto: 'Fecha pasada', color: '#6b7280', urgente: false };
}

function fechaLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Tarjeta individual de encargo con tracker visual de estado
 */
function EncargoCard({ enc, onCancelar }) {
  const relativo = getDiasRelativos(enc.fecha_entrega);

  const trackerStep = useMemo(() => {
    if (enc.estado === 'Pendiente') return 1;
    if (enc.estado === 'En preparación') return 2;
    if (enc.estado === 'Entregado') return 3;
    return 0; // Cancelado
  }, [enc.estado]);

  const progressPercent = useMemo(() => {
    if (trackerStep === 1) return '15%';
    if (trackerStep === 2) return '55%';
    if (trackerStep === 3) return '100%';
    return '0%';
  }, [trackerStep]);

  return (
    <div className="order-card">
      <div className="order-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: enc.estado === 'En preparación' ? 'rgba(245, 158, 11, 0.15)' : 'var(--primary-soft)',
              color: enc.estado === 'En preparación' ? '#d97706' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarClock size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="small text-muted" style={{ fontWeight: 600 }}>Fecha de Retiro:</span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                {formatFechaElegante(enc.fecha_entrega)}
              </strong>
              {relativo && (
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: relativo.color,
                    background: 'var(--surface)',
                    padding: '0.15rem 0.55rem',
                    borderRadius: 999,
                    border: `1px solid ${relativo.color}40`,
                  }}
                >
                  {relativo.texto}
                </span>
              )}
            </div>
            <div className="small text-muted flex-center" style={{ gap: '0.65rem', marginTop: '0.15rem' }}>
              <span>
                <CalendarClock size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--primary)' }} />
                Solicitado: <strong>{formatFechaYHoraCreacion(enc.creado_en, enc.hora_entrega)}</strong>
              </span>
              <span>·</span>
              <span>Código #{enc.id}</span>
            </div>
          </div>
        </div>

        <div className="flex-center" style={{ gap: '0.65rem' }}>
          {enc.estado === 'Pendiente' && (
            <span className="badge badge-warning" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
              <Clock size={13} /> Pendiente de confirmación
            </span>
          )}
          {enc.estado === 'En preparación' && (
            <span className="badge badge-info" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
              <Boxes size={13} /> En preparación en taller
            </span>
          )}
          {enc.estado === 'Entregado' && (
            <span className="badge badge-success" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
              <CheckCircle2 size={13} /> Entregado / Retirado
            </span>
          )}
          {enc.estado === 'Cancelado' && (
            <span className="badge badge-danger" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
              <X size={13} /> Encargo Cancelado
            </span>
          )}
        </div>
      </div>

      <div className="order-card-body">
        {/* Tracker visual de estado (excepto cancelado) */}
        {enc.estado !== 'Cancelado' ? (
          <div className="order-tracker">
            <div className="order-tracker-line">
              <div className="order-tracker-line-fill" style={{ width: progressPercent }} />
            </div>

            <div className={`order-step ${trackerStep >= 1 ? 'completed' : ''}`}>
              <div className="order-step-node">
                {trackerStep > 1 ? <Check size={16} /> : '1'}
              </div>
              <span className="order-step-title">Encargo Solicitado</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {enc.hora_entrega ? `${enc.hora_entrega} hrs` : 'Registrado'}
              </span>
            </div>

            <div className={`order-step ${trackerStep > 2 ? 'completed' : trackerStep === 2 ? 'current' : ''}`}>
              <div className="order-step-node">
                {trackerStep > 2 ? <Check size={16} /> : trackerStep === 2 ? <Boxes size={15} /> : '2'}
              </div>
              <span className="order-step-title">En Preparación</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Armado de pedido
              </span>
            </div>

            <div className={`order-step ${trackerStep === 3 ? 'completed' : ''}`}>
              <div className="order-step-node">
                {trackerStep === 3 ? <Check size={16} /> : <Store size={15} />}
              </div>
              <span className="order-step-title">Listo para Retiro</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {new Date(`${enc.fecha_entrega}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        ) : (
          <div className="alert-box danger mb-3" style={{ fontSize: '0.84rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>Este encargo fue cancelado y no será preparado ni despachado.</span>
          </div>
        )}

        {/* Resumen de productos del encargo */}
        <div>
          <div className="small text-muted fw-bold mb-2 flex-center" style={{ gap: 5 }}>
            <Package size={14} /> Detalle de productos en el pedido ({enc.items?.length || 0}):
          </div>

          <div className="order-items-grid">
            {enc.items?.map((it, idx) => (
              <div key={idx} className="order-item-chip">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'var(--primary-soft)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {it.producto}
                  </span>
                </div>
                <span
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 999,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    flexShrink: 0,
                  }}
                >
                  × {it.cantidad}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notas del cliente */}
        {enc.notas && (
          <div
            style={{
              background: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '0.7rem 0.95rem',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
              fontSize: '0.83rem',
              color: 'var(--text-muted)',
              marginTop: '0.65rem',
            }}
          >
            <FileText size={15} style={{ flexShrink: 0, marginTop: 2, color: 'var(--primary)' }} />
            <div>
              <strong style={{ color: 'var(--text-main)' }}>Notas o indicaciones:</strong> {enc.notas}
            </div>
          </div>
        )}

        {/* Historial de estados del pedido */}
        {Array.isArray(enc.historial) && enc.historial.length > 0 && (
          <div style={{ marginTop: '0.85rem' }}>
            <div className="small text-muted fw-bold mb-2 flex-center" style={{ gap: 5 }}>
              <Clock size={14} /> Historial de estados:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {enc.historial.map((h, idx) => (
                <div
                  key={idx}
                  className="small"
                  style={{
                    borderLeft: '2px solid var(--border)',
                    paddingLeft: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <strong style={{ color: 'var(--text-main)' }}>{h.estado}</strong>
                  <span className="text-muted">· {formatFechaYHoraCreacion(h.fecha)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pie con opciones y estado */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            marginTop: '1.15rem',
            paddingTop: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div className="small text-muted">
            {enc.estado === 'En preparación' ? (
              <span className="text-info fw-bold">
                ✓ Pedido en elaboración. Si necesitas cambiar la hora de retiro, contáctanos al local.
              </span>
            ) : enc.estado === 'Pendiente' ? (
              <span>Puedes cancelar este encargo mientras esté en estado pendiente.</span>
            ) : (
              <span>Pedido completado en nuestros registros.</span>
            )}
          </div>

          {enc.estado === 'Pendiente' && (
            <button
              type="button"
              className="btn btn-outline btn-sm text-danger"
              style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}
              onClick={() => onCancelar(enc)}
            >
              <Trash2 size={13} /> Cancelar este encargo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard Principal de Encargos del Cliente (/cliente)
 */
export function ClientePanelPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, notify } = useApp();

  const [cliente, setCliente] = useState(null);
  const [encargos, setEncargos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState(location.state?.mensaje || '');
  const [filterTab, setFilterTab] = useState('activos'); // 'activos' | 'preparacion' | 'pendientes' | 'historial'

  const cerrarSesion = () => {
    clearClienteSesion();
    navigate('/login', { replace: true });
  };

  const manejarError = (err) => {
    if (err.status === 401 || err.status === 403) {
      cerrarSesion();
      return;
    }
    setError(err.message || 'Error al comunicarse con el servidor.');
  };

  const cargar = async () => {
    try {
      const [datos, lista] = await Promise.all([clienteApi.me(), clienteApi.encargos()]);
      setCliente(datos);
      setEncargos(lista);
    } catch (err) {
      manejarError(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    let activo = true;
    const timer = setInterval(async () => {
      try {
        const lista = await clienteApi.encargos();
        if (activo) setEncargos(lista);
      } catch (err) {
        if (activo && (err.status === 401 || err.status === 403)) {
          cerrarSesion();
        }
      }
    }, 60000);
    return () => {
      activo = false;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelar = async (enc) => {
    if (!window.confirm(`¿Seguro que deseas cancelar tu encargo del ${formatFechaElegante(enc.fecha_entrega)}?`)) {
      return;
    }
    setError('');
    setMensaje('');
    try {
      await clienteApi.cancelarEncargo(enc.id);
      if (notify) notify('Encargo cancelado con éxito.');
      setMensaje('Encargo cancelado.');
      await cargar();
    } catch (err) {
      manejarError(err);
    }
  };

  const salir = async () => {
    try {
      await clienteApi.logout();
    } catch {
      // noop
    }
    cerrarSesion();
  };

  const activos = useMemo(() => encargos.filter((e) => ACTIVOS.includes(e.estado)), [encargos]);
  const enPreparacion = useMemo(() => encargos.filter((e) => e.estado === 'En preparación'), [encargos]);
  const pendientes = useMemo(() => encargos.filter((e) => e.estado === 'Pendiente'), [encargos]);
  const historial = useMemo(() => encargos.filter((e) => HISTORIAL.includes(e.estado)), [encargos]);

  // Próxima entrega programada más cercana
  const proximaEntrega = useMemo(() => {
    if (activos.length === 0) return null;
    const sorted = [...activos].sort((a, b) => new Date(`${a.fecha_entrega}T00:00:00`) - new Date(`${b.fecha_entrega}T00:00:00`));
    return sorted[0];
  }, [activos]);

  const listaFiltrada = useMemo(() => {
    if (filterTab === 'preparacion') return enPreparacion;
    if (filterTab === 'pendientes') return pendientes;
    if (filterTab === 'historial') return historial;
    return activos;
  }, [filterTab, activos, enPreparacion, pendientes, historial]);

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div className="empty-state">
          <Candy size={36} className="text-muted" style={{ animation: 'spin 1.5s linear infinite' }} />
          <p className="mt-2 fw-bold">Cargando tus encargos...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Topbar del portal de clientes */}
      <header className="topbar store-topbar">
        <div className="store-topbar-inner">
          <div className="topbar-left">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="sidebar-brand-icon" style={{ width: 38, height: 38, borderRadius: 10 }}>
                <Candy size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '1.18rem', letterSpacing: '-0.3px', display: 'block', lineHeight: 1.15 }}>
                  Confitería Arteconfi
                </strong>
                <span className="small text-muted" style={{ fontSize: '0.74rem' }}>
                  Portal de Clientes · Mis Encargos
                </span>
              </div>
            </Link>
          </div>

          <div className="topbar-right" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
              <Store size={15} /> <span>Ir a la Tienda</span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-outline btn-sm"
              title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            <button type="button" className="btn btn-outline btn-sm" onClick={salir} title="Cerrar sesión">
              <LogOut size={14} /> <span className="hide-on-mobile">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="page-content" style={{ width: '100%', maxWidth: '100%', flex: 1, padding: '1.25rem clamp(1rem, 2.5vw, 2.5rem)', boxSizing: 'border-box' }}>
        {/* Hero Card con Saludo y KPIs del Cliente */}
        <div className="client-hero-card">
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--primary-soft)', color: 'var(--primary)', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <Sparkles size={12} /> Cliente Registrado
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.35rem, 2.5vw, 1.7rem)', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                Hola, {cliente?.nombre} 👋
              </h1>
              <p className="small text-muted mt-1" style={{ marginBottom: 0 }}>
                Revisa el estado de tus pedidos de confitería, retiros programados y solicitudes de encargo.
              </p>
            </div>

            <div className="flex-center" style={{ gap: '0.55rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={15} style={{ color: 'var(--primary)' }} />
                <span className="small fw-bold" style={{ color: 'var(--text-main)' }}>
                  {cliente?.telefono}
                </span>
              </div>
            </div>
          </div>

          {/* Fila de Tarjetas Resumen (KPIs) */}
          <div className="client-kpi-grid">
            <div className="client-kpi-tile">
              <div className="client-kpi-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                <ShoppingBag size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-main)' }}>
                  {activos.length}
                </div>
                <div className="small text-muted" style={{ fontSize: '0.76rem', fontWeight: 600 }}>
                  Pedidos en Curso
                </div>
              </div>
            </div>

            <div className="client-kpi-tile">
              <div className="client-kpi-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#0891b2' }}>
                <Boxes size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-main)' }}>
                  {enPreparacion.length}
                </div>
                <div className="small text-muted" style={{ fontSize: '0.76rem', fontWeight: 600 }}>
                  En Preparación en Taller
                </div>
              </div>
            </div>

            <div className="client-kpi-tile">
              <div className="client-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, lineHeight: 1.2, color: 'var(--text-main)' }}>
                  {proximaEntrega ? (
                    <span>
                      {new Date(`${proximaEntrega.fecha_entrega}T00:00:00`).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  ) : (
                    'Sin entregas pendientes'
                  )}
                </div>
                <div className="small text-muted" style={{ fontSize: '0.76rem', fontWeight: 600 }}>
                  Próximo Retiro
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notificaciones y Alertas */}
        {mensaje && (
          <div className="alert-box success mb-3">
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{mensaje}</span>
          </div>
        )}
        {error && (
          <div className="alert-box danger mb-3">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Pestañas de Filtrado de Encargos */}
        <div className="card mb-3">
          <div className="card-body" style={{ padding: '0.85rem 1.15rem' }}>
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.65rem' }}>
              <div className="flex-center" style={{ flexWrap: 'wrap', gap: '0.45rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${filterTab === 'activos' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilterTab('activos')}
                >
                  <ShoppingBag size={14} /> Todos los Activos ({activos.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterTab === 'preparacion' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilterTab('preparacion')}
                >
                  <Boxes size={14} /> En Preparación ({enPreparacion.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterTab === 'pendientes' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilterTab('pendientes')}
                >
                  <Clock size={14} /> Pendientes ({pendientes.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterTab === 'historial' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFilterTab('historial')}
                >
                  <CheckCircle2 size={14} /> Historial ({historial.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Listado de Encargos */}
        {listaFiltrada.length === 0 ? (
          <div className="card">
            <div className="empty-state" style={{ padding: '3.5rem 1.5rem' }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: 'var(--surface-alt)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <ShoppingBag size={28} />
              </div>
              <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.15rem', fontWeight: 700 }}>
                {filterTab === 'historial'
                  ? 'Aún no tienes entregas pasadas ni cancelaciones'
                  : 'No tienes encargos en esta categoría'}
              </h3>
              <p className="small text-muted" style={{ maxWidth: 460, margin: '0 auto 1.25rem' }}>
                Explora los productos disponibles en la confitería y reserva tu canasto con retiro programado en tienda.
              </p>
              <div className="flex-center" style={{ justifyContent: 'center' }}>
                <Link to="/" className="btn btn-primary">
                  <Store size={15} /> Explorar Catálogo y Encargar en Tienda
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {listaFiltrada.map((enc) => (
              <EncargoCard key={enc.id} enc={enc} onCancelar={cancelar} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Redirección de Nuevo Encargo hacia la Tienda con Carrito
 */
export function ClienteNuevoEncargoPage() {
  return <Navigate to="/" replace />;
}

/**
 * Redirección de login/registro legado si se invoca directamente
 */
export function ClienteLoginPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);
  return null;
}

export function ClienteRegistroPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/login?tab=registro', { replace: true });
  }, [navigate]);
  return null;
}
