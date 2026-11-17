import React, { useState } from 'react';
import { Candy, Lock, User, KeyRound, WifiOff, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login, recoverWithCode, isOnline } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Modal de recuperación sin internet (HU-14)
  const [showRecover, setShowRecover] = useState(false);
  const [recCode, setRecCode] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [recError, setRecError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(username, password);
    if (!res.ok) {
      setError(res.error);
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
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Candy size={26} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Arteconfi</h2>
          <p className="small text-muted mt-1" style={{ marginBottom: 0 }}>
            Gestión de Inventario y Finanzas — Acceso Dueño
          </p>
          {!isOnline && (
            <div className="mt-2">
              <span className="badge badge-warning">
                <WifiOff size={12} /> Modo Sin Conexión disponible
              </span>
            </div>
          )}
        </div>

        <div className="auth-body">
          {error && (
            <div className="alert-box danger mb-3">
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="form-label">Usuario</label>
              <div className="input-icon-wrap">
                <User size={16} />
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nombre de usuario"
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

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Entrar al Sistema
            </button>
          </form>

          <div className="flex-between mt-3">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowRecover(true)}
            >
              <KeyRound size={14} /> ¿Olvidaste tu contraseña?
            </button>
            <span className="small text-muted">Demo: admin / admin123</span>
          </div>
        </div>
      </div>

      {showRecover && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">Recuperación Offline</h3>
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
