import React, { useState } from 'react';
import {
  Settings,
  HardDriveDownload,
  RotateCcw,
  ShieldCheck,
  Bell,
  KeyRound,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import PasswordModal from '../components/PasswordModal';
import { integerInputProps } from '../utils/validators';

export default function RespaldosConfigPage() {
  const {
    configAlerts,
    setConfigAlerts,
    inactivityMinutes,
    setInactivityMinutes,
    backups,
    createBackupNow,
    restoreBackup,
    changePassword,
    recoveryCode,
    logout,
    resetDemoData,
    notify,
  } = useApp();

  const [amberDays, setAmberDays] = useState(configAlerts.amberDays);
  const [redDays, setRedDays] = useState(configAlerts.redDays);
  const [idleMins, setIdleMins] = useState(inactivityMinutes);

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [repPwd, setRepPwd] = useState('');
  const [pwdErr, setPwdErr] = useState('');

  const [restoreTarget, setRestoreTarget] = useState(null);

  const handleSaveAlerts = async (e) => {
    e.preventDefault();
    await setConfigAlerts({ amberDays: Number(amberDays), redDays: Number(redDays) });
    await setInactivityMinutes(Number(idleMins));
    notify('Configuración de alertas e inactividad actualizada.');
  };

  const handleChangePwd = async (e) => {
    e.preventDefault();
    setPwdErr('');
    if (newPwd.length < 6) {
      setPwdErr('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPwd !== repPwd) {
      setPwdErr('Las contraseñas nuevas no coinciden.');
      return;
    }
    const res = await changePassword(curPwd, newPwd);
    if (!res.ok) {
      setPwdErr(res.error);
    } else {
      setCurPwd('');
      setNewPwd('');
      setRepPwd('');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Settings size={24} style={{ color: 'var(--primary)' }} />
            Respaldos, Seguridad y Ajustes
          </h1>
          <p className="page-subtitle">
            Copias de seguridad cifradas locales/nube, plazos de vencimiento, cierre por inactividad y datos locales.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={resetDemoData} title="Restaura los datos iniciales guardados en localStorage">
            <RefreshCw size={16} /> Reiniciar Datos Demo
          </button>
          <button className="btn btn-outline" onClick={logout}>
            <Clock size={16} /> Bloquear Pantalla
          </button>
          <button className="btn btn-primary" onClick={createBackupNow}>
            <HardDriveDownload size={16} /> Respaldar Ahora
          </button>
        </div>
      </div>

      <div className="grid-2 mb-3">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Bell size={17} style={{ color: 'var(--warning)' }} />
              Plazos de Vencimiento e Inactividad
            </h2>
          </div>
          <form onSubmit={handleSaveAlerts} className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Alerta Ámbar (días antes)</label>
                <input {...integerInputProps(amberDays, setAmberDays, { min: 1 })} className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Alerta Roja / Crítica (días antes)</label>
                <input {...integerInputProps(redDays, setRedDays, { min: 1 })} className="form-control" />
              </div>
              <div className="form-group full">
                <label className="form-label">Cierre automático de sesión por inactividad (minutos)</label>
                <input {...integerInputProps(idleMins, setIdleMins, { min: 1 })} className="form-control" />
              </div>
            </div>
            <button type="submit" className="btn btn-dark mt-3">
              Guardar Configuración
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <KeyRound size={17} style={{ color: 'var(--primary)' }} />
              Seguridad y Contraseña del Dueño
            </h2>
          </div>
          <form onSubmit={handleChangePwd} className="card-body">
            <div className="alert-box info mb-3">
              <span className="small">
                Código de recuperación offline: <code>{recoveryCode}</code>
              </span>
            </div>
            {pwdErr && <div className="alert-box danger mb-3">{pwdErr}</div>}
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Contraseña actual</label>
                <input type="password" className="form-control" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nueva contraseña</label>
                <input type="password" className="form-control" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Repetir nueva contraseña</label>
                <input type="password" className="form-control" value={repPwd} onChange={(e) => setRepPwd(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-3">
              Actualizar Contraseña
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <ShieldCheck size={17} style={{ color: 'var(--success)' }} />
            Respaldos Cifrados Disponibles (7 diarios / 4 semanales)
          </h2>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Tipo</th>
                <th>Ubicación</th>
                <th>Tamaño</th>
                <th>Estado</th>
                <th className="num">Restaurar</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id}>
                  <td className="fw-bold">{b.fechaHora}</td>
                  <td>{b.tipo}</td>
                  <td><span className="badge badge-neutral">{b.destino}</span></td>
                  <td className="small">{b.tamano}</td>
                  <td><span className="badge badge-success">{b.integridad} · Cifrado</span></td>
                  <td className="num">
                    <button className="btn btn-outline btn-sm" onClick={() => setRestoreTarget(b)}>
                      <RotateCcw size={14} /> Restaurar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PasswordModal
        isOpen={Boolean(restoreTarget)}
        title="Restaurar Copia de Seguridad"
        message={`Se reemplazarán los datos actuales por el respaldo del ${restoreTarget?.fechaHora} (el sistema guardará una copia preventiva antes de restaurar).`}
        onConfirm={() => restoreBackup(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
      />
    </div>
  );
}
