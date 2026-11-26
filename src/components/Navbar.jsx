import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  Calendar,
  Heart,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  Menu,
  X,
  ChevronDown,
  Scissors,
  User,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Moon,
  Sun,
  Bell,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AdminAuthContext'
import { useCustomer } from '../context/CustomerAuthContext'
import { useCart } from '../context/CartContext'
import { ROLE_BADGES, formatCurrency, getUniqueItemFallbackImage } from '../lib/utils'
import { ProductRepository } from '../repositories/ProductRepository'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { SalesRepository } from '../repositories/SalesRepository'
import { syncService } from '../services/syncService'

const ROLE_SHORT = {
  ADMINISTRADOR: 'Administración',
  VENDEDOR: 'Recepción',
  ESTILISTA: 'Estilista',
  CONSULTA: 'Cliente',
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 group">
      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#111111] flex items-center justify-center text-[#D4AF37] ring-1 ring-[#D4AF37]/60 group-hover:ring-[#D4AF37] transition">
        <Scissors className="w-4 h-4" />
      </div>
      <div className="leading-none whitespace-nowrap">
        <span className="font-serif-luxury text-[20px] sm:text-[26px] font-bold tracking-wide text-[#111111]">
          Glam<span className="text-[#D4AF37] italic font-medium">Studio</span>
        </span>
        <span className="block text-[8px] sm:text-[9px] uppercase tracking-[0.28em] text-stone-400 mt-0.5">
          Haute Coiffure
        </span>
      </div>
    </Link>
  )
}

export function Navbar() {
  const {
    user,
    role,
    isAuthenticated,
    loginWithCredentials,
    logout,
    isLoginModalOpen,
    setIsLoginModalOpen,
  } = useAuth()
  const { favorites } = useCustomer()
  const {
    carts,
    shopItems,
    shopCount,
    shopTotal,
    updateShopQty,
    removeFromShop,
    clearShop,
    isShopOpen,
    setIsShopOpen,
  } = useCart()
  const isStaff = isAuthenticated && (role === 'ADMINISTRADOR' || role === 'VENDEDOR')
  const [checkingOut, setCheckingOut] = useState(false)
  const [pendingCartAction, setPendingCartAction] = useState(null)

  const confirmCartAction = () => {
    if (pendingCartAction?.type === 'remove') {
      removeFromShop(pendingCartAction.item.id)
      toast.success(`${pendingCartAction.item.name} eliminado del carrito`)
    } else if (pendingCartAction?.type === 'clear') {
      clearShop()
      toast.success('Carrito vaciado')
    }
    setPendingCartAction(null)
  }

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setIsShopOpen(false)
      setIsLoginModalOpen(true)
      toast.info('Inicia sesión para finalizar tu compra')
      return
    }
    setCheckingOut(true)
    try {
      const sale = await SalesRepository.createSale({
        customerName: user?.name || 'Cliente online',
        paymentMethod: 'Transferencia / QR',
        cashierEmail: 'tienda-online',
        items: shopItems.map((i) => ({
          id: i.id,
          type: 'product',
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          commissionPct: 0,
        })),
      })
      clearShop()
      setIsShopOpen(false)
      toast.success('¡Compra confirmada!', {
        description: `Pedido ${sale.ticketNumber} · Retíralo en el salón.`,
      })
    } catch (err) {
      toast.error(err.message || 'No se pudo procesar la compra')
    } finally {
      setCheckingOut(false)
    }
  }
  const location = useLocation()

  const [emailInput, setEmailInput] = useState('')
  const [passInput, setPassInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifMenuOpen, setNotifMenuOpen] = useState(false)
  const [staffNotifications, setStaffNotifications] = useState([])
  const userMenuRef = useRef(null)
  const notifMenuRef = useRef(null)

  const isSalonTeam =
    isAuthenticated &&
    (role === 'ADMINISTRADOR' || role === 'VENDEDOR' || role === 'ESTILISTA')

  const loadNotifications = () => {
    setStaffNotifications(AppointmentRepository.getStaffNotifications())
  }

  useEffect(() => {
    loadNotifications()
    return syncService.subscribe((payload) => {
      loadNotifications()
      if (
        payload?.channel === 'appointments' &&
        payload?.action === 'create' &&
        isSalonTeam &&
        payload?.data
      ) {
        const apt = payload.data
        toast.success(`🔔 Nueva reserva recibida: ${apt.customerName}`, {
          description: `${apt.serviceName} con ${apt.employeeName} (${apt.date} · ${apt.startTime} hs)`,
        })
      }
    })
  }, [isSalonTeam])

  const unreadNotifs = staffNotifications.filter(
    (n) => !Array.isArray(n.readByRoles) || !n.readByRoles.includes(role)
  )

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('glamstudio_theme_mode') === 'dark'
    } catch (e) {
      return false
    }
  })

  useEffect(() => {
    const rootEl = document.documentElement
    if (isDarkMode) {
      rootEl.classList.add('dark')
    } else {
      rootEl.classList.remove('dark')
    }
    try {
      localStorage.setItem('glamstudio_theme_mode', isDarkMode ? 'dark' : 'light')
    } catch (e) {
      // ignore
    }
  }, [isDarkMode])

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev)

  useEffect(() => {
    const load = async () => {
      const products = await ProductRepository.getAllProducts()
      setLowStockCount(
        products.filter((p) => Number(p.stock) <= Number(p.minStock || 4)).length
      )
    }
    load()
    return syncService.subscribe(load)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotifMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
    setNotifMenuOpen(false)
  }, [location.pathname])

  // Navegación según sesión y rol
  const navItems = [
    { to: '/tienda', label: 'Servicios', show: true },
    {
      to: '/agenda',
      label:
        !isAuthenticated || role === 'CONSULTA'
          ? 'Mi turno'
          : role === 'ESTILISTA'
          ? 'Mi agenda'
          : 'Agenda',
      show: true,
      count: isSalonTeam ? unreadNotifs.length : 0,
    },
    {
      to: '/salon',
      label: 'Salón',
      show: isAuthenticated && (role === 'ADMINISTRADOR' || role === 'VENDEDOR' || role === 'ESTILISTA'),
    },
    {
      to: '/ventas',
      label: 'Caja',
      show: isAuthenticated && (role === 'ADMINISTRADOR' || role === 'VENDEDOR'),
      count: carts.length,
    },
    {
      to: '/admin',
      label: 'Gestión',
      show: isAuthenticated && role === 'ADMINISTRADOR',
      alert: lowStockCount,
    },
  ].filter((i) => i.show)

  const isActive = (to) =>
    location.pathname === to || (to === '/tienda' && location.pathname === '/')

  const openLogin = () => {
    setEmailInput('')
    setPassInput('')
    setShowPassword(false)
    setIsLoginModalOpen(true)
  }

  const handleLoginSubmit = (e) => {
    e.preventDefault()
    const res = loginWithCredentials(emailInput, passInput)
    if (res.success) {
      setEmailInput('')
      setPassInput('')
      setShowPassword(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F9F8F6]/90 backdrop-blur-lg border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-[68px] sm:h-[72px] flex items-center justify-between gap-1 sm:gap-6">
          <Logo />

          {/* Navegación desktop */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => {
              const active = isActive(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-4 py-2 text-[13px] font-medium tracking-wide whitespace-nowrap transition-colors ${
                    active ? 'text-[#111111]' : 'text-stone-500 hover:text-[#111111]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {item.label}
                    {item.count > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#111111] text-[#D4AF37] text-[10px] font-semibold flex items-center justify-center">
                        {item.count}
                      </span>
                    )}
                    {item.alert > 0 && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#EAB308]"
                        title={`${item.alert} productos con stock bajo`}
                      />
                    )}
                  </span>
                  <span
                    className={`absolute left-4 right-4 -bottom-[1px] h-[2px] rounded-full bg-[#D4AF37] transition-transform origin-center ${
                      active ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </Link>
              )
            })}
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-stone-200 bg-white text-stone-600 hover:text-[#D4AF37] hover:border-[#D4AF37] transition cursor-pointer"
              title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDarkMode ? (
                <Sun className="w-[17px] h-[17px] text-[#D4AF37]" />
              ) : (
                <Moon className="w-[17px] h-[17px]" />
              )}
            </button>

            {isSalonTeam && (
              <div className="relative" ref={notifMenuRef}>
                <button
                  type="button"
                  onClick={() => setNotifMenuOpen((v) => !v)}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center border border-stone-200 bg-white text-stone-600 hover:text-[#111111] hover:border-[#D4AF37] transition cursor-pointer"
                  title="Bandeja de Reservas de Turnos"
                  aria-label="Bandeja de Reservas de Turnos"
                >
                  <Bell className="w-[17px] h-[17px]" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {notifMenuOpen && (
                  <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-[74px] sm:top-auto sm:mt-2 w-auto sm:w-96 rounded-2xl bg-white border border-stone-200 shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#8A6D1B]">
                          Bandeja de Turnos ({role})
                        </p>
                        <p className="text-sm font-semibold text-[#111111]">
                          Reservas Online Recibidas
                        </p>
                      </div>
                      {unreadNotifs.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            AppointmentRepository.markAllNotificationsAsRead(role)
                          }
                          className="text-[11px] font-semibold text-[#8A6D1B] hover:underline cursor-pointer"
                        >
                          Marcar vistas
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                      {staffNotifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-stone-500">
                          Aún no hay nuevas reservas registradas desde la web.
                        </div>
                      ) : (
                        staffNotifications.map((n) => {
                          const isUnread =
                            !Array.isArray(n.readByRoles) ||
                            !n.readByRoles.includes(role)
                          return (
                            <div
                              key={n.id}
                              className={`p-3.5 text-xs space-y-1.5 ${
                                isUnread ? 'bg-[#D4AF37]/10' : 'bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-[#111111]">
                                  {n.customerName}
                                </span>
                                <span className="font-mono text-[11px] font-semibold text-[#8A6D1B]">
                                  {n.date} · {n.startTime} hs
                                </span>
                              </div>
                              <p className="text-stone-700 font-medium">
                                {n.serviceName} ({formatCurrency(n.servicePrice)})
                              </p>
                              <p className="text-[11px] text-stone-500">
                                Estilista: <strong>{n.employeeName}</strong> ({n.station})
                              </p>
                              <div className="pt-1 flex items-center justify-between gap-2">
                                <span className="text-[10px] text-stone-400 truncate">
                                  {n.customerPhone || n.customerEmail}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {n.appointmentStatus !== 'CONFIRMADO' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        AppointmentRepository.confirmAppointmentByStaff(
                                          n.appointmentId,
                                          user
                                        )
                                        AppointmentRepository.markNotificationAsRead(
                                          n.id,
                                          role
                                        )
                                        toast.success(
                                          `✓ Turno confirmado a ${n.customerName}`
                                        )
                                      }}
                                      className="px-2.5 py-1 rounded-md bg-[#10B981] text-[#111111] text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-400 transition cursor-pointer"
                                    >
                                      ✓ Confirmar
                                    </button>
                                  )}
                                  <Link
                                    to="/agenda"
                                    onClick={() => {
                                      AppointmentRepository.markNotificationAsRead(
                                        n.id,
                                        role
                                      )
                                      setNotifMenuOpen(false)
                                    }}
                                    className="px-2.5 py-1 rounded-md bg-[#111111] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    Ver →
                                  </Link>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated && role === 'CONSULTA' && (
              <Link
                to="/tienda"
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-stone-500 hover:text-[#111111] hover:bg-stone-200/60 transition"
                title="Favoritos"
              >
                <Heart className="w-[18px] h-[18px]" />
                {favorites.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D4AF37]" />
                )}
              </Link>
            )}

            {!isStaff && (
              <button
                type="button"
                onClick={() => setIsShopOpen(true)}
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-stone-600 hover:text-[#111111] hover:bg-stone-200/60 transition cursor-pointer"
                title="Carrito"
                aria-label="Carrito"
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                {shopCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#111111] text-[#D4AF37] text-[10px] font-semibold flex items-center justify-center">
                    {shopCount}
                  </span>
                )}
              </button>
            )}

            <Link
              to="/reservas"
              className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[#D4AF37] text-[#111111] text-[13px] font-semibold whitespace-nowrap hover:bg-[#c9a42f] transition shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              Reservar turno
            </Link>

            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-full border border-stone-200 bg-white hover:border-stone-300 transition cursor-pointer"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="hidden md:block text-[13px] font-medium text-[#111111] whitespace-nowrap max-w-[120px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="fixed sm:absolute right-3 sm:right-0 top-[74px] sm:top-auto sm:mt-2 w-[calc(100vw-24px)] max-w-64 sm:w-64 rounded-2xl bg-white border border-stone-200 shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3.5 border-b border-stone-100 flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111111] truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-stone-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 border-b border-stone-100">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-[#D4AF37]/15 text-[#8A6D1B] text-[11px] font-semibold">
                        {ROLE_BADGES[role]?.label || ROLE_SHORT[role]}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 hover:text-red-600 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={openLogin}
                className="inline-flex items-center gap-2 h-9 px-2.5 sm:px-4 rounded-full border border-stone-300 text-[13px] font-medium text-[#111111] whitespace-nowrap hover:border-[#111111] transition cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Ingresar</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-[#111111] hover:bg-stone-200/60 cursor-pointer"
              aria-label="Menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menú mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200/70 bg-[#F9F8F6] px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(item.to)
                    ? 'bg-[#111111] text-[#D4AF37]'
                    : 'text-[#111111] hover:bg-stone-200/60'
                }`}
              >
                {item.label}
                {item.count > 0 && (
                  <span className="text-xs text-stone-400">{item.count}</span>
                )}
              </Link>
            ))}
            <Link
              to="/reservas"
              className="sm:hidden flex items-center justify-center gap-2 mt-2 px-3 py-2.5 rounded-lg bg-[#D4AF37] text-[#111111] text-sm font-semibold"
            >
              <Calendar className="w-4 h-4" />
              Reservar turno
            </Link>
          </div>
        )}
      </header>

      {/* Drawer del carrito de compras */}
      {isShopOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsShopOpen(false)
          }}
        >
          <aside className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 h-[72px] border-b border-stone-200">
              <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
                Tu carrito{' '}
                <span className="text-base font-sans font-normal text-stone-400">
                  ({shopCount})
                </span>
              </h3>
              {shopItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPendingCartAction({ type: 'clear' })}
                  className="mr-auto ml-3 text-xs font-medium text-red-600 hover:text-red-700 underline underline-offset-2 cursor-pointer"
                >
                  Vaciar carrito
                </button>
              )}
              <button
                onClick={() => setIsShopOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-[#111111] hover:bg-stone-100 cursor-pointer"
                aria-label="Cerrar carrito"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {shopItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <ShoppingBag className="w-10 h-10 text-stone-300" />
                <p className="font-serif-luxury text-2xl font-bold text-[#111111] mt-3">
                  Tu carrito está vacío
                </p>
                <p className="text-sm text-stone-500 mt-1">
                  Explora nuestros productos profesionales.
                </p>
                <Link
                  to="/tienda"
                  onClick={() => setIsShopOpen(false)}
                  className="mt-5 inline-flex items-center h-10 px-5 rounded-full bg-[#111111] text-white text-sm font-medium"
                >
                  Seguir comprando
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {shopItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = getUniqueItemFallbackImage(item)
                        }}
                        className="w-20 h-20 rounded-xl object-cover bg-stone-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-stone-400">{item.brand}</p>
                        <p className="text-sm font-medium text-[#111111] leading-snug line-clamp-2">
                          {item.name}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="inline-flex items-center rounded-lg border border-stone-200">
                            <button
                              onClick={() => updateShopQty(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-[#111111] cursor-pointer"
                              aria-label="Restar"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateShopQty(item.id, 1)}
                              disabled={item.quantity >= item.stock}
                              className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-[#111111] disabled:opacity-30 cursor-pointer"
                              aria-label="Sumar"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-[#111111]">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setPendingCartAction({ type: 'remove', item })
                        }
                        className="self-start p-1 text-stone-300 hover:text-red-500 cursor-pointer"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-200 px-6 py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-500">Total</span>
                    <span className="font-serif-luxury text-3xl font-bold text-[#111111]">
                      {formatCurrency(shopTotal)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">Retiro sin cargo en el salón.</p>
                  <button
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="w-full h-12 rounded-xl bg-[#111111] text-white text-sm font-semibold hover:bg-stone-800 disabled:opacity-60 transition cursor-pointer"
                  >
                    {checkingOut
                      ? 'Procesando…'
                      : isAuthenticated
                      ? 'Finalizar compra'
                      : 'Iniciar sesión para comprar'}
                  </button>
                  <Link
                    to="/tienda"
                    onClick={() => setIsShopOpen(false)}
                    className="w-full h-10 rounded-xl border border-stone-200 text-stone-700 text-sm font-medium hover:border-stone-400 transition flex items-center justify-center"
                  >
                    Seguir comprando
                  </Link>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {pendingCartAction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPendingCartAction(null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-confirmation-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2
              id="cart-confirmation-title"
              className="font-serif-luxury text-2xl font-bold text-[#111111]"
            >
              {pendingCartAction.type === 'clear'
                ? '¿Vaciar el carrito?'
                : '¿Eliminar este producto?'}
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              {pendingCartAction.type === 'clear' ? (
                `Se eliminarán ${shopItems.length} ${
                  shopItems.length === 1 ? 'producto' : 'productos'
                } del carrito. Esta acción no se puede deshacer.`
              ) : (
                <>
                  ¿Estás seguro de eliminar{' '}
                  <strong className="text-[#111111]">
                    {pendingCartAction.item.name}
                  </strong>{' '}
                  del carrito?
                </>
              )}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingCartAction(null)}
                className="h-10 rounded-lg border border-stone-200 px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmCartAction}
                className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer"
              >
                {pendingCartAction.type === 'clear' ? 'Sí, vaciar' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de inicio de sesión: imagen izquierda + formulario derecha */}
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsLoginModalOpen(false)
          }}
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl grid grid-cols-1 md:grid-cols-2 relative my-auto">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-[#111111] hover:bg-stone-100 transition cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="hidden md:block relative min-h-[520px] bg-[#111111]">
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85"
                alt="GlamStudio"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/90 via-[#111111]/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="font-serif-luxury text-3xl font-bold text-white">
                  Glam<span className="text-[#D4AF37] italic font-medium">Studio</span>
                </span>
                <p className="text-sm text-stone-300 mt-2 max-w-xs leading-relaxed">
                  Coloración, estilismo de autor y cuidado capilar profesional.
                </p>
              </div>
            </div>

            <div className="p-8 sm:p-12 flex flex-col justify-center">
              <h3 className="font-serif-luxury text-3xl font-bold text-[#111111]">
                Iniciar sesión
              </h3>
              <p className="text-sm text-stone-500 mt-1.5 mb-8">
                Ingresa con tu correo y contraseña.
              </p>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="nombre@correo.com"
                    autoComplete="email"
                    className="w-full h-11 px-4 rounded-xl bg-[#F9F8F6] border border-stone-200 text-sm text-[#111111] focus:outline-none focus:border-[#D4AF37] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passInput}
                      onChange={(e) => setPassInput(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full h-11 pl-4 pr-11 rounded-xl bg-[#F9F8F6] border border-stone-200 text-sm text-[#111111] focus:outline-none focus:border-[#D4AF37] focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-[#111111] transition cursor-pointer"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#111111] text-white text-sm font-semibold hover:bg-stone-800 transition cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Ingresar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
