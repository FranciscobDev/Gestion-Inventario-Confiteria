import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Candy,
  Lock,
  User,
  KeyRound,
  WifiOff,
  AlertCircle,
  ArrowLeft,
  UserPlus,
  LogIn,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { clienteApi, setClienteSesion } from '../clientes/clienteApi';
import { onlyIntegers, blockNonIntegerKeys, validatePasswordStrength } from '../utils/validators';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { loginUnified, recoverWithCode, isOnline, notify } = useApp();

  const initialTab = searchParams.get('tab') === 'registro' ? 'registro' : 'login';
  const nextParam = searchParams.get('next') || '';

  const [activeTab, setActiveTab] = useState(initialTab);

  // Estado Iniciar Sesión (Dueño o Cliente)
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estado Crear Cuenta (Exclusivo Clientes)
  const [regNombre, setRegNombre] = useState('');
  const [regTelefono, setRegTelefono] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Estado Recuperación Offline (Dueño)
  const [showRecover, setShowRecover] = useState(false);
  const [recCode, setRecCode] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [recError, setRecError] = useState('');

  useEffect(() => {
    const t = searchParams.get('tab') === 'registro' ? 'registro' : 'login';
    setActiveTab(t);
  }, [searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
    setRegError('');
    const params = {};
    if (tab === 'registro') params.tab = 'registro';
    if (nextParam) params.next = nextParam;
    setSearchParams(params, { replace: true });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await loginUnified(identificador, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (res.tipo === 'dueno') {
      navigate('/admin-panel', { replace: true });
    } else if (nextParam === 'tienda') {
      navigate('/?carrito=1', { replace: true });
    } else {
      navigate('/cliente', { replace: true });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    const nombreClean = regNombre.trim();
    const fonoClean = onlyIntegers(regTelefono);

    if (!nombreClean) {
      setRegError('Debes ingresar tu nombre completo.');
      return;
    }
    if (fonoClean.length !== 9) {
      setRegError('El teléfono debe contener exactamente 9 dígitos numéricos (ej: 912345678).');
      return;
    }
    const pwdCheck = validatePasswordStrength(regPassword);
    if (!pwdCheck.ok) {
      setRegError(pwdCheck.error);
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await clienteApi.registro(fonoClean, nombreClean, regPassword);
      setClienteSesion(res.token, res.cliente);
      if (notify) {
        notify(`¡Bienvenido/a, ${res.cliente.nombre}! Tu cuenta de cliente fue creada.`);
      }
      if (nextParam === 'tienda') {
        navigate('/?carrito=1', { replace: true });
      } else {
        navigate('/cliente', { replace: true });
      }
    } catch (err) {
      setRegError(err.message || 'No fue posible registrar la cuenta.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    if (newPwd.length < 6) {
      setRecError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    const res = await recoverWithCode(recCode, newPwd);
    if (!res.ok) {
      setRecError(res.error);
    } else {
      setShowRecover(false);
      setRecCode('');
      setNewPwd('');
      setError('');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-header">
          <div className="auth-logo">
            <Candy size={26} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Confitería Arteconfi</h2>
          {!isOnline && (
            <div className="mt-2">
              <span className="badge badge-warning">
                <WifiOff size={12} /> Modo Sin Conexión disponible
              </span>
            </div>
          )}

          {/* Pestañas: Iniciar Sesión / Crear Cuenta (Clientes) */}
          <div className="tabs-bar mt-3" style={{ width: '100%', display: 'flex', marginBottom: 0 }}>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => switchTab('login')}
            >
              <LogIn size={15} /> Iniciar Sesión
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'registro' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => switchTab('registro')}
            >
              <UserPlus size={15} /> Crear Cuenta
            </button>
          </div>
        </div>

        <div className="auth-body">
          {activeTab === 'login' ? (
            <>
              {error && (
                <div className="alert-box danger mb-3">
                  <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                <div className="form-group mb-3">
                  <label className="form-label">Usuario (Dueño) o Teléfono (Cliente)</label>
                  <div className="input-icon-wrap">
                    <User size={16} />
                    <input
                      type="text"
                      className="form-control"
                      value={identificador}
                      onChange={(e) => setIdentificador(e.target.value)}
                      placeholder="Ej: admin o 912345678"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Contraseña</label>
                  <div className="input-icon-wrap">
                    <Lock size={16} />
                    <input
                      type="password"
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                </button>
              </form>

              <div className="flex-between mt-3">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--primary)', fontWeight: 700 }}
                  onClick={() => switchTab('registro')}
                >
                  ¿Cliente nuevo? Crear cuenta
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowRecover(true)}
                >
                  <KeyRound size={14} /> Recuperar acceso
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="alert-box info mb-3" style={{ fontSize: '0.8rem', marginTop: 0 }}>
                <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong>Registro para Clientes.</strong> Crea tu cuenta con tu teléfono para
                  agendar encargos y hacer seguimiento en línea. La cuenta de administración es única del dueño.
                </span>
              </div>

              {regError && (
                <div className="alert-box danger mb-3">
                  <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group mb-3">
                  <label className="form-label">Nombre Completo *</label>
                  <div className="input-icon-wrap">
                    <User size={16} />
                    <input
                      type="text"
                      className="form-control"
                      value={regNombre}
                      onChange={(e) => setRegNombre(e.target.value)}
                      placeholder="Ej: Camila Rojas"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Teléfono Celular (9 dígitos) *</label>
                  <div className="input-icon-wrap">
                    <Phone size={16} />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={9}
                      className="form-control"
                      value={regTelefono}
                      onKeyDown={blockNonIntegerKeys}
                      onChange={(e) => setRegTelefono(onlyIntegers(e.target.value).slice(0, 9))}
                      placeholder="912345678"
                      required
                    />
                  </div>
                  <span className="small text-muted">
                    Este número será tu usuario para iniciar sesión.
                  </span>
                </div>

                <div className="form-row mb-2">
                  <div className="form-group">
                    <label className="form-label">Contraseña *</label>
                    <div className="input-icon-wrap">
                      <Lock size={16} />
                      <input
                        type="password"
                        className="form-control"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mín. 8 caract., 1 Mayús., 1 símbolo"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirmar Contraseña *</label>
                    <div className="input-icon-wrap">
                      <Lock size={16} />
                      <input
                        type="password"
                        className="form-control"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        placeholder="Repite tu clave"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="small text-muted mb-3" style={{ fontSize: '0.76rem' }}>
                  Requisitos: Mínimo 8 caracteres, al menos una mayúscula y un símbolo (ej: Clave#2026).
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  disabled={regLoading}
                >
                  <UserPlus size={16} />
                  {regLoading ? 'Creando cuenta...' : 'Registrar Cuenta de Cliente'}
                </button>
              </form>

              <div className="flex-center mt-3">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => switchTab('login')}
                >
                  ¿Ya tienes cuenta? Inicia sesión aquí
                </button>
              </div>
            </>
          )}

          <div
            className="flex-between mt-3"
            style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.8rem' }}
          >
            <Link to="/" className="btn btn-outline btn-sm">
              <ArrowLeft size={14} /> Volver a la Tienda
            </Link>

          </div>
        </div>
      </div>

      {showRecover && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">Recuperación Offline (Dueño)</h3>
            </div>
            <form onSubmit={handleRecover}>
              <div className="modal-body">
                <p className="small text-muted mb-3">
                  Ingresa el código de recuperación entregado al crear la cuenta del dueño (Demo:{' '}
                  <code>ARTE-9482-CONF</code>).
                </p>
                {recError && <div className="alert-box danger mb-3">{recError}</div>}
                <div className="form-group mb-3">
                  <label className="form-label">Código de Recuperación</label>
                  <input
                    type="text"
                    className="form-control"
                    value={recCode}
                    onChange={(e) => setRecCode(e.target.value)}
                    placeholder="ARTE-XXXX-XXXX"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nueva Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowRecover(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Restablecer Acceso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
