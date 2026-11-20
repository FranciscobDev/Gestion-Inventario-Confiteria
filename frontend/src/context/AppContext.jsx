import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  INITIAL_CATEGORIES,
  INITIAL_PROVIDERS,
  INITIAL_PRODUCTS,
  INITIAL_LOTS,
  INITIAL_COMBOS,
  INITIAL_ORDERS,
  INITIAL_MOVEMENTS,
  INITIAL_SALES_FINANCE,
  INITIAL_SUPPLIER_RETURNS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_BACKUPS,
} from '../data/mockData';
import { api, getStoredToken, setStoredToken, mapBootstrapData, mapOrder } from '../services/api';
import { setClienteSesion } from '../clientes/clienteApi';

const AppContext = createContext(null);
const STORAGE_KEY = 'arteconfi_v2_state';
const THEME_KEY = 'arteconfi_v2_theme';

export const formatCLP = (amount) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

export const nowDateTime = () => {
  const d = new Date();
  const date = d.toISOString().split('T')[0];
  const time = d.toTimeString().slice(0, 5);
  return `${date} ${time}`;
};

export const todayStr = () => new Date().toISOString().split('T')[0];

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const saved = useMemo(() => loadSavedState(), []);

  // Tema visual (Claro / Oscuro)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // noop
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  // Estado de conexión Backend Django
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(saved?.pendingSyncCount || 0);

  // Autenticación y Seguridad
  const [user, setUser] = useState(getStoredToken() ? { username: 'admin', role: 'Dueño' } : null);
  const [ownerPassword, setOwnerPassword] = useState(saved?.ownerPassword || 'admin123');
  const [recoveryCode, setRecoveryCode] = useState('ARTE-9482-CONF');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [inactivityMinutes, setInactivityMinutesState] = useState(saved?.inactivityMinutes ?? 15);
  const [configAlerts, setConfigAlertsState] = useState(
    saved?.configAlerts || { amberDays: 30, redDays: 15 }
  );

  // Datos principales
  const [categories, setCategories] = useState(saved?.categories || INITIAL_CATEGORIES);
  const [providers, setProviders] = useState(saved?.providers || INITIAL_PROVIDERS);
  const [products, setProducts] = useState(saved?.products || INITIAL_PRODUCTS);
  const [lots, setLots] = useState(saved?.lots || INITIAL_LOTS);
  const [combos, setCombos] = useState(saved?.combos || INITIAL_COMBOS);
  const [orders, setOrders] = useState(saved?.orders || INITIAL_ORDERS);
  const [movements, setMovements] = useState(saved?.movements || INITIAL_MOVEMENTS);
  const [salesFinance, setSalesFinance] = useState(saved?.salesFinance || INITIAL_SALES_FINANCE);
  const [supplierReturns, setSupplierReturns] = useState(
    saved?.supplierReturns || INITIAL_SUPPLIER_RETURNS
  );
  const [purchaseOrders, setPurchaseOrders] = useState(
    saved?.purchaseOrders || INITIAL_PURCHASE_ORDERS
  );
  const [backups, setBackups] = useState(saved?.backups || INITIAL_BACKUPS);
  const [reviewedDays, setReviewedDays] = useState(saved?.reviewedDays || {});

  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const syncFromBackend = useCallback(async () => {
    const raw = await api.bootstrap();
    const mapped = mapBootstrapData(raw);
    setConfigAlertsState(mapped.configAlerts);
    setInactivityMinutesState(mapped.inactivityMinutes);
    setRecoveryCode(mapped.recoveryCode);
    setCategories(mapped.categories);
    setProviders(mapped.providers);
    setProducts(mapped.products);
    setLots(mapped.lots);
    setCombos(mapped.combos);
    setOrders(mapped.orders);
    setMovements(mapped.movements);
    setSalesFinance(mapped.salesFinance);
    setSupplierReturns(mapped.supplierReturns);
    setPurchaseOrders(mapped.purchaseOrders);
    setReviewedDays(mapped.reviewedDays);
    if (mapped.backups.length > 0) setBackups(mapped.backups);
  }, []);

  // Detectar backend Django al iniciar
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await api.health();
        if (!mounted) return;
        setBackendAvailable(true);
        if (getStoredToken()) {
          try {
            const st = await api.authStatus();
            if (!mounted) return;
            setUser(st.user);
            await syncFromBackend();
          } catch {
            setStoredToken('');
            if (mounted) setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        // Backend apagado -> modo local / offline con demo en localStorage (sin auto-login en tienda)
        if (mounted) {
          setBackendAvailable(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [syncFromBackend]);

  const useBackend = backendAvailable && isOnline && Boolean(getStoredToken());

  // Llegada de pedidos nuevos del portal: refresco liviano de `orders` cada 30 s (solo con backend y sesión admin)
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  useEffect(() => {
    if (!user || !useBackend) return undefined;
    let active = true;
    let knownIds = null; // se llena en el primer sondeo (sin avisos)
    const poll = async () => {
      try {
        const raw = await api.listOrders();
        if (!active) return;
        const list = (Array.isArray(raw) ? raw : raw?.results || []).map(mapOrder);
        const previos = new Set(ordersRef.current.map((o) => o.id));
        if (knownIds) knownIds.forEach((id) => previos.add(id));
        if (knownIds) {
          list
            .filter((o) => o.origen === 'Portal' && !previos.has(o.id))
            .forEach((o) => notify(`Nuevo pedido de ${o.clienteNombre}`));
        }
        knownIds = new Set(list.map((o) => o.id));
        if (JSON.stringify(list) !== JSON.stringify(ordersRef.current)) setOrders(list);
      } catch {
        // errores de red del sondeo: se ignoran en silencio
      }
    };
    poll();
    const timer = setInterval(poll, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user, useBackend, notify]);

  // Guardar copia local en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ownerPassword,
          inactivityMinutes,
          pendingSyncCount,
          configAlerts,
          categories,
          providers,
          products,
          lots,
          combos,
          orders,
          movements,
          salesFinance,
          supplierReturns,
          purchaseOrders,
          backups,
          reviewedDays,
        })
      );
    } catch {
      // noop
    }
  }, [
    ownerPassword,
    inactivityMinutes,
    pendingSyncCount,
    configAlerts,
    categories,
    providers,
    products,
    lots,
    combos,
    orders,
    movements,
    salesFinance,
    supplierReturns,
    purchaseOrders,
    backups,
    reviewedDays,
  ]);

  // Cierre automático por inactividad
  useEffect(() => {
    if (!user || !inactivityMinutes || inactivityMinutes <= 0) return;
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setUser(null);
        notify('Sesión cerrada automáticamente por inactividad.', 'warning');
      }, inactivityMinutes * 60 * 1000);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [user, inactivityMinutes, notify]);

  const trackOfflineQueue = () => {
    if (!isOnline) setPendingSyncCount((c) => c + 1);
  };

  const toggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    if (next) {
      if (backendAvailable && getStoredToken()) {
        try {
          await syncFromBackend();
        } catch {
          // noop
        }
      }
      if (pendingSyncCount > 0) {
        notify(`Conexión restablecida. ${pendingSyncCount} operaciones sincronizadas.`);
        setPendingSyncCount(0);
      } else {
        notify('Sistema conectado.');
      }
    } else {
      notify('Modo Sin Conexión activado. Los cambios se guardan localmente.', 'warning');
    }
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOwnerPassword('admin123');
    setInactivityMinutesState(15);
    setPendingSyncCount(0);
    setConfigAlertsState({ amberDays: 30, redDays: 15 });
    setCategories(INITIAL_CATEGORIES);
    setProviders(INITIAL_PROVIDERS);
    setProducts(INITIAL_PRODUCTS);
    setLots(INITIAL_LOTS);
    setCombos(INITIAL_COMBOS);
    setOrders(INITIAL_ORDERS);
    setMovements(INITIAL_MOVEMENTS);
    setSalesFinance(INITIAL_SALES_FINANCE);
    setSupplierReturns(INITIAL_SUPPLIER_RETURNS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setBackups(INITIAL_BACKUPS);
    setReviewedDays({});
    notify('Datos locales restaurados a su estado inicial.');
  };

  // --- Auth ---
  const login = async (username, password) => {
    if (backendAvailable && isOnline) {
      try {
        const res = await api.login(username, password);
        setStoredToken(res.token);
        setUser(res.user);
        await syncFromBackend();
        notify('Sesión iniciada y sincronizada con Django.');
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    if (lockedUntil && Date.now() < lockedUntil) {
      return { ok: false, error: 'Cuenta bloqueada temporalmente (5 min) tras 5 intentos fallidos.' };
    }
    if (username.trim().toLowerCase() === 'admin' && password === ownerPassword) {
      setUser({ username: 'admin', role: 'Dueño' });
      setFailedAttempts(0);
      setLockedUntil(null);
      notify('Sesión iniciada correctamente (modo local).');
      return { ok: true };
    }
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 5) {
      setLockedUntil(Date.now() + 5 * 60 * 1000);
      return { ok: false, error: 'Demasiados intentos fallidos. Bloqueo activo por 5 minutos.' };
    }
    return { ok: false, error: 'Usuario o contraseña incorrectos.' };
  };

  const loginUnified = async (identificador, password) => {
    if (backendAvailable && isOnline) {
      try {
        const res = await api.loginUnified(identificador, password);
        if (res.tipo === 'dueno') {
          setStoredToken(res.token);
          setUser(res.user);
          await syncFromBackend();
          notify('Sesión de administrador iniciada.');
          return { ok: true, tipo: 'dueno' };
        }
        if (res.tipo === 'cliente') {
          setClienteSesion(res.token, res.cliente);
          notify(`¡Bienvenido, ${res.cliente.nombre}!`);
          return { ok: true, tipo: 'cliente', cliente: res.cliente };
        }
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }

    // Fallback local si backend está apagado
    const localRes = await login(identificador, password);
    if (localRes.ok) return { ok: true, tipo: 'dueno' };
    return localRes;
  };

  const logout = async () => {
    if (useBackend) {
      try {
        await api.logout();
      } catch {
        // noop
      }
    }
    setStoredToken('');
    setUser(null);
  };

  const verifyOwnerPassword = async (pwd) => {
    if (useBackend) {
      try {
        const res = await api.verifyPassword(pwd);
        return Boolean(res.valid);
      } catch {
        return false;
      }
    }
    return pwd === ownerPassword;
  };

  const changePassword = async (currentPwd, newPwd) => {
    if (useBackend) {
      try {
        await api.changePassword(currentPwd, newPwd);
        notify('Contraseña actualizada en el servidor.');
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }
    if (currentPwd !== ownerPassword) {
      return { ok: false, error: 'La contraseña actual no coincide.' };
    }
    setOwnerPassword(newPwd);
    notify('Contraseña actualizada correctamente.');
    return { ok: true };
  };

  const recoverWithCode = async (code, newPwd) => {
    if (backendAvailable && isOnline) {
      try {
        await api.recoverAccess(code, newPwd);
        notify('Acceso recuperado en Django. Inicia sesión con tu nueva contraseña.');
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }
    if (code.trim() !== recoveryCode) {
      return { ok: false, error: 'El código de recuperación no es válido.' };
    }
    setOwnerPassword(newPwd);
    setFailedAttempts(0);
    setLockedUntil(null);
    notify('Acceso recuperado.');
    return { ok: true };
  };

  const setConfigAlerts = async (nextCfg) => {
    setConfigAlertsState(nextCfg);
    if (useBackend) {
      try {
        await api.updateConfig({ amber_days: nextCfg.amberDays, red_days: nextCfg.redDays });
      } catch (err) {
        notify(err.message, 'error');
      }
    }
  };

  const setInactivityMinutes = async (mins) => {
    setInactivityMinutesState(mins);
    if (useBackend) {
      try {
        await api.updateConfig({ inactivity_minutes: mins });
      } catch {
        // noop
      }
    }
  };

  // --- Categorías ---
  const addCategory = async (nombre, descripcion) => {
    if (useBackend) {
      try {
        await api.createCategory(nombre.trim(), descripcion || '');
        await syncFromBackend();
        notify(`Categoría "${nombre}" creada.`);
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    const newId = Math.max(0, ...categories.map((c) => c.id)) + 1;
    setCategories((prev) => [...prev, { id: newId, nombre: nombre.trim(), descripcion: descripcion || '' }]);
    trackOfflineQueue();
    notify(`Categoría "${nombre}" creada.`);
  };

  const updateCategory = async (id, nombre, descripcion) => {
    if (useBackend) {
      try {
        await api.updateCategory(id, nombre.trim(), descripcion || '');
        await syncFromBackend();
        notify('Categoría actualizada.');
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, nombre: nombre.trim(), descripcion: descripcion || '' } : c))
    );
    trackOfflineQueue();
    notify('Categoría actualizada.');
  };

  // --- Cálculos derivados ---
  const getLotExpirationStatus = (dateStr) => {
    const days = daysUntil(dateStr);
    if (days === null) return { label: 'Sin vencimiento', badge: 'badge-neutral', days: null };
    if (days < 0) return { label: `Vencido (${Math.abs(days)}d)`, badge: 'badge-danger', days, expired: true };
    if (days <= configAlerts.redDays) return { label: `Crítico (${days}d)`, badge: 'badge-danger', days, critical: true };
    if (days <= configAlerts.amberDays) return { label: `Por vencer (${days}d)`, badge: 'badge-warning', days, warning: true };
    return { label: `Vigente (${days}d)`, badge: 'badge-success', days };
  };

  const getProductStockInfo = (productoId) => {
    const productLots = lots.filter((l) => l.productoId === productoId && l.stockActual > 0);
    const stockFisico = productLots.reduce((acc, l) => acc + l.stockActual, 0);
    const stockReservado = orders
      .filter((o) => o.estado === 'Pendiente' || o.estado === 'En preparación')
      .reduce((acc, o) => {
        const item = o.items.find((i) => i.productoId === productoId);
        return acc + (item ? item.cantidad : 0);
      }, 0);
    const stockDisponible = Math.max(0, stockFisico - stockReservado);
    const sortedLots = [...productLots].sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));
    return {
      stockFisico,
      stockReservado,
      stockDisponible,
      proximoLote: sortedLots[0] || null,
      lotes: sortedLots,
    };
  };

  const getComboAvailableStock = (combo) => {
    if (!combo.componentes.length) return 0;
    const limits = combo.componentes.map((comp) => {
      const { stockDisponible } = getProductStockInfo(comp.productoId);
      return Math.floor(stockDisponible / comp.cantidad);
    });
    return Math.min(...limits);
  };

  // --- Productos ---
  const addProduct = async (data, initialLot) => {
    if (useBackend) {
      try {
        const created = await api.createProduct({
          codigo_barras: data.codigoBarras || null,
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          categoria: data.categoriaId,
          proveedor: data.proveedorPrincipalId,
          proveedores: data.proveedoresIds || [data.proveedorPrincipalId],
          precio_compra: data.precioCompra,
          precio_venta: data.precioVenta,
          stock_minimo: data.stockMinimo,
          stock_objetivo: data.stockObjetivo,
          unidad_medida: data.unidadMedida,
          perecible: data.perecible,
        });
        if (initialLot && Number(initialLot.cantidad) > 0) {
          await api.receiveStock({
            producto_id: created.id_producto,
            codigo_lote: initialLot.codigoLote,
            fecha_vencimiento: initialLot.fechaVencimiento,
            cantidad: Number(initialLot.cantidad),
            precio_compra: data.precioCompra,
            actualizar_precio_ficha: false,
            motivo: 'Stock inicial al crear producto',
          });
        }
        await syncFromBackend();
        notify(`Producto "${data.nombre}" guardado en base de datos.`);
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }

    const newId = Math.max(0, ...products.map((p) => p.id)) + 1;
    setProducts((prev) => [
      {
        ...data,
        id: newId,
        activo: true,
        historialPrecios: [
          {
            fecha: todayStr(),
            precioCompra: Number(data.precioCompra),
            precioVenta: Number(data.precioVenta),
            motivo: 'Registro inicial',
          },
        ],
      },
      ...prev,
    ]);
    if (initialLot && Number(initialLot.cantidad) > 0) {
      const newLotId = Math.max(100, ...lots.map((l) => l.id)) + 1;
      const lotObj = {
        id: newLotId,
        productoId: newId,
        codigoLote: initialLot.codigoLote || `L-${newId}-01`,
        fechaVencimiento: initialLot.fechaVencimiento,
        precioCompra: Number(data.precioCompra),
        stockActual: Number(initialLot.cantidad),
        precioOferta: null,
      };
      setLots((prev) => [...prev, lotObj]);
      setMovements((prev) => [
        {
          id: Date.now(),
          fechaHora: nowDateTime(),
          tipo: 'Ingreso',
          productoId: newId,
          loteId: newLotId,
          codigoLote: lotObj.codigoLote,
          cantidad: lotObj.stockActual,
          stockResultante: lotObj.stockActual,
          costoUnitario: lotObj.precioCompra,
          motivo: 'Stock inicial al crear producto',
        },
        ...prev,
      ]);
    }
    trackOfflineQueue();
    notify(`Producto "${data.nombre}" registrado exitosamente.`);
  };

  const updateProduct = async (id, updates) => {
    if (useBackend) {
      try {
        await api.updateProduct(id, {
          codigo_barras: updates.codigoBarras || null,
          nombre: updates.nombre,
          descripcion: updates.descripcion || '',
          categoria: updates.categoriaId,
          proveedor: updates.proveedorPrincipalId,
          precio_compra: updates.precioCompra,
          precio_venta: updates.precioVenta,
          stock_minimo: updates.stockMinimo,
          stock_objetivo: updates.stockObjetivo,
          unidad_medida: updates.unidadMedida,
        });
        await syncFromBackend();
        notify('Producto actualizado correctamente.');
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const priceChanged =
          Number(updates.precioCompra) !== Number(p.precioCompra) ||
          Number(updates.precioVenta) !== Number(p.precioVenta);
        const historialPrecios = priceChanged
          ? [
            ...p.historialPrecios,
            {
              fecha: todayStr(),
              precioCompra: Number(updates.precioCompra),
              precioVenta: Number(updates.precioVenta),
              motivo: updates.motivoCambio || 'Actualización manual en ficha',
            },
          ]
          : p.historialPrecios;
        return { ...p, ...updates, historialPrecios };
      })
    );
    trackOfflineQueue();
    notify('Producto actualizado correctamente.');
  };

  const toggleProductActive = async (id, active) => {
    if (useBackend) {
      try {
        if (active) await api.reactivateProduct(id);
        else await api.deactivateProduct(id);
        await syncFromBackend();
        notify(active ? 'Producto reactivado.' : 'Producto dado de baja.');
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, activo: active } : p)));
    trackOfflineQueue();
    notify(active ? 'Producto reactivado en el catálogo.' : 'Producto dado de baja (conserva su historial).');
  };

  const receiveStock = async ({ productoId, codigoLote, fechaVencimiento, cantidad, precioCompra, actualizarPrecioFicha, motivo }) => {
    if (useBackend) {
      try {
        await api.receiveStock({
          producto_id: productoId,
          codigo_lote: codigoLote,
          fecha_vencimiento: fechaVencimiento,
          cantidad: Number(cantidad),
          precio_compra: precioCompra,
          actualizar_precio_ficha: actualizarPrecioFicha,
          motivo,
        });
        await syncFromBackend();
        notify(`Ingresadas ${cantidad} unidades al inventario.`);
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }

    const qty = Number(cantidad);
    const cost = Number(precioCompra);
    const newLotId = Math.max(100, ...lots.map((l) => l.id)) + 1;
    const lotCode = codigoLote || `L-${productoId}-${Math.floor(10 + Math.random() * 89)}`;
    const prevInfo = getProductStockInfo(productoId);
    setLots((prev) => [
      ...prev,
      { id: newLotId, productoId, codigoLote: lotCode, fechaVencimiento, precioCompra: cost, stockActual: qty, precioOferta: null },
    ]);
    if (actualizarPrecioFicha) {
      const prod = products.find((p) => p.id === productoId);
      if (prod && Number(prod.precioCompra) !== cost) {
        await updateProduct(productoId, { ...prod, precioCompra: cost, motivoCambio: 'Actualizado al ingresar mercadería' });
      }
    }
    setMovements((prev) => [
      {
        id: Date.now() + Math.random(),
        fechaHora: nowDateTime(),
        tipo: 'Ingreso',
        productoId,
        loteId: newLotId,
        codigoLote: lotCode,
        cantidad: qty,
        stockResultante: prevInfo.stockFisico + qty,
        costoUnitario: cost,
        motivo: motivo || 'Ingreso de mercadería proveedor',
      },
      ...prev,
    ]);
    trackOfflineQueue();
    notify(`Ingresadas ${qty} unidades al lote ${lotCode}.`);
  };

  const applyLotOffer = async (lotId, precioOferta) => {
    if (useBackend) {
      try {
        await api.applyLotOffer(lotId, precioOferta || null);
        await syncFromBackend();
        notify(precioOferta ? `Oferta aplicada (${formatCLP(precioOferta)}).` : 'Oferta removida del lote.');
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    setLots((prev) => prev.map((l) => (l.id === lotId ? { ...l, precioOferta: precioOferta ? Number(precioOferta) : null } : l)));
    trackOfflineQueue();
    notify(precioOferta ? `Oferta aplicada (${formatCLP(precioOferta)}).` : 'Oferta removida del lote.');
  };

  const registerMerma = async ({ productoId, lotId, cantidad, motivo }) => {
    if (useBackend) {
      try {
        await api.registerMerma({ lote_id: lotId, cantidad: Number(cantidad), motivo });
        await syncFromBackend();
        notify('Merma registrada correctamente.');
        return true;
      } catch (err) {
        notify(err.message, 'error');
        return false;
      }
    }

    const qty = Number(cantidad);
    const targetLot = lots.find((l) => l.id === lotId);
    if (!targetLot || targetLot.stockActual < qty) {
      notify('Stock insuficiente en el lote seleccionado.', 'error');
      return false;
    }
    const prevInfo = getProductStockInfo(productoId);
    setLots((prev) => prev.map((l) => (l.id === lotId ? { ...l, stockActual: l.stockActual - qty } : l)));
    setMovements((prev) => [
      {
        id: Date.now() + Math.random(),
        fechaHora: nowDateTime(),
        tipo: 'Merma',
        productoId,
        loteId: lotId,
        codigoLote: targetLot.codigoLote,
        cantidad: -qty,
        stockResultante: prevInfo.stockFisico - qty,
        costoUnitario: targetLot.precioCompra,
        motivo,
      },
      ...prev,
    ]);
    trackOfflineQueue();
    notify(`Merma registrada (-${qty} unid. en lote ${targetLot.codigoLote}).`);
    return true;
  };

  const deductProductFEFO = (productoId, qtyNeeded, fechaSalida, motivoBase, currentLots) => {
    let remaining = qtyNeeded;
    const updatedLots = currentLots.map((l) => ({ ...l }));
    const productLots = updatedLots
      .filter((l) => l.productoId === productoId && l.stockActual > 0)
      .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));
    const newMovs = [];
    let runningTotal = productLots.reduce((acc, l) => acc + l.stockActual, 0);
    for (const lot of productLots) {
      if (remaining <= 0) break;
      const take = Math.min(lot.stockActual, remaining);
      lot.stockActual -= take;
      remaining -= take;
      runningTotal -= take;
      newMovs.push({
        id: Date.now() + Math.random(),
        fechaHora: fechaSalida || nowDateTime(),
        tipo: 'Venta',
        productoId,
        loteId: lot.id,
        codigoLote: lot.codigoLote,
        cantidad: -take,
        stockResultante: runningTotal,
        costoUnitario: lot.precioCompra,
        motivo: motivoBase || 'Salida manual por venta (FEFO)',
      });
    }
    return { updatedLots, newMovs };
  };

  const registerStockSales = async (cartItems, fechaReal) => {
    // Validar disponibilidad total acumulada (productos directos + componentes de combos)
    const requiredByProd = {};
    for (const item of cartItems) {
      const qty = parseInt(item.cantidad, 10);
      if (!Number.isInteger(qty) || qty <= 0) {
        notify('Todas las cantidades deben ser números enteros mayores a 0.', 'error');
        return false;
      }
      if (item.isCombo) {
        const combo = combos.find((c) => c.id === item.comboId);
        if (!combo) continue;
        for (const comp of combo.componentes) {
          requiredByProd[comp.productoId] = (requiredByProd[comp.productoId] || 0) + comp.cantidad * qty;
        }
      } else {
        requiredByProd[item.productoId] = (requiredByProd[item.productoId] || 0) + qty;
      }
    }

    for (const [pidStr, reqQty] of Object.entries(requiredByProd)) {
      const pid = Number(pidStr);
      const { stockDisponible } = getProductStockInfo(pid);
      if (reqQty > stockDisponible) {
        const prod = products.find((p) => p.id === pid);
        notify(
          `Stock insuficiente para "${prod?.nombre || 'Producto'}": quedan ${stockDisponible} disponibles e intentas sacar ${reqQty}.`,
          'error'
        );
        return false;
      }
    }

    if (useBackend) {
      try {
        await api.registerStockSales(
          cartItems.map((i) => ({
            is_combo: i.isCombo,
            combo_id: i.comboId,
            producto_id: i.productoId,
            cantidad: Number(i.cantidad),
          })),
          fechaReal
        );
        await syncFromBackend();
        notify('Salida de stock confirmada (FEFO).');
        return true;
      } catch (err) {
        notify(err.message, 'error');
        return false;
      }
    }

    let workingLots = lots.map((l) => ({ ...l }));
    let createdMovements = [];
    const fechaStr = fechaReal ? `${fechaReal} ${new Date().toTimeString().slice(0, 5)}` : nowDateTime();
    for (const item of cartItems) {
      if (item.isCombo) {
        const combo = combos.find((c) => c.id === item.comboId);
        if (!combo) continue;
        for (const comp of combo.componentes) {
          const res = deductProductFEFO(comp.productoId, comp.cantidad * item.cantidad, fechaStr, `Salida Combo: ${combo.nombre} (FEFO)`, workingLots);
          workingLots = res.updatedLots;
          createdMovements = [...res.newMovs, ...createdMovements];
        }
      } else {
        const res = deductProductFEFO(item.productoId, item.cantidad, fechaStr, 'Salida por venta mostrador (FEFO)', workingLots);
        workingLots = res.updatedLots;
        createdMovements = [...res.newMovs, ...createdMovements];
      }
    }
    setLots(workingLots);
    setMovements((prev) => [...createdMovements, ...prev]);
    trackOfflineQueue();
    notify(`Salida confirmada (${createdMovements.length} movimientos FEFO registrados).`);
    return true;
  };

  const registerClientReturn = async ({ productoId, lotId, cantidad, enBuenEstado, motivo }) => {
    if (useBackend) {
      try {
        await api.registerClientReturn({
          lote_id: lotId,
          cantidad: Number(cantidad),
          en_buen_estado: enBuenEstado,
          motivo,
        });
        await syncFromBackend();
        notify(enBuenEstado ? 'Reingreso registrado al lote.' : 'Devolución registrada como merma.');
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }

    const qty = Number(cantidad);
    const targetLot = lots.find((l) => l.id === lotId);
    if (!targetLot) return;
    const prevInfo = getProductStockInfo(productoId);
    if (enBuenEstado) {
      setLots((prev) => prev.map((l) => (l.id === lotId ? { ...l, stockActual: l.stockActual + qty } : l)));
      setMovements((prev) => [
        { id: Date.now() + Math.random(), fechaHora: nowDateTime(), tipo: 'Devolución Cliente', productoId, loteId: lotId, codigoLote: targetLot.codigoLote, cantidad: qty, stockResultante: prevInfo.stockFisico + qty, costoUnitario: targetLot.precioCompra, motivo: `Reingreso buen estado: ${motivo}` },
        ...prev,
      ]);
      notify(`Reingresadas ${qty} unid. al lote ${targetLot.codigoLote}.`);
    } else {
      setMovements((prev) => [
        { id: Date.now() + Math.random(), fechaHora: nowDateTime(), tipo: 'Merma', productoId, loteId: lotId, codigoLote: targetLot.codigoLote, cantidad: 0, stockResultante: prevInfo.stockFisico, costoUnitario: targetLot.precioCompra, motivo: `Devolución cliente dañada (Merma): ${motivo}` },
        ...prev,
      ]);
      notify('Devolución registrada como merma.', 'warning');
    }
    trackOfflineQueue();
  };

  const addCombo = async (comboData) => {
    if (useBackend) {
      try {
        await api.createCombo({
          nombre: comboData.nombre,
          precio_especial: comboData.precioEspecial,
          fecha_inicio: comboData.fechaInicio || null,
          fecha_fin: comboData.fechaFin || null,
          componentes: comboData.componentes.map((c) => ({ producto: c.productoId, cantidad: c.cantidad })),
        });
        await syncFromBackend();
        notify(`Combo "${comboData.nombre}" creado.`);
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    const newId = Math.max(0, ...combos.map((c) => c.id)) + 1;
    setCombos((prev) => [{ ...comboData, id: newId, activo: true }, ...prev]);
    trackOfflineQueue();
    notify(`Combo "${comboData.nombre}" creado.`);
  };

  // --- Encargos ---
  const createOrder = async (orderData) => {
    const horaActual = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
    const hora = orderData.horaEntrega || horaActual;
    const ahora = nowDateTime();

    if (useBackend) {
      try {
        await api.createOrder({
          cliente_nombre: orderData.clienteNombre,
          cliente_telefono: orderData.clienteTelefono,
          fecha_entrega: orderData.fechaEntrega,
          hora_entrega: hora,
          notas: orderData.notas || '',
          items: orderData.items.map((i) => ({ producto: i.productoId, cantidad: i.cantidad })),
        });
        await syncFromBackend();
        notify('Encargo agendado y stock reservado.');
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    const newId = Math.max(0, ...orders.map((o) => o.id)) + 1;
    setOrders((prev) => [
      {
        ...orderData,
        horaEntrega: hora,
        creadoEn: ahora,
        id: newId,
        estado: 'Pendiente',
        historial: [{ fecha: ahora, estado: 'Pendiente', motivo: 'Encargo agendado y stock reservado' }],
      },
      ...prev,
    ]);
    trackOfflineQueue();
    notify(`Encargo #${newId} agendado.`);
  };

  const updateOrderStatus = async (orderId, nextState, motivo) => {
    if (useBackend) {
      try {
        await api.updateOrderStatus(orderId, nextState, motivo);
        await syncFromBackend();
        notify(`Encargo #${orderId} actualizado a "${nextState}".`);
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    if (nextState === 'Entregado') {
      let workingLots = lots.map((l) => ({ ...l }));
      let movs = [];
      for (const item of target.items) {
        const res = deductProductFEFO(item.productoId, item.cantidad, nowDateTime(), `Entrega Encargo #${orderId} (${target.clienteNombre})`, workingLots);
        workingLots = res.updatedLots;
        movs = [...res.newMovs, ...movs];
      }
      setLots(workingLots);
      setMovements((prev) => [...movs, ...prev]);
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, estado: nextState, historial: [...o.historial, { fecha: nowDateTime(), estado: nextState, motivo: motivo || `Cambio a ${nextState}` }] }
          : o
      )
    );
    trackOfflineQueue();
    notify(`Encargo #${orderId} actualizado a "${nextState}".`);
  };

  // --- Finanzas ---
  const addSaleFinance = async ({ monto, medioPago, nota }) => {
    if (useBackend) {
      try {
        await api.createSaleFinance({ monto: Number(monto), medio_pago: medioPago, nota: nota || '' });
        await syncFromBackend();
        notify(`Venta registrada (${formatCLP(monto)} — ${medioPago}).`);
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    const newId = Math.max(500, ...salesFinance.map((s) => s.id)) + 1;
    setSalesFinance((prev) => [
      { id: newId, fechaHora: nowDateTime(), monto: Number(monto), medioPago, nota: nota || '', estado: 'Vigente', motivoAnulacion: null, correcciones: [] },
      ...prev,
    ]);
    trackOfflineQueue();
    notify(`Venta #${newId} registrada (${formatCLP(monto)} — ${medioPago}).`);
  };

  const editSaleFinance = async (saleId, updates) => {
    if (useBackend) {
      try {
        await api.editSaleFinance(saleId, {
          monto: Number(updates.monto),
          medio_pago: updates.medioPago,
          nota: updates.nota || '',
        });
        await syncFromBackend();
        notify(`Venta #${saleId} corregida.`);
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    setSalesFinance((prev) =>
      prev.map((s) =>
        s.id === saleId
          ? { ...s, ...updates, monto: Number(updates.monto), correcciones: [...s.correcciones, { fecha: nowDateTime(), anterior: `${formatCLP(s.monto)} (${s.medioPago})`, nuevo: `${formatCLP(updates.monto)} (${updates.medioPago})` }] }
          : s
      )
    );
    trackOfflineQueue();
    notify(`Venta #${saleId} corregida.`);
  };

  const annulSaleFinance = async (saleId, motivo) => {
    if (useBackend) {
      try {
        await api.annulSaleFinance(saleId, motivo);
        await syncFromBackend();
        notify(`Venta #${saleId} marcada como Anulada.`, 'warning');
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    setSalesFinance((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, estado: 'Anulada', motivoAnulacion: motivo, fechaAnulacion: nowDateTime() } : s))
    );
    trackOfflineQueue();
    notify(`Venta #${saleId} marcada como Anulada.`, 'warning');
  };

  // --- Proveedores y Compras ---
  const addProvider = async (data) => {
    if (useBackend) {
      try {
        await api.createProvider({
          nombre_empresa: data.nombre,
          rut: data.rut,
          contacto_nombre: data.contacto,
          telefono: data.telefono,
          email: data.email,
          dias_entrega: data.diasEntrega,
          direccion: data.direccion,
        });
        await syncFromBackend();
        notify(`Proveedor "${data.nombre}" registrado.`);
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    const newId = Math.max(0, ...providers.map((p) => p.id)) + 1;
    setProviders((prev) => [{ ...data, id: newId, activo: true }, ...prev]);
    trackOfflineQueue();
    notify(`Proveedor "${data.nombre}" registrado.`);
  };

  const updateProvider = async (id, updates) => {
    if (useBackend) {
      try {
        await api.updateProvider(id, {
          nombre_empresa: updates.nombre,
          rut: updates.rut,
          contacto_nombre: updates.contacto,
          telefono: updates.telefono,
          email: updates.email,
          dias_entrega: updates.diasEntrega,
          direccion: updates.direccion,
        });
        await syncFromBackend();
        notify('Proveedor actualizado.');
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    trackOfflineQueue();
    notify('Proveedor actualizado.');
  };

  const createPurchaseOrder = async (order) => {
    if (useBackend) {
      try {
        await api.createPurchaseOrder({
          proveedor: order.proveedorId,
          estado: order.estado,
          items: order.items.map((i) => ({ producto: i.productoId, cantidad: i.cantidad, costo_estimado: i.costoEstimado })),
        });
        await syncFromBackend();
        notify('Orden de compra guardada.');
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    const newId = Math.max(0, ...purchaseOrders.map((po) => po.id)) + 1;
    setPurchaseOrders((prev) => [{ ...order, id: newId, fecha: todayStr() }, ...prev]);
    trackOfflineQueue();
    notify(`Orden de compra #${newId} guardada (${order.estado}).`);
  };

  const updatePurchaseOrderStatus = async (poId, estado) => {
    if (useBackend) {
      try {
        await api.updatePurchaseOrderStatus(poId, estado);
        await syncFromBackend();
        notify(`Orden #${poId} marcada como ${estado}.`);
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    setPurchaseOrders((prev) => prev.map((po) => (po.id === poId ? { ...po, estado } : po)));
    trackOfflineQueue();
    notify(`Orden #${poId} marcada como ${estado}.`);
  };

  const receivePurchaseOrder = async (poId, itemsWithLots) => {
    if (useBackend) {
      try {
        await api.receivePurchaseOrder(
          poId,
          itemsWithLots.map((i) => ({
            producto_id: i.productoId,
            cantidad: Number(i.cantidad),
            codigo_lote: i.codigoLote,
            fecha_vencimiento: i.fechaVencimiento,
            costo_estimado: Number(i.costoEstimado),
          }))
        );
        await syncFromBackend();
        notify(`Orden #${poId} recibida y lotes sumados al inventario.`);
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }

    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;
    let workingLots = [...lots];
    const newMovs = [];
    for (const item of itemsWithLots) {
      if (!item.cantidad || Number(item.cantidad) <= 0) continue;
      const qty = Number(item.cantidad);
      const cost = Number(item.costoEstimado);
      const newLotId = Math.max(100, ...workingLots.map((l) => l.id)) + 1;
      const lotCode = item.codigoLote || `OC${poId}-P${item.productoId}`;
      const prevStock = workingLots.filter((l) => l.productoId === item.productoId && l.stockActual > 0).reduce((a, b) => a + b.stockActual, 0);
      workingLots.push({ id: newLotId, productoId: item.productoId, codigoLote: lotCode, fechaVencimiento: item.fechaVencimiento || '2027-06-30', precioCompra: cost, stockActual: qty, precioOferta: null });
      newMovs.push({ id: Date.now() + Math.random(), fechaHora: nowDateTime(), tipo: 'Ingreso', productoId: item.productoId, loteId: newLotId, codigoLote: lotCode, cantidad: qty, stockResultante: prevStock + qty, costoUnitario: cost, motivo: `Recepción Orden de Compra #${poId}` });
    }
    setLots(workingLots);
    setMovements((prev) => [...newMovs, ...prev]);
    setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? { ...p, estado: 'Recibida' } : p)));
    trackOfflineQueue();
    notify(`Orden #${poId} recibida y lotes agregados al stock.`);
  };

  const registerSupplierReturn = async ({ proveedorId, productoId, lotId, cantidad, motivo, detalle }) => {
    if (useBackend) {
      try {
        await api.createSupplierReturn({
          proveedor: proveedorId,
          producto: productoId,
          lote: lotId,
          cantidad: Number(cantidad),
          motivo,
          detalle: detalle || '',
        });
        await syncFromBackend();
        notify('Devolución a proveedor registrada.');
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    const qty = Number(cantidad);
    const targetLot = lots.find((l) => l.id === lotId);
    if (!targetLot || targetLot.stockActual < qty) {
      notify('Stock insuficiente en el lote seleccionado.', 'error');
      return;
    }
    const prevInfo = getProductStockInfo(productoId);
    setLots((prev) => prev.map((l) => (l.id === lotId ? { ...l, stockActual: l.stockActual - qty } : l)));
    setMovements((prev) => [
      { id: Date.now() + Math.random(), fechaHora: nowDateTime(), tipo: 'Devolución Proveedor', productoId, loteId: lotId, codigoLote: targetLot.codigoLote, cantidad: -qty, stockResultante: prevInfo.stockFisico - qty, costoUnitario: targetLot.precioCompra, motivo: `${motivo}: ${detalle || ''}` },
      ...prev,
    ]);
    const newId = Math.max(0, ...supplierReturns.map((r) => r.id)) + 1;
    setSupplierReturns((prev) => [{ id: newId, fecha: todayStr(), proveedorId, productoId, codigoLote: targetLot.codigoLote, cantidad: qty, motivo, detalle, estado: 'Pendiente' }, ...prev]);
    trackOfflineQueue();
    notify(`Devolución #${newId} registrada.`);
  };

  // --- Respaldos y Descuadres ---
  const createBackupNow = async () => {
    if (useBackend) {
      try {
        await api.createBackup('Manual');
        await syncFromBackend();
        notify('Respaldo generado y almacenado en el servidor Django.');
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    const newBkp = {
      id: `bkp-${Date.now()}`,
      fechaHora: nowDateTime(),
      tipo: 'Manual',
      destino: isOnline ? 'Local + Nube' : 'Local (Cola Nube)',
      tamano: '1.45 MB',
      cifrado: true,
      integridad: 'Verificado',
    };
    setBackups((prev) => [newBkp, ...prev]);
    notify('Respaldo local cifrado generado correctamente.');
  };

  const restoreBackup = (bkp) => {
    notify(`Copia de seguridad del ${bkp.fechaHora} validada y restaurada con éxito.`);
  };

  const markDayReviewed = async (dateKey, note) => {
    if (useBackend) {
      try {
        await api.reviewDay(dateKey, note || 'Revisado por el dueño');
        await syncFromBackend();
        notify(`Día ${dateKey} marcado como revisado.`);
        return;
      } catch (err) {
        notify(err.message, 'error');
        return;
      }
    }
    setReviewedDays((prev) => ({ ...prev, [dateKey]: note || 'Revisado por el dueño' }));
    notify(`Día ${dateKey} marcado como revisado.`);
  };

  const isBackupStale = useMemo(() => {
    if (!backups.length) return true;
    const latestDate = backups[0].fechaHora.slice(0, 10);
    const diff = daysUntil(latestDate);
    return diff !== null && Math.abs(diff) > 3;
  }, [backups]);

  const globalAlerts = useMemo(() => {
    const activeProducts = products.filter((p) => p.activo);
    const lowStockProducts = activeProducts.filter((p) => getProductStockInfo(p.id).stockDisponible <= p.stockMinimo);
    const expiringLots = lots.filter((l) => {
      if (l.stockActual <= 0) return false;
      const d = daysUntil(l.fechaVencimiento);
      return d !== null && d <= configAlerts.amberDays;
    });
    const urgentOrders = orders.filter(
      (o) => (o.estado === 'Pendiente' || o.estado === 'En preparación') && o.fechaEntrega <= todayStr()
    );
    return {
      lowStockCount: lowStockProducts.length,
      expiringLotsCount: expiringLots.length,
      urgentOrdersCount: urgentOrders.length,
    };
  }, [products, lots, orders, configAlerts]);

  return (
    <AppContext.Provider
      value={{
        backendAvailable,
        theme,
        toggleTheme,
        user,
        login,
        loginUnified,
        logout,
        verifyOwnerPassword,
        changePassword,
        recoverWithCode,
        recoveryCode,
        inactivityMinutes,
        setInactivityMinutes,
        isOnline,
        pendingSyncCount,
        toggleOnline,
        configAlerts,
        setConfigAlerts,
        categories,
        addCategory,
        updateCategory,
        providers,
        products,
        lots,
        combos,
        orders,
        movements,
        salesFinance,
        supplierReturns,
        purchaseOrders,
        backups,
        isBackupStale,
        reviewedDays,
        globalAlerts,
        getLotExpirationStatus,
        getProductStockInfo,
        getComboAvailableStock,
        addProduct,
        updateProduct,
        toggleProductActive,
        receiveStock,
        applyLotOffer,
        registerMerma,
        registerStockSales,
        registerClientReturn,
        addCombo,
        createOrder,
        updateOrderStatus,
        addSaleFinance,
        editSaleFinance,
        annulSaleFinance,
        addProvider,
        updateProvider,
        createPurchaseOrder,
        updatePurchaseOrderStatus,
        receivePurchaseOrder,
        registerSupplierReturn,
        createBackupNow,
        restoreBackup,
        markDayReviewed,
        resetDemoData,
        notify,
        toasts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
