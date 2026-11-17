import React, { useState } from 'react';
import { Lock, X, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function PasswordModal({ isOpen, title, message, onConfirm, onClose }) {
  const { verifyOwnerPassword } = useApp();
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChecking(true);
    const valid = await verifyOwnerPassword(pwd);
    setChecking(false);
    if (!valid) {
      setError('Contraseña incorrecta. Inténtalo de nuevo.');
      return;
    }
    setPwd('');
    setError('');
    onConfirm();
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: 430 }}>
        <div className="modal-header">
          <h3 className="modal-title flex-center">
            <ShieldAlert size={18} className="text-danger" />
            {title || 'Confirmación de Seguridad'}
          </h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="small text-muted mb-3">{message}</p>
            <div className="form-group">
              <label className="form-label">Contraseña del Dueño (Demo: admin123)</label>
              <div className="input-icon-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  className="form-control"
                  value={pwd}
                  onChange={(e) => {
                    setPwd(e.target.value);
                    setError('');
                  }}
                  placeholder="Ingresa tu contraseña para confirmar"
                  autoFocus
                  required
                />
              </div>
              {error && <span className="small text-danger mt-1">{error}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={checking}>
              {checking ? 'Verificando...' : 'Confirmar acción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
