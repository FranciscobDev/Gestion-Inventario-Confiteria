const TOKEN_KEY = 'arteconfi_cliente_token';
const DATOS_KEY = 'arteconfi_cliente_datos';

export function getClienteToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function getClienteDatos() {
  try {
    const raw = localStorage.getItem(DATOS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setClienteSesion(token, cliente) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(DATOS_KEY, JSON.stringify(cliente));
  } catch {
    // sin almacenamiento disponible
  }
}

export function clearClienteSesion() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(DATOS_KEY);
  } catch {
    // noop
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getClienteToken();
  if (auth && token) {
    headers.Authorization = `Token ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || 'Error de comunicación con el servidor.');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const clienteApi = {
  registro: (telefono, nombre, password) =>
    request('/api/clientes/registro/', { method: 'POST', body: { telefono, nombre, password }, auth: false }),
  login: (telefono, password) =>
    request('/api/clientes/login/', { method: 'POST', body: { telefono, password }, auth: false }),
  logout: () => request('/api/clientes/logout/', { method: 'POST' }),
  me: () => request('/api/clientes/me/'),
  tiendaPublica: () => request('/api/clientes/tienda/', { auth: false }),
  encargos: () => request('/api/clientes/encargos/'),
  cancelarEncargo: (id) => request(`/api/clientes/encargos/${id}/cancelar/`, { method: 'POST' }),
    catalogo: () => request('/api/clientes/catalogo/'),
  crearEncargo: (payload) => request('/api/clientes/encargos/nuevo/', { method: 'POST', body: payload }),
};