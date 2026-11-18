import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Candy,
  Search,
  LogIn,
  LogOut,
  ShoppingBag,
  ShoppingCart,
  ShieldCheck,
  CalendarClock,
  Sun,
  Moon,
  Tag,
  Sparkles,
  CheckCircle2,
  Clock,
  Store,
  Plus,
  Minus,
  Trash2,
  X,
  UserPlus,
  Filter,
  ArrowUpDown,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';
import { useApp, formatCLP } from '../context/AppContext';
import {
  clienteApi,
  clearClienteSesion,
  getClienteDatos,
  getClienteToken,
} from '../clientes/clienteApi';

const CART_STORAGE_KEY = 'arteconfi_store_cart';

const CATEGORY_GRADIENTS = [
  { bg: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)', text: '#be123c' },
  { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', text: '#b45309' },
  { bg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', text: '#c2410c' },
  { bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', text: '#be185d' },
  { bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', text: '#6d28d9' },
  { bg: 'linear-gradient(135deg, #fae8ff 0%, #f5d0fe 100%)', text: '#a21caf' },
];

function getCategoryTheme(seed = 1) {
  const idx = Math.abs(Number(seed) || 0) % CATEGORY_GRADIENTS.length;
  return CATEGORY_GRADIENTS[idx];
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

function getTomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function TiendaPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    theme,
    toggleTheme,
    user,
    logout,
    backendAvailable,
    products,
    categories,
    lots,
    combos,
    getProductStockInfo,
    createOrder,
    notify,
  } = useApp();

  const [storeItems, setStoreItems] = useState([]);
  const [storeCombos, setStoreCombos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros y ordenamiento
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  // Cantidades seleccionadas en cada tarjeta antes de agregar
  const [cardQty, setCardQty] = useState({});

  // Sesión de cliente
  const [clienteToken, setClienteToken] = useState(getClienteToken());
  const [clienteData, setClienteData] = useState(getClienteDatos());

  // Carrito persistente ("Mi Pedido")
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  // Datos de agendamiento en el drawer del carrito
  const minFecha = useMemo(() => getTomorrowISO(), []);
  const [fechaEntrega, setFechaEntrega] = useState(() => getTomorrowISO());
  const [notasPedido, setNotasPedido] = useState('');
  const [cartError, setCartError] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    if (searchParams.get('carrito') === '1') {
      setCartOpen(true);
      searchParams.delete('carrito');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // noop
    }
  }, [cart]);

  const loadCatalog = async () => {
    if (backendAvailable) {
      try {
        const data = await clienteApi.tiendaPublica();
        if (Array.isArray(data)) {
          setStoreItems(data);
          setStoreCombos([]);
        } else {
          setStoreItems(data.productos || []);
          setStoreCombos(data.combos || []);
        }
        setLoading(false);
        return;
      } catch {
        // fallback a estado local
      }
    }

    const localItems = products
      .filter((p) => p.activo)
      .map((p) => {
        const cat = categories.find((c) => c.id === p.categoriaId);
        const info = getProductStockInfo(p.id);
        const offers = lots
          .filter((l) => l.productoId === p.id && l.stockActual > 0 && l.precioOferta)
          .map((l) => l.precioOferta);
        return {
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion || '',
          categoria: cat?.nombre || 'General',
          categoriaId: p.categoriaId,
          precio_venta: p.precioVenta,
          precio_oferta: offers.length ? Math.min(...offers) : null,
          unidad_medida: p.unidadMedida,
          imagen: p.imagen || '',
          disponible: info.stockDisponible,
          agotado: info.stockDisponible <= 0,
        };
      });

    const dispMap = Object.fromEntries(localItems.map((i) => [i.id, i]));
    const localCombos = (combos || [])
      .filter((c) => c.activo)
      .map((c) => {
        let precioNormal = 0;
        let maxCombos = null;
        const itemsList = (c.items || []).map((it) => {
          const prod = dispMap[it.productoId];
          const pVenta = prod ? prod.precio_venta : 0;
          const disp = prod ? prod.disponible : 0;
          precioNormal += pVenta * it.cantidad;
          const posibles = it.cantidad > 0 ? Math.floor(disp / it.cantidad) : 0;
          maxCombos = maxCombos === null ? posibles : Math.min(maxCombos, posibles);
          return {
            producto_id: it.productoId,
            nombre: prod?.nombre || 'Producto',
            cantidad: it.cantidad,
          };
        });
        const dispFinal = maxCombos || 0;
        return {
          id: c.id,
          nombre: c.nombre,
          descripcion: c.descripcion || '',
          precio_combo: c.precioCombo,
          precio_normal: precioNormal,
          ahorro: Math.max(0, precioNormal - c.precioCombo),
          disponible: dispFinal,
          agotado: dispFinal <= 0,
          items: itemsList,
        };
      });

    setStoreItems(localItems);
    setStoreCombos(localCombos);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) {
        await loadCatalog();
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendAvailable, products, categories, lots, combos]);

  const handleClienteLogout = async () => {
    try {
      await clienteApi.logout();
    } catch {
      // noop
    }
    clearClienteSesion();
    setClienteToken('');
    setClienteData(null);
    if (notify) notify('Sesión de cliente cerrada.', 'info');
  };

  const uniqueCats = useMemo(
    () => Array.from(new Set(storeItems.map((i) => i.categoria))).sort(),
    [storeItems]
  );

  const offersCount = useMemo(
    () => storeItems.filter((i) => i.precio_oferta && !i.agotado).length,
    [storeItems]
  );

  const availableCount = useMemo(
    () => storeItems.filter((i) => !i.agotado).length,
    [storeItems]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = storeItems.filter((item) => {
      const matchText =
        !q ||
        item.nombre.toLowerCase().includes(q) ||
        (item.descripcion || '').toLowerCase().includes(q) ||
        item.categoria.toLowerCase().includes(q);
      const matchCat = !selectedCat || item.categoria === selectedCat;
      const matchOffer = !onlyOffers || Boolean(item.precio_oferta);
      const matchStock = !hideOutOfStock || !item.agotado;
      return matchText && matchCat && matchOffer && matchStock;
    });

    return [...list].sort((a, b) => {
      // Siempre mostrar con stock antes que agotados salvo que se ordene explícitamente
      if (a.agotado !== b.agotado && sortBy === 'featured') {
        return a.agotado ? 1 : -1;
      }
      const priceA = Number(a.precio_oferta || a.precio_venta || 0);
      const priceB = Number(b.precio_oferta || b.precio_venta || 0);

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'name_asc') return a.nombre.localeCompare(b.nombre);

      // 'featured': ofertas primero, luego nombre
      const hasOfferA = Boolean(a.precio_oferta);
      const hasOfferB = Boolean(b.precio_oferta);
      if (hasOfferA !== hasOfferB) return hasOfferA ? -1 : 1;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [storeItems, search, selectedCat, onlyOffers, hideOutOfStock, sortBy]);

  // Helpers de cantidad y carrito (respetando límite estricto de stock disponible)
  const getStepQty = (item) => {
    const inCart = Number(cart[item.id] || 0);
    const maxAddable = Math.max(0, item.disponible - inCart);
    if (maxAddable <= 0) return 0;
    const current = Number(cardQty[item.id] || 1);
    return Math.min(Math.max(1, current), maxAddable);
  };

  const changeCardQty = (item, delta) => {
    const inCart = Number(cart[item.id] || 0);
    const maxAddable = Math.max(0, item.disponible - inCart);
    if (maxAddable <= 0) return;
    const current = getStepQty(item);
    const next = Math.min(Math.max(1, current + delta), maxAddable);
    setCardQty((prev) => ({ ...prev, [item.id]: next }));
  };

  const addToCart = (item, qtyToAdd = 1) => {
    if (item.agotado || item.disponible <= 0) return;
    const currentInCart = Number(cart[item.id] || 0);
    const nextQty = Math.min(item.disponible, currentInCart + qtyToAdd);
    if (nextQty <= currentInCart) {
      if (notify) {
        notify(`Ya alcanzaste el máximo disponible (${item.disponible}) de ${item.nombre}.`, 'warning');
      }
      return;
    }
    setCart((prev) => ({ ...prev, [item.id]: nextQty }));
    setCardQty((prev) => ({ ...prev, [item.id]: 1 }));
    if (notify) {
      notify(`${qtyToAdd} × ${item.nombre} agregado a tu pedido.`);
    }
  };

  const addComboToCart = (combo) => {
    if (combo.agotado) return;
    const nextCart = { ...cart };
    for (const it of combo.items) {
      const prod = storeItems.find((p) => p.id === it.producto_id);
      if (!prod) continue;
      const current = Number(nextCart[prod.id] || 0);
      if (current + it.cantidad > prod.disponible) {
        if (notify) {
          notify(
            `Stock insuficiente de "${prod.nombre}" para agregar otro pack (disponible: ${prod.disponible}).`,
            'warning'
          );
        }
        return;
      }
      nextCart[prod.id] = current + it.cantidad;
    }
    setCart(nextCart);
    setCartOpen(true);
    if (notify) {
      notify(`Pack "${combo.nombre}" agregado a tu pedido.`);
    }
  };

  const updateCartItemQty = (productId, newQty) => {
    const prod = storeItems.find((p) => p.id === Number(productId));
    const maxDisp = prod ? prod.disponible : 0;
    const clamped = Math.max(0, Math.min(Number(newQty) || 0, maxDisp));
    setCart((prev) => {
      const copy = { ...prev };
      if (clamped <= 0) {
        delete copy[productId];
      } else {
        copy[productId] = clamped;
      }
      return copy;
    });
  };

  const clearCart = () => {
    setCart({});
    setCartError('');
  };

  // Lista detallada del carrito sincronizada con el catálogo actual
  const cartDetails = useMemo(() => {
    const list = [];
    for (const [idStr, qty] of Object.entries(cart)) {
      const prod = storeItems.find((p) => p.id === Number(idStr));
      if (!prod || qty <= 0) continue;
      const validQty = Math.min(Number(qty), prod.disponible);
      if (validQty <= 0) continue;
      const unitPrice = Number(prod.precio_oferta || prod.precio_venta || 0);
      list.push({
        product: prod,
        qty: validQty,
        unitPrice,
        subtotal: unitPrice * validQty,
      });
    }
    return list;
  }, [cart, storeItems]);

  const totalCartUnits = useMemo(
    () => cartDetails.reduce((acc, it) => acc + it.qty, 0),
    [cartDetails]
  );

  const totalCartAmount = useMemo(
    () => cartDetails.reduce((acc, it) => acc + it.subtotal, 0),
    [cartDetails]
  );

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setCartError('');

    if (cartDetails.length === 0) {
      setCartError('Agrega al menos un producto a tu pedido.');
      return;
    }
    if (!fechaEntrega || fechaEntrega < minFecha) {
      setCartError('La fecha de entrega debe ser desde mañana en adelante.');
      return;
    }

    if (!clienteToken) {
      navigate('/login?next=tienda');
      return;
    }

    setSubmittingOrder(true);
    const horaRegistro = new Date().toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    try {
      if (backendAvailable) {
        await clienteApi.crearEncargo({
          fecha_entrega: fechaEntrega,
          hora_entrega: horaRegistro,
          notas: notasPedido,
          items: cartDetails.map((it) => ({
            producto_id: it.product.id,
            cantidad: it.qty,
          })),
        });
      } else {
        const res = createOrder({
          clienteNombre: clienteData?.nombre || 'Cliente Tienda',
          clienteTelefono: clienteData?.telefono || '',
          fechaEntrega,
          horaEntrega: horaRegistro,
          notas: notasPedido,
          items: cartDetails.map((it) => ({
            productoId: it.product.id,
            cantidad: it.qty,
            precioUnitario: it.unitPrice,
          })),
        });
        if (res && !res.ok && res.error) {
          throw new Error(res.error);
        }
      }

      clearCart();
      setCartOpen(false);
      await loadCatalog();
      if (notify) {
        notify('¡Encargo reservado con éxito! Puedes revisar su estado en tu panel.');
      }
      navigate('/cliente', {
        state: { mensaje: '¡Encargo reservado con éxito! La confitería preparará tu pedido.' },
      });
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearClienteSesion();
        setClienteToken('');
        setClienteData(null);
        navigate('/login?next=tienda');
        return;
      }
      setCartError(err.message || 'No fue posible registrar el encargo.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Barra superior: Título a la izquierda, Iniciar Sesión / Carrito / Tema a la derecha */}
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
                  Tienda & Encargos en Línea
                </span>
              </div>
            </Link>
          </div>

          <div className="topbar-right" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-outline btn-sm"
              title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            <button
              type="button"
              className={`btn btn-sm ${totalCartUnits > 0 ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCartOpen(true)}
              title="Ver mi pedido de encargo"
            >
              <ShoppingCart size={15} />
              <span className="hide-on-mobile">Mi Pedido</span>
              {totalCartUnits > 0 && (
                <span
                  style={{
                    background: '#ffffff',
                    color: '#be123c',
                    borderRadius: 999,
                    padding: '0.05rem 0.45rem',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                  }}
                >
                  {totalCartUnits}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex-center" style={{ gap: '0.45rem' }}>
                <Link to="/admin-panel" className="btn btn-primary btn-sm">
                  <ShieldCheck size={15} /> <span className="hide-on-mobile">Panel Admin</span>
                </Link>
                <button type="button" className="btn btn-outline btn-sm" onClick={logout} title="Salir">
                  <LogOut size={14} /> <span className="hide-on-mobile">Salir</span>
                </button>
              </div>
            ) : clienteToken ? (
              <div className="flex-center" style={{ gap: '0.45rem' }}>
                <Link to="/cliente" className="btn btn-primary btn-sm">
                  <CalendarClock size={15} /> <span className="hide-on-mobile">Mis Encargos</span>
                </Link>
                <button type="button" className="btn btn-outline btn-sm" onClick={handleClienteLogout} title="Salir">
                  <LogOut size={14} /> <span className="hide-on-mobile">Salir</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">
                <LogIn size={15} /> <span>Iniciar Sesión</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="page-content" style={{ width: '100%', maxWidth: '100%', flex: 1, padding: '1.25rem clamp(1rem, 2.5vw, 2.5rem)', boxSizing: 'border-box' }}>
        {/* Hero Tienda Mejorado */}
        <div
          className="card mb-3"
          style={{
            background: 'var(--primary-gradient)',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 10px 26px rgba(225, 29, 72, 0.25)',
            width: '100%',
          }}
        >
          <div
            className="card-body"
            style={{ padding: '2rem clamp(1.25rem, 3vw, 2.5rem)' }}
          >
            <div style={{ maxWidth: 960 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255,255,255,0.18)',
                  padding: '0.25rem 0.7rem',
                  borderRadius: 999,
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  marginBottom: '0.55rem',
                }}
              >
                <Sparkles size={13} /> Tienda Oficial y Reserva de Encargos
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 2.8vw, 1.9rem)', fontWeight: 800, letterSpacing: '-0.4px' }}>
                Catálogo de Confitería y Encargos en Línea
              </h1>
              <p style={{ margin: '0.45rem 0 0', opacity: 0.94, fontSize: '0.98rem', lineHeight: 1.5 }}>
                Revisa nuestra disponibilidad en tiempo real, arma tu canasto de productos y agenda el
                día y hora para retirar tu pedido en tienda.
              </p>

              <div className="trust-pills">
                <span className="trust-pill">
                  <CheckCircle2 size={14} /> {availableCount} productos con stock hoy
                </span>
                <span className="trust-pill">
                  <Clock size={14} /> Reserva online sin pago anticipado
                </span>
                <span className="trust-pill">
                  <Store size={14} /> Retiro programado en local
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección Destacada: Combos y Packs Especiales */}
        {storeCombos.filter((c) => (c.items?.length > 0) && Number(c.precio_combo) > 0).length > 0 && (
          <div className="mb-3">
            <div className="flex-between mb-2">
              <div className="flex-center" style={{ gap: 8 }}>
                <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800 }}>
                  Packs y Combos Promocionales
                </h2>
              </div>
              <span className="small text-muted">Ahorra llevando nuestros packs armados</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1rem',
              }}
            >
              {storeCombos
                .filter((c) => (c.items?.length > 0) && Number(c.precio_combo) > 0)
                .map((combo) => (
                  <div
                    key={combo.id}
                    className="card"
                    style={{
                      border: '1px solid rgba(225, 29, 72, 0.25)',
                      background:
                        theme === 'light'
                          ? 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)'
                          : 'var(--bg-surface)',
                      opacity: combo.agotado ? 0.75 : 1,
                    }}
                  >
                    <div className="card-body" style={{ padding: '1.05rem 1.2rem' }}>
                      <div className="flex-between mb-1">
                        <span className="badge badge-info">
                          <Sparkles size={11} /> Pack Promocional
                        </span>
                        {combo.agotado ? (
                          <span className="badge badge-danger">Agotado</span>
                        ) : (
                          <span className="badge badge-success">
                            Disponible: {combo.disponible} pack{combo.disponible === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>

                      <h3 style={{ margin: '0.35rem 0 0.2rem', fontSize: '1.02rem', fontWeight: 800 }}>
                        {combo.nombre}
                      </h3>
                      {combo.descripcion && (
                        <p className="small text-muted" style={{ margin: '0 0 0.55rem' }}>
                          {combo.descripcion}
                        </p>
                      )}

                      <div
                        style={{
                          background: 'var(--bg-muted)',
                          borderRadius: 8,
                          padding: '0.5rem 0.7rem',
                          fontSize: '0.78rem',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <strong className="text-muted">Incluye:</strong>{' '}
                        {combo.items.map((it) => `${it.cantidad}× ${it.nombre}`).join(' + ')}
                      </div>

                      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', marginTop: '0.5rem' }}>
                        <div>
                          <div
                            className="fw-bold"
                            style={{ fontSize: '1.2rem', color: 'var(--primary)', lineHeight: 1.1 }}
                          >
                            {formatCLP(combo.precio_combo)}
                          </div>
                          {combo.precio_normal > combo.precio_combo && (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: 2, flexWrap: 'wrap' }}>
                              <span
                                className="small text-muted"
                                style={{ textDecoration: 'line-through', fontSize: '0.78rem' }}
                              >
                                {formatCLP(combo.precio_normal)}
                              </span>
                              <span className="small text-success fw-bold" style={{ fontSize: '0.74rem' }}>
                                Ahorras {formatCLP(combo.ahorro)}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={combo.agotado}
                          onClick={() => addComboToCart(combo)}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <ShoppingBag size={14} />{' '}
                          {combo.agotado ? 'Sin Stock' : 'Agregar Pack'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Barra de Búsqueda, Categorías, Filtros Rápidos y Ordenamiento */}
        <div className="card mb-3">
          <div className="card-body" style={{ padding: '1rem 1.2rem' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.8rem',
              }}
            >
              <div className="input-icon-wrap" style={{ flex: '1 1 280px' }}>
                <Search size={16} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar chocolates, gomitas, alfajores, frutos secos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex-center" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${onlyOffers ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setOnlyOffers((v) => !v)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Tag size={14} /> Solo Ofertas
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${hideOutOfStock ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setHideOutOfStock((v) => !v)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Filter size={14} /> Ocultar agotados
                </button>

                <div className="flex-center" style={{ gap: 6, flexWrap: 'nowrap' }}>
                  <ArrowUpDown size={14} className="text-muted" style={{ flexShrink: 0 }} />
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: '0.35rem 2rem 0.35rem 0.65rem', fontSize: '0.82rem' }}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="featured">Destacados y Ofertas</option>
                    <option value="price_asc">Precio: Menor a Mayor</option>
                    <option value="price_desc">Precio: Mayor a Menor</option>
                    <option value="name_asc">Nombre: A - Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Píldoras de Categorías */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
              <button
                type="button"
                className={`btn btn-sm ${selectedCat === '' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedCat('')}
                style={{ whiteSpace: 'nowrap' }}
              >
                Todas ({storeItems.length})
              </button>
              {uniqueCats.map((cat) => {
                const count = storeItems.filter((i) => i.categoria === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`btn btn-sm ${selectedCat === cat ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSelectedCat(cat)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grilla E-Commerce de Productos */}
        {loading ? (
          <div className="card">
            <div className="empty-state">Cargando catálogo de la tienda...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <p style={{ margin: '0 0 0.6rem' }}>
                No se encontraron productos con los filtros seleccionados.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('');
                  setSelectedCat('');
                  setOnlyOffers(false);
                  setHideOutOfStock(false);
                }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        ) : (
          <div className="store-grid">
            {filtered.map((item) => {
              const catTheme = getCategoryTheme(item.categoriaId || item.id);
              const inCartQty = Number(cart[item.id] || 0);
              const stepQty = getStepQty(item);
              const maxReached = !item.agotado && inCartQty >= item.disponible;
              const discountPct =
                item.precio_oferta && item.precio_venta > item.precio_oferta
                  ? Math.round(((item.precio_venta - item.precio_oferta) / item.precio_venta) * 100)
                  : null;

              return (
                <div
                  key={item.id}
                  className={`store-card ${item.agotado ? 'out-of-stock' : ''}`}
                >
                  {/* Cabecera Visual E-Commerce */}
                  <div
                    className="store-card-media"
                    style={{ background: catTheme.bg, color: catTheme.text }}
                  >
                    <div className="store-card-badges">
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(255,255,255,0.92)',
                          color: '#0f172a',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                        }}
                      >
                        {item.categoria}
                      </span>

                      {item.agotado ? (
                        <span className="badge badge-danger" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
                          Agotado
                        </span>
                      ) : (
                        <span
                          className="badge badge-success"
                          style={{
                            background: 'rgba(255,255,255,0.94)',
                            color: '#047857',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                          }}
                        >
                          Disponible: {item.disponible} {item.unidad_medida}
                        </span>
                      )}
                    </div>

                    {item.imagen ? (
                      <img src={item.imagen} alt={item.nombre} />
                    ) : (
                      <div
                        style={{
                          width: 68,
                          height: 68,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.65)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.45rem',
                          fontWeight: 800,
                          color: catTheme.text,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        }}
                      >
                        {getInitials(item.nombre)}
                      </div>
                    )}

                    {discountPct && (
                      <div className="store-card-offer-tag">
                        <Tag size={11} /> -{discountPct}% OFERTA
                      </div>
                    )}
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className="store-card-body">
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>
                      {item.nombre}
                    </h3>
                    {item.descripcion ? (
                      <p className="small text-muted" style={{ margin: 0, lineHeight: 1.4 }}>
                        {item.descripcion}
                      </p>
                    ) : (
                      <p className="small text-muted" style={{ margin: 0 }}>
                        Formato de venta por {item.unidad_medida.toLowerCase()}.
                      </p>
                    )}

                    {inCartQty > 0 && (
                      <div
                        className="small fw-bold"
                        style={{
                          color: 'var(--primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 'auto',
                        }}
                      >
                        <PackageCheck size={14} /> En tu pedido: {inCartQty} {item.unidad_medida}
                      </div>
                    )}
                  </div>

                  {/* Pie con Precio, Selector de Cantidad y Botón Agregar Responsivos */}
                  <div className="store-card-footer">
                    <div className="store-card-price-row">
                      <div>
                        {item.precio_oferta ? (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span
                              className="fw-bold"
                              style={{ fontSize: '1.2rem', color: 'var(--primary)', lineHeight: 1.1 }}
                            >
                              {formatCLP(item.precio_oferta)}
                            </span>
                            <span
                              className="small text-muted"
                              style={{ textDecoration: 'line-through', fontSize: '0.78rem' }}
                            >
                              {formatCLP(item.precio_venta)}
                            </span>
                          </div>
                        ) : (
                          <div className="fw-bold" style={{ fontSize: '1.2rem', color: 'var(--text-main)', lineHeight: 1.1 }}>
                            {formatCLP(item.precio_venta)}
                          </div>
                        )}
                        <span className="small text-muted" style={{ fontSize: '0.74rem' }}>
                          por {item.unidad_medida.toLowerCase()}
                        </span>
                      </div>

                      {inCartQty > 0 && (
                        <span
                          className="badge"
                          style={{
                            background: 'var(--primary-soft)',
                            color: 'var(--primary)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 6,
                          }}
                        >
                          {inCartQty} en pedido
                        </span>
                      )}
                    </div>

                    <div className="store-card-actions">
                      {item.agotado ? (
                        <button type="button" className="btn btn-outline btn-sm btn-status-full" disabled>
                          Agotado
                        </button>
                      ) : maxReached ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-status-full"
                          onClick={() => setCartOpen(true)}
                        >
                          Máx. en pedido ({inCartQty})
                        </button>
                      ) : (
                        <>
                          <div className="qty-stepper">
                            <button
                              type="button"
                              onClick={() => changeCardQty(item, -1)}
                              disabled={stepQty <= 1}
                              title="Disminuir cantidad"
                            >
                              <Minus size={13} />
                            </button>
                            <span>{stepQty}</span>
                            <button
                              type="button"
                              onClick={() => changeCardQty(item, 1)}
                              disabled={stepQty >= item.disponible - inCartQty}
                              title="Aumentar cantidad"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm btn-add-cart"
                            onClick={() => addToCart(item, stepQty)}
                          >
                            <ShoppingBag size={14} /> <span>Encargar</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Informativo de la Tienda */}
        <footer className="store-footer">
          <div>
            <div className="flex-center" style={{ gap: 8, marginBottom: 4 }}>
              <Candy size={18} style={{ color: 'var(--primary)' }} />
              <strong style={{ color: 'var(--text-primary)' }}>Confitería Arteconfi</strong>
            </div>
            <span>
              Catálogo en línea sincronizado con inventario FEFO y control de stock en tiempo real.
            </span>
          </div>
          <div className="flex-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <span>Horario de atención: Lun a Sáb 09:30 - 20:00 hrs</span>

          </div>
        </footer>
      </main>

      {/* Drawer Lateral: Carrito de Encargos ("Mi Pedido") */}
      {cartOpen && (
        <div
          className="modal-backdrop"
          style={{ justifyContent: 'flex-end', padding: 0 }}
          onClick={() => setCartOpen(false)}
        >
          <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex-center" style={{ gap: 8 }}>
                <ShoppingCart size={19} style={{ color: 'var(--primary)' }} />
                <h3 className="modal-title">Mi Pedido de Encargo</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setCartOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
              {cartDetails.length === 0 ? (
                <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                  <ShoppingBag
                    size={36}
                    style={{ color: 'var(--text-muted)', marginBottom: '0.6rem', opacity: 0.6 }}
                  />
                  <p style={{ margin: 0, fontWeight: 600 }}>Tu canasto de encargo está vacío</p>
                  <p className="small text-muted mt-1">
                    Selecciona productos del catálogo para armar y agendar tu pedido.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex-between mb-2">
                    <span className="small text-muted fw-bold">
                      {cartDetails.length} producto{cartDetails.length === 1 ? '' : 's'} ({totalCartUnits}{' '}
                      unidades)
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-danger"
                      onClick={clearCart}
                    >
                      <Trash2 size={13} /> Vaciar pedido
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.2rem' }}>
                    {cartDetails.map(({ product, qty, unitPrice, subtotal }) => (
                      <div
                        key={product.id}
                        style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: 10,
                          padding: '0.75rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                            {product.nombre}
                          </div>
                          <div className="small text-muted">
                            {formatCLP(unitPrice)} c/u · Máx disp: {product.disponible}
                          </div>
                          <div className="fw-bold mt-1" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
                            {formatCLP(subtotal)}
                          </div>
                        </div>

                        <div className="flex-center" style={{ gap: '0.4rem' }}>
                          <div className="qty-stepper">
                            <button
                              type="button"
                              onClick={() => updateCartItemQty(product.id, qty - 1)}
                              title="Quitar 1"
                            >
                              <Minus size={12} />
                            </button>
                            <span>{qty}</span>
                            <button
                              type="button"
                              onClick={() => updateCartItemQty(product.id, qty + 1)}
                              disabled={qty >= product.disponible}
                              title="Sumar 1"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-danger"
                            onClick={() => updateCartItemQty(product.id, 0)}
                            title="Eliminar producto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Formulario de Fecha de Retiro */}
                  <form id="cart-order-form" onSubmit={handleConfirmOrder}>
                    <div
                      style={{
                        background: 'var(--bg-muted)',
                        borderRadius: 10,
                        padding: '0.95rem',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div className="flex-between" style={{ marginBottom: '0.65rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                          Datos de Retiro en Tienda
                        </h4>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 6,
                            background: 'var(--primary-soft)',
                            color: 'var(--primary)',
                            fontWeight: 700,
                          }}
                        >
                          📅 Retiro en Local
                        </span>
                      </div>

                      <div className="form-group mb-2">
                        <label className="form-label" style={{ fontWeight: 600 }}>Fecha de Retiro *</label>
                        <input
                          type="date"
                          className="form-control"
                          min={minFecha}
                          value={fechaEntrega}
                          onChange={(e) => setFechaEntrega(e.target.value)}
                          required
                        />
                        <span className="small text-muted" style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.74rem' }}>
                          Aceptamos reservas desde mañana en adelante.
                        </span>
                      </div>

                      <div
                        style={{
                          background: 'var(--surface)',
                          borderRadius: 8,
                          padding: '0.6rem 0.75rem',
                          border: '1px dashed var(--border)',
                          marginBottom: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <Clock size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span>
                          <strong>Registro del encargo:</strong> Se guardará automáticamente con el día y la hora de confirmación de hoy.
                        </span>
                      </div>

                      <div className="form-group mb-0">
                        <label className="form-label">Notas o Indicaciones (opcional)</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          placeholder="Ej: Envolver para regalo, retiro por la tarde..."
                          value={notasPedido}
                          onChange={(e) => setNotasPedido(e.target.value)}
                        />
                      </div>
                    </div>
                  </form>

                  {cartError && (
                    <div className="alert-box danger mt-3">
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{cartError}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {cartDetails.length > 0 && (
              <div
                className="modal-footer"
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.65rem' }}
              >
                <div className="flex-between" style={{ fontSize: '1.08rem', fontWeight: 800 }}>
                  <span>Total Estimado a Pagar en Retiro</span>
                  <span style={{ color: 'var(--primary)', fontSize: '1.22rem' }}>
                    {formatCLP(totalCartAmount)}
                  </span>
                </div>

                {clienteToken ? (
                  <button
                    type="submit"
                    form="cart-order-form"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    disabled={submittingOrder}
                  >
                    <CalendarClock size={17} />
                    {submittingOrder ? 'Confirmando encargo...' : 'Confirmar y Agendar Encargo'}
                  </button>
                ) : user ? (
                  <Link
                    to="/admin-panel/encargos"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', textAlign: 'center' }}
                  >
                    <ShieldCheck size={16} /> Gestionar Encargos en Panel Admin
                  </Link>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div className="small text-muted text-center">
                      Para confirmar tu reserva, ingresa con tu cuenta de cliente o regístrate en 1 paso (tu pedido se mantendrá guardado):
                    </div>
                    <div className="flex-center" style={{ gap: '0.5rem' }}>
                      <Link
                        to="/login?next=tienda"
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                      >
                        <LogIn size={15} /> Iniciar Sesión
                      </Link>
                      <Link
                        to="/login?tab=registro&next=tienda"
                        className="btn btn-outline"
                        style={{ flex: 1 }}
                      >
                        <UserPlus size={15} /> Crear Cuenta
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
