import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getClienteToken } from './clienteApi';
import { ClientePanelPage } from './ClientePages';

function RequiereCliente({ children }) {
  return getClienteToken() ? children : <Navigate to="/login" replace />;
}

export default function ClientePortal() {
  return (
    <Routes>
      <Route path="login" element={<Navigate to="/login" replace />} />
      <Route path="registro" element={<Navigate to="/login?tab=registro" replace />} />
      <Route
        index
        element={
          <RequiereCliente>
            <ClientePanelPage />
          </RequiereCliente>
        }
      />
      <Route path="nuevo" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/cliente" replace />} />
    </Routes>
  );
}
