import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  ShoppingBag,
  Scissors,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Calculator,
  Receipt,
  Sparkles,
  Lock,
  UserCheck,
  Wallet,
  X,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProductRepository } from '../repositories/ProductRepository'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { SalesRepository } from '../repositories/SalesRepository'
import { CajaDiariaRepository } from '../repositories/CajaDiariaRepository'
import { syncService } from '../services/syncService'
import { useAuth } from '../context/AdminAuthContext'
import { useCart } from '../context/CartContext'
import { formatCurrency, getTodayISO } from '../lib/utils'

export function VentasPOSPage() {
  const { user, role, setIsLoginModalOpen } = useAuth()
  const {
    carts,
    activeCart,
    activeCartId,
    setActiveCartId,
    createNewCart,
    closeCartTab,
    updateActiveCartMeta,
    addItemToActiveCart,
    updateItemQuantity,
    updateItemStylist,
    clearActiveCart,
    importAppointmentToCart,
  } = useCart()

  const [services, setServices] = useState([])
  const [products, setProducts] = useState([])
  const [employees, setEmployees] = useState([])
  const [readyAppointments, setReadyAppointments] = useState([])
  const [salesHistory, setSalesHistory] = useState([])
  const [cashSummary, setCashSummary] = useState(null)

  const [posCatalogTab, setPosCatalogTab] = useState('combined') // 'combined' | 'services' | 'products'
  const [searchPos, setSearchPos] = useState('')
  const [isArqueoModalOpen, setIsArqueoModalOpen] = useState(false)

  // Campos de Arqueo de Caja con soporte de autocompletado en ceros
  const [countedCashInput, setCountedCashInput] = useState('')
  const [countedCardInput, setCountedCardInput] = useState('')
  const [countedTransferInput, setCountedTransferInput] = useState('')
  const [arqueoNotes, setArqueoNotes] = useState('')
  const [initialCashToOpen, setInitialCashToOpen] = useState('50000')

  const loadPOSData = async () => {
    const [srv, prd, emp, appts, sales, summary] = await Promise.all([
      ProductRepository.getAllServices(),
      ProductRepository.getAllProducts(),
      ProductRepository.getAllEmployees(),
      AppointmentRepository.getAppointmentsByDate(getTodayISO()),
      SalesRepository.getAllSales(),
      CajaDiariaRepository.getDailySummary(getTodayISO()),
    ])
    setServices(srv)
    setProducts(prd)
    setEmployees(emp)
    setReadyAppointments(appts.filter((a) => !a.paid))
    setSalesHistory(sales)
    setCashSummary(summary)
  }

  useEffect(() => {
    loadPOSData()
    return syncService.subscribe(() => {
      loadPOSData()
    })
  }, [])

  // Protección RBAC estricta: Solo ADMINISTRADOR y VENDEDOR operan el POS
  if (role !== 'ADMINISTRADOR' && role !== 'VENDEDOR') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-[#111111] text-[#F9F8F6] rounded-2xl border border-[#D4AF37]/40 p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Restricción de Seguridad RBAC
          </span>
          <h2 className="font-serif-luxury text-3xl font-bold text-white">
            Módulo Exclusivo para Recepción (VENDEDOR) y Administración
          </h2>
          <p className="text-sm text-stone-300 max-w-lg mx-auto">
            Para operar el Punto de Venta, Carritos Simultáneos y Arqueo de Caja Diaria, inicia sesión con una cuenta de Recepción o Administración.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-[#D4AF37] text-[#111111] text-xs font-bold uppercase tracking-wider hover:bg-[#e5c145] transition cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  const subtotal = (activeCart?.items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  )
  const discount = Number(activeCart?.discount || 0)
  const grandTotal = Math.max(0, subtotal - discount)

  const handleCheckout = async () => {
    if (!activeCart?.items?.length) {
      toast.error('Agrega al menos un servicio o producto al ticket antes de cobrar.')
      return
    }
    try {
      const sale = await SalesRepository.createSale({
        customerName: activeCart.customerName || 'Cliente Salón',
        paymentMethod: activeCart.paymentMethod || 'Efectivo',
        items: activeCart.items,
        discount: activeCart.discount || 0,
        cashierEmail: user?.email || 'recepcion@glamstudio.com',
        linkedAppointmentId: activeCart.linkedAppointmentId,
      })

      toast.success(`Venta Facturada: Ticket ${sale.ticketNumber}`, {
        description: `Total cobrado: ${formatCurrency(sale.total)} (${sale.paymentMethod})`,
      })

      clearActiveCart()
      await loadPOSData()
    } catch (err) {
      toast.error(err.message || 'Error al procesar el cobro')
    }
  }

  const handleAutocompleteZeros = () => {
    setCountedCashInput((prev) => (prev === '' ? '0' : prev))
    setCountedCardInput((prev) => (prev === '' ? '0' : prev))
    setCountedTransferInput((prev) => (prev === '' ? '0' : prev))
    toast.info('Campos vacíos autocompletados en 0 para el arqueo.')
  }

  const handleFillExpectedValues = () => {
    if (!cashSummary) return
    setCountedCashInput(String(cashSummary.expectedCashInDrawer || 0))
    setCountedCardInput(String(cashSummary.cardSales || 0))
    setCountedTransferInput(String(cashSummary.transferSales || 0))
    toast.success('Valores esperados del sistema cargados en el arqueo.')
  }

  const handleConfirmCloseCash = async (e) => {
    e.preventDefault()
    // Autocompletado automático en ceros si algún campo quedó vacío
    const safeCash = countedCashInput === '' ? 0 : Number(countedCashInput)
    const safeCard = countedCardInput === '' ? 0 : Number(countedCardInput)
    const safeTransfer = countedTransferInput === '' ? 0 : Number(countedTransferInput)

    const closeRecord = await CajaDiariaRepository.closeCashSession({
      countedCash: safeCash,
      countedCard: safeCard,
      countedTransfer: safeTransfer,
      closedBy: user?.email || 'recepcion@glamstudio.com',
      notes: arqueoNotes || 'Cierre de caja verificado desde POS.',
    })

    setIsArqueoModalOpen(false)
    toast.success('Arqueo y Cierre Diario Registrado', {
      description: `Diferencia de caja: ${formatCurrency(closeRecord.difference)}`,
    })
    await loadPOSData()
  }

  const handleReopenCash = async () => {
    await CajaDiariaRepository.openCashSession({
      initialCash: Number(initialCashToOpen || 50000),
      openedBy: user?.email || 'recepcion@glamstudio.com',
    })
    toast.success('Nueva sesión de Caja Diaria abierta.')
    await loadPOSData()
  }

  const filteredServices = services.filter(
    (s) =>
      posCatalogTab !== 'products' &&
      (!searchPos || s.name.toLowerCase().includes(searchPos.toLowerCase()))
  )
  const filteredProducts = products.filter(
    (p) =>
      posCatalogTab !== 'services' &&
      (!searchPos ||
        p.name.toLowerCase().includes(searchPos.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchPos.toLowerCase()))
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* BARRA SUPERIOR DE CAJA DIARIA Y ACCESO A ARQUEO */}
      <div className="bg-[#111111] text-[#F9F8F6] rounded-2xl border border-[#D4AF37]/40 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">
                Terminal POS & Caja Diaria
              </span>
              {cashSummary?.activeSession ? (
                <span className="px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold border border-[#10B981]/30">
                  ● CAJA ABIERTA
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  ● CAJA CERRADA
                </span>
              )}
            </div>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
              Facturación Combinada & Carritos Simultáneos
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2">
            <span className="text-stone-400 block">Efectivo en Cajón</span>
            <span className="font-mono font-bold text-[#10B981] text-sm">
              {formatCurrency(cashSummary?.expectedCashInDrawer || 0)}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2">
            <span className="text-stone-400 block">Tarjetas Hoy</span>
            <span className="font-mono font-bold text-white text-sm">
              {formatCurrency(cashSummary?.cardSales || 0)}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2">
            <span className="text-stone-400 block">Transferencia / QR</span>
            <span className="font-mono font-bold text-white text-sm">
              {formatCurrency(cashSummary?.transferSales || 0)}
            </span>
          </div>
          <div className="flex items-center">
            {cashSummary?.activeSession ? (
              <button
                type="button"
                onClick={() => {
                  setCountedCashInput('')
                  setCountedCardInput('')
                  setCountedTransferInput('')
                  setIsArqueoModalOpen(true)
                }}
                className="w-full h-full py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#e5c145] text-[#111111] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                Arqueo y Cierre
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReopenCash}
                className="w-full h-full py-2.5 px-4 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-[#111111] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                Abrir Caja ($50.000)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BARRA RÁPIDA: TURNOS DE SALÓN PENDIENTES DE COBRO */}
      {readyAppointments.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#111111]">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Importar Turno de Salón a un Carrito Simultáneo:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {readyAppointments.map((apt) => (
              <button
                key={apt.id}
                type="button"
                onClick={() => importAppointmentToCart(apt)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F9F8F6] hover:bg-[#D4AF37]/20 border border-stone-200 hover:border-[#D4AF37] text-xs font-semibold text-[#111111] transition cursor-pointer"
              >
                <span>{apt.customerName}</span>
                <span className="text-[#8A6D1B]">({apt.serviceName})</span>
                <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑAS DE CARRITOS SIMULTÁNEOS EN RECEPCIÓN */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200">
        {carts.map((cart) => {
          const isCurrent = cart.id === activeCart?.id
          const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)
          return (
            <div
              key={cart.id}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-t border-x text-xs font-bold transition ${isCurrent
                  ? 'bg-[#111111] text-[#D4AF37] border-[#111111]'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
            >
              <button
                type="button"
                onClick={() => setActiveCartId(cart.id)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span>{cart.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${isCurrent
                      ? 'bg-[#D4AF37] text-[#111111]'
                      : 'bg-stone-200 text-stone-700'
                    }`}
                >
                  {itemCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => closeCartTab(cart.id)}
                className="p-0.5 rounded hover:bg-white/20 text-stone-400 hover:text-red-400 cursor-pointer"
                title="Cerrar este carrito"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => createNewCart('', 'Nuevo Cliente en Espera')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#111111] border border-[#D4AF37]/40 text-xs font-bold whitespace-nowrap transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          + Carrito Simultáneo
        </button>
      </div>

      {/* CUERPO PRINCIPAL POS: CATÁLOGO (IZQUIERDA) + TICKET ACTIVO (DERECHA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Catálogo de Servicios + Productos de Reventa */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'combined', label: 'Servicios + Reventa' },
                { id: 'services', label: 'Solo Servicios' },
                { id: 'products', label: 'Solo Productos Reventa' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPosCatalogTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${posCatalogTab === t.id
                      ? 'bg-[#111111] text-[#D4AF37]'
                      : 'bg-[#F9F8F6] text-stone-600 hover:bg-stone-200'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={searchPos}
              onChange={(e) => setSearchPos(e.target.value)}
              placeholder="Filtrar servicio o producto..."
              className="px-3 py-1.5 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Grilla de Servicios para agregar en 1 clic */}
          {filteredServices.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A6D1B] flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5" />
                Servicios de Salón
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredServices.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => addItemToActiveCart({ ...srv, type: 'service' })}
                    className="p-3 rounded-xl border border-stone-200 hover:border-[#D4AF37] bg-[#F9F8F6]/60 hover:bg-[#D4AF37]/10 text-left flex items-center justify-between gap-2 transition cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111111] truncate">
                        {srv.name}
                      </p>
                      <span className="text-[10px] text-stone-500">
                        {srv.duration} min • Comisión estilista {srv.commissionPct}%
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#111111] bg-white px-2.5 py-1 rounded-lg border border-stone-200 shrink-0">
                      {formatCurrency(srv.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grilla de Productos de Reventa */}
          {filteredProducts.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                Productos Capilares de Reventa (Descuenta Stock)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredProducts.map((prd) => {
                  const out = Number(prd.stock) <= 0
                  return (
                    <button
                      key={prd.id}
                      type="button"
                      disabled={out}
                      onClick={() => addItemToActiveCart({ ...prd, type: 'product' })}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition ${out
                          ? 'border-red-200 bg-red-50/40 opacity-60 cursor-not-allowed'
                          : 'border-stone-200 hover:border-[#D4AF37] bg-white hover:bg-[#D4AF37]/10 cursor-pointer'
                        }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#111111] truncate">
                          {prd.name}
                        </p>
                        <span
                          className={`text-[10px] font-semibold ${out
                              ? 'text-red-600'
                              : prd.stock <= prd.minStock
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                        >
                          {out ? 'Agotado (0 u.)' : `Stock disponible: ${prd.stock} u.`}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#111111] bg-[#F9F8F6] px-2.5 py-1 rounded-lg border border-stone-200 shrink-0">
                        {formatCurrency(prd.price)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Ticket Activo del Carrito Seleccionado */}
        <div className="lg:col-span-5 bg-white rounded-2xl border-2 border-[#111111] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A6D1B]">
                Carrito Simultáneo Activo
              </span>
              <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
                {activeCart?.label}
              </h3>
            </div>
            <Receipt className="w-5 h-5 text-[#D4AF37]" />
          </div>

          {/* Datos del Cliente y Medio de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Nombre en Ticket
              </label>
              <input
                type="text"
                value={activeCart?.customerName || ''}
                onChange={(e) =>
                  updateActiveCartMeta({
                    customerName: e.target.value,
                    label: `Ticket • ${e.target.value || 'Cliente'}`,
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-[#F9F8F6] border border-stone-200 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Medio de Pago
              </label>
              <select
                value={activeCart?.paymentMethod || 'Efectivo'}
                onChange={(e) => updateActiveCartMeta({ paymentMethod: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-[#F9F8F6] border border-stone-200 text-xs font-semibold"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                <option value="Transferencia / QR">Transferencia / QR</option>
              </select>
            </div>
          </div>

          {/* Lista de Ítems Combinados (Servicios + Productos) */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {!activeCart?.items?.length ? (
              <div className="py-10 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
                Selecciona servicios o productos del catálogo para armar el ticket.
              </div>
            ) : (
              activeCart.items.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-3 rounded-xl bg-[#F9F8F6] border border-stone-200/90 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.2 rounded text-[9px] font-bold uppercase ${item.type === 'service'
                            ? 'bg-[#111111] text-[#D4AF37]'
                            : 'bg-emerald-500/15 text-emerald-800'
                          }`}
                      >
                        {item.type === 'service' ? 'Servicio Salón' : 'Producto Reventa'}
                      </span>
                      <p className="text-xs font-bold text-[#111111] mt-0.5">
                        {item.name}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#111111]">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-200/60">
                    {/* Selector de Estilista para liquidar comisión */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <select
                        value={item.employeeId || 'emp-1'}
                        onChange={(e) => {
                          const emp = employees.find((x) => x.id === e.target.value)
                          if (emp) updateItemStylist(item.id, item.type, emp)
                        }}
                        className="bg-white border border-stone-200 rounded px-1.5 py-0.5 text-[11px] font-medium"
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({item.commissionPct}% com.)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Controles de Cantidad */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, item.type, -1)}
                        className="w-6 h-6 rounded bg-white border border-stone-200 flex items-center justify-center hover:border-[#D4AF37] cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, item.type, 1)}
                        className="w-6 h-6 rounded bg-white border border-stone-200 flex items-center justify-center hover:border-[#D4AF37] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totales y Botón de Cobro */}
          <div className="pt-3 border-t border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span>Subtotal Combinado</span>
              <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span>Bonificación / Descuento ($)</span>
              <input
                type="number"
                min="0"
                value={activeCart?.discount || 0}
                onChange={(e) =>
                  updateActiveCartMeta({ discount: Number(e.target.value || 0) })
                }
                className="w-24 text-right px-2 py-1 rounded bg-[#F9F8F6] border border-stone-200 font-mono text-xs"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
              <span className="font-serif-luxury text-2xl font-bold text-[#111111]">
                Total a Cobrar
              </span>
              <span className="font-serif-luxury text-3xl font-bold text-[#111111]">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-3.5 px-5 rounded-xl bg-[#111111] hover:bg-stone-800 text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Emitir Ticket & Registrar Cobro ({formatCurrency(grandTotal)})
            </button>
          </div>
        </div>
      </div>

      {/* HISTORIAL RECIENTE DE VENTAS EN CAJA */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
          Últimos Tickets Facturados en Salón
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Ticket</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Detalle Combinado</th>
                <th className="py-2.5 px-3">Medio de Pago</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {salesHistory.slice(0, 8).map((sale) => (
                <tr key={sale.id} className="hover:bg-[#F9F8F6]">
                  <td className="py-3 px-3 font-mono font-bold text-[#111111]">
                    {sale.ticketNumber}
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#111111]">
                    {sale.customerName}
                  </td>
                  <td className="py-3 px-3 text-stone-600">
                    {(sale.items || []).map((i) => `${i.quantity}x ${i.name}`).join(' + ')}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#111111]">
                    {formatCurrency(sale.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ARQUEO DE CAJA CON AUTOCOMPLETADO EN CEROS */}
      {isArqueoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#F9F8F6] border border-[#D4AF37] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="bg-[#111111] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                  Control Financiero Diario
                </span>
                <h3 className="font-serif-luxury text-2xl font-bold">
                  Arqueo y Cierre de Caja Diaria
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsArqueoModalOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCloseCash} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-white border border-stone-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-stone-500 block">Fondo Inicial + Efectivo:</span>
                  <strong className="font-mono text-sm text-[#111111]">
                    {formatCurrency(cashSummary?.expectedCashInDrawer || 0)}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-500 block">Facturación Total del Día:</span>
                  <strong className="font-mono text-sm text-emerald-700">
                    {formatCurrency(cashSummary?.totalDayRevenue || 0)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleAutocompleteZeros}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#111111] text-xs font-bold hover:bg-[#D4AF37]/30 transition cursor-pointer"
                >
                  Autocompletar Vacíos en Cero (0)
                </button>
                <button
                  type="button"
                  onClick={handleFillExpectedValues}
                  className="flex-1 py-2 px-3 rounded-lg bg-stone-200 text-stone-800 text-xs font-semibold hover:bg-stone-300 transition cursor-pointer"
                >
                  Cargar Esperados Exactos
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Efectivo Físico ($)
                  </label>
                  <input
                    type="number"
                    value={countedCashInput}
                    onChange={(e) => setCountedCashInput(e.target.value)}
                    onBlur={() => {
                      if (countedCashInput === '') setCountedCashInput('0')
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Cupones Tarjeta ($)
                  </label>
                  <input
                    type="number"
                    value={countedCardInput}
                    onChange={(e) => setCountedCardInput(e.target.value)}
                    onBlur={() => {
                      if (countedCardInput === '') setCountedCardInput('0')
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Transferencias ($)
                  </label>
                  <input
                    type="number"
                    value={countedTransferInput}
                    onChange={(e) => setCountedTransferInput(e.target.value)}
                    onBlur={() => {
                      if (countedTransferInput === '') setCountedTransferInput('0')
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Observaciones de Cierre
                </label>
                <input
                  type="text"
                  value={arqueoNotes}
                  onChange={(e) => setArqueoNotes(e.target.value)}
                  placeholder="Ej: Cierre de turno sin novedades"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsArqueoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#111111] text-[#D4AF37] text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Confirmar Arqueo y Cerrar Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
