import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clienteApi, setClienteSesion, clearClienteSesion } from './clienteApi';

const ACTIVOS = ['Pendiente', 'En preparación'];
const HISTORIAL = ['Entregado', 'Cancelado'];

const COLORES_ESTADO = {
  Pendiente: '#f59e0b',
  'En preparación': '#3b82f6',
  Entregado: '#10b981',
  Cancelado: '#6b7280',
};

const pantalla = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  background: '#fdf6f0',
  boxSizing: 'border-box',
};

const tarjeta = {
  background: '#fff',
  borderRadius: 12,
  padding: 24,
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  width: '100%',
  maxWidth: 420,
  boxSizing: 'border-box',
};

const campo = {
  width: '100%',
  padding: 10,
  borderRadius: 8,
  border: '1px solid #ccc',
  marginBottom: 12,
  boxSizing: 'border-box',
  fontSize: '1rem',
};

const boton = {
  width: '100%',
  padding: 12,
  borderRadius: 8,
  border: 'none',
  background: '#8b4513',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: '1rem',
};

const etiqueta = { display: 'block', fontWeight: 600, marginBottom: 4, fontSize: '0.9rem' };

const formatoPesos = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(n || 0));

function formatFecha(iso) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function fechaLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function ClienteLoginPage() {
  const navigate = useNavigate();
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await clienteApi.login(telefono, password);
      setClienteSesion(res.token, res.cliente);
      navigate('/cliente', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={pantalla}>
      <form onSubmit={onSubmit} style={tarjeta}>
        <h2 style={{ marginTop: 0 }}>Ingreso de clientes</h2>
        <label style={etiqueta}>Teléfono</label>
        <input
          style={campo}
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="9 1234 5678"
          required
        />
        <label style={etiqueta}>Contraseña</label>
        <input
          style={campo}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
        <button style={boton} disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.9rem' }}>
          ¿No tienes cuenta? <Link to="/cliente/registro">Regístrate</Link>
        </p>
      </form>
    </div>
  );
}

export function ClienteRegistroPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== repetir) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setCargando(true);
    try {
      const res = await clienteApi.registro(telefono, nombre, password);
      setClienteSesion(res.token, res.cliente);
      navigate('/cliente', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={pantalla}>
      <form onSubmit={onSubmit} style={tarjeta}>
        <h2 style={{ marginTop: 0 }}>Crear cuenta</h2>
        <label style={etiqueta}>Nombre</label>
        <input style={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <label style={etiqueta}>Teléfono</label>
        <input
          style={campo}
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="9 1234 5678"
          required
        />
        <label style={etiqueta}>Contraseña</label>
        <input
          style={campo}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label style={etiqueta}>Repetir contraseña</label>
        <input
          style={campo}
          type="password"
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
          required
        />
        {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
        <button style={boton} disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.9rem' }}>
          ¿Ya tienes cuenta? <Link to="/cliente/login">Ingresa aquí</Link>
        </p>
      </form>
    </div>
  );
}

function EncargoCard({ enc, onCancelar }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <strong style={{ textTransform: 'capitalize' }}>{formatFecha(enc.fecha_entrega)}</strong>
        <span
          style={{
            background: COLORES_ESTADO[enc.estado] || '#6b7280',
            color: '#fff',
            borderRadius: 999,
            padding: '2px 10px',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {enc.estado}
        </span>
      </div>
      <div style={{ fontSize: '0.9rem', color: '#555', marginTop: 4 }}>Hora: {enc.hora_entrega}</div>
      {enc.items?.length > 0 && (
        <ul style={{ margin: '8px 0', paddingLeft: 18, fontSize: '0.9rem' }}>
          {enc.items.map((it, i) => (
            <li key={i}>
              {it.cantidad} × {it.producto}
            </li>
          ))}
        </ul>
      )}
      {enc.notas && <div style={{ fontSize: '0.85rem', color: '#555' }}>Notas: {enc.notas}</div>}
      {enc.estado === 'Pendiente' && (
        <button
          onClick={() => onCancelar(enc)}
          style={{
            marginTop: 8,
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #b91c1c',
            background: '#fff',
            color: '#b91c1c',
            cursor: 'pointer',
          }}
        >
          Cancelar encargo
        </button>
      )}
    </div>
  );
}

export function ClientePanelPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cliente, setCliente] = useState(null);
  const [encargos, setEncargos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState(location.state?.mensaje || '');

  const cerrarSesion = () => {
    clearClienteSesion();
    navigate('/cliente/login', { replace: true });
  };

  const manejarError = (err) => {
    // Token vencido o inválido: volver al login
    if (err.status === 401 || err.status === 403) {
      cerrarSesion();
      return;
    }
    setError(err.message);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelar = async (enc) => {
    if (!window.confirm(`¿Cancelar tu encargo del ${formatFecha(enc.fecha_entrega)}?`)) return;
    setError('');
    setMensaje('');
    try {
      await clienteApi.cancelarEncargo(enc.id);
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
      // si falla, igual cerramos sesión local
    }
    cerrarSesion();
  };

  if (cargando) {
    return <div style={pantalla}>Cargando...</div>;
  }

  const activos = encargos.filter((e) => ACTIVOS.includes(e.estado));
  const historial = encargos.filter((e) => HISTORIAL.includes(e.estado));

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16, boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Hola, {cliente?.nombre}</h2>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>Tus encargos en la confitería</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            to="/cliente/nuevo"
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              background: '#8b4513',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Nuevo encargo
          </Link>
          <button
            onClick={salir}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
          >
            Salir
          </button>
        </div>
      </header>

      {mensaje && <div style={{ color: '#047857', marginBottom: 12 }}>{mensaje}</div>}
      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

      <section style={{ ...tarjeta, maxWidth: '100%', marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Encargos activos</h3>
        {activos.length === 0 && <p style={{ color: '#666' }}>No tienes encargos activos.</p>}
        {activos.map((enc) => (
          <EncargoCard key={enc.id} enc={enc} onCancelar={cancelar} />
        ))}
      </section>

      <section style={{ ...tarjeta, maxWidth: '100%' }}>
        <h3 style={{ marginTop: 0 }}>Historial</h3>
        {historial.length === 0 && <p style={{ color: '#666' }}>Aún no tienes entregas ni cancelaciones.</p>}
        {historial.map((enc) => (
          <EncargoCard key={enc.id} enc={enc} onCancelar={cancelar} />
        ))}
      </section>
    </div>
  );
}

export function ClienteNuevoEncargoPage() {
  const navigate = useNavigate();
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cantidades, setCantidades] = useState({});
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('16:00');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const minFecha = fechaLocal(manana);

  const manejarError = (err) => {
    if (err.status === 401 || err.status === 403) {
      clearClienteSesion();
      navigate('/cliente/login', { replace: true });
      return;
    }
    setError(err.message);
  };

  useEffect(() => {
    clienteApi
      .catalogo()
      .then(setCatalogo)
      .catch(manejarError)
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiarCantidad = (producto, valor) => {
    const n = Math.max(0, Math.min(Number(valor) || 0, producto.disponible));
    setCantidades((prev) => ({ ...prev, [producto.id]: n }));
  };

  const seleccionados = catalogo.filter((p) => Number(cantidades[p.id]) > 0);
  const total = seleccionados.reduce((s, p) => s + Number(p.precio_venta) * Number(cantidades[p.id]), 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!fecha || fecha < minFecha) {
      setError('Elige una fecha de entrega desde mañana en adelante.');
      return;
    }
    if (seleccionados.length === 0) {
      setError('Agrega al menos un producto.');
      return;
    }
    setEnviando(true);
    try {
      await clienteApi.crearEncargo({
        fecha_entrega: fecha,
        hora_entrega: hora,
        notas,
        items: seleccionados.map((p) => ({ producto_id: p.id, cantidad: Number(cantidades[p.id]) })),
      });
      navigate('/cliente', {
        replace: true,
        state: { mensaje: 'Encargo solicitado. La confitería confirmará tu pedido.' },
      });
    } catch (err) {
      manejarError(err);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return <div style={pantalla}>Cargando productos...</div>;
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16, boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Nuevo encargo</h2>
        <Link to="/cliente" style={{ color: '#8b4513' }}>Volver a mis encargos</Link>
      </header>

      <form onSubmit={onSubmit} style={{ ...tarjeta, maxWidth: '100%' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={etiqueta}>Fecha de entrega</label>
            <input type="date" style={campo} min={minFecha} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={etiqueta}>Hora</label>
            <input type="time" style={campo} value={hora} onChange={(e) => setHora(e.target.value)} required />
          </div>
        </div>

        <h3>Productos</h3>
        {catalogo.length === 0 && <p style={{ color: '#666' }}>No hay productos disponibles para pedir ahora.</p>}
        {catalogo.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              borderBottom: '1px solid #eee',
              padding: '10px 0',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{p.nombre}</div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                {p.categoria} · {formatoPesos(p.precio_venta)} / {p.unidad_medida.toLowerCase()} · disponibles: {p.disponible}
              </div>
            </div>
            <input
              type="number"
              min={0}
              max={p.disponible}
              value={cantidades[p.id] || 0}
              onChange={(e) => cambiarCantidad(p, e.target.value)}
              style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
            />
          </div>
        ))}

        <label style={{ ...etiqueta, marginTop: 16 }}>Notas (opcional)</label>
        <textarea style={{ ...campo, minHeight: 70 }} value={notas} onChange={(e) => setNotas(e.target.value)} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, margin: '12px 0' }}>
          <span>Total estimado</span>
          <span>{formatoPesos(total)}</span>
        </div>

        {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
        <button style={boton} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Solicitar encargo'}
        </button>
      </form>
    </div>
  );
}