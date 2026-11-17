import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getClienteToken } from './clienteApi';
import {
  ClienteLoginPage,
  ClienteRegistroPage,
  ClientePanelPage,
  ClienteNuevoEncargoPage,
} from './ClientePages';

function RequiereCliente({ children }) {
  return getClienteToken() ? children : <Navigate to="/cliente/login" replace />;
}

export default function ClientePortal() {
  return (
    <Routes>
      <Route path="login" element={<ClienteLoginPage />} />
      <Route path="registro" element={<ClienteRegistroPage />} />
      <Route
        index
        element={
          <RequiereCliente>
            <ClientePanelPage />
          </RequiereCliente>
        }
      />
      <Route
        path="nuevo"
        element={
          <RequiereCliente>
            <ClienteNuevoEncargoPage />
          </RequiereCliente>
        }
      />
      <Route path="*" element={<Navigate to="/cliente" replace />} />
    </Routes>
  );
}