import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  TrendingUp,
  Scissors,
  Package,
  Users,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Lock,
  CheckCircle2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { toast } from 'sonner'
import { ProductRepository } from '../repositories/ProductRepository'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { SalesRepository } from '../repositories/SalesRepository'
import { CajaDiariaRepository } from '../repositories/CajaDiariaRepository'
import { resetDatabaseToSeed } from '../db/indexedDb'
import { syncService } from '../services/syncService'
import { useAuth } from '../context/AdminAuthContext'
import { formatCurrency, getTodayISO } from '../lib/utils'

export function AdminDashboardPage() {
  const { role, setIsLoginModalOpen } = useAuth()

  const [activeTab, setActiveTab] = useState('analytics') // 'analytics' | 'services' | 'stock' | 'team'
  const [services, setServices] = useState([])
  const [products, setProducts] = useState([])
  const [employees, setEmployees] = useState([])
  const [stylistStats, setStylistStats] = useState([])
  const [cashSummary, setCashSummary] = useState(null)
  const [inventoryLogs, setInventoryLogs] = useState([])
  const [salonHours, setSalonHours] = useState(() =>
    AppointmentRepository.getSalonHours()
  )

  // Formulario nuevo servicio
  const [newSrv, setNewSrv] = useState({
    name: '',
    category: 'Coloración',
    duration: 60,
    price: 45000,
    commissionPct: 40,
    description: '',
  })

  // Formulario nuevo producto
  const [newPrd, setNewPrd] = useState({
    sku: '',
    name: '',
    brand: 'Kérastase',
    category: 'Tratamientos',
    price: 55000,
    stock: 10,
    minStock: 4,
    description: '',
  })

  const loadAdminData = async () => {
    const [srv, prd, emp, stats, summary, logs] = await Promise.all([
      ProductRepository.getAllServices(),
      ProductRepository.getAllProducts(),
      ProductRepository.getAllEmployees(),
      SalesRepository.getStylistPerformanceReport(),
      CajaDiariaRepository.getDailySummary(getTodayISO()),
      ProductRepository.getInventoryLogs(),
    ])
    setServices(srv)
    setProducts(prd)
    setEmployees(emp)
    setStylistStats(stats)
    setCashSummary(summary)
    setInventoryLogs(logs)
  }

  useEffect(() => {
    loadAdminData()
    return syncService.subscribe(() => {
      loadAdminData()
    })
  }, [])

  // Protección RBAC estricta: Solo ADMINISTRADOR
  if (role !== 'ADMINISTRADOR') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-[#111111] text-[#F9F8F6] rounded-2xl border border-[#D4AF37]/40 p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Control de Acceso RBAC • Nivel Dirección
          </span>
          <h2 className="font-serif-luxury text-3xl font-bold text-white">
            Acceso Restringido al Rol ADMINISTRADOR
          </h2>
          <p className="text-sm text-stone-300 max-w-lg mx-auto">
            Solo la cuenta de Dirección posee permisos para modificar precios, comisiones de estilistas, stock y reportes financieros.
          </p>
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-[#D4AF37] text-[#111111] text-xs font-bold uppercase tracking-wider hover:bg-[#e5c145] transition cursor-pointer"
          >
            Iniciar Sesión como Administrador
          </button>
        </div>
      </div>
    )
  }

  const handleCreateService = async (e) => {
    e.preventDefault()
    if (!newSrv.name.trim()) return
    await ProductRepository.saveService({
      ...newSrv,
      image:
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80',
    })
    setNewSrv({
      name: '',
      category: 'Coloración',
      duration: 60,
      price: 45000,
      commissionPct: 40,
      description: '',
    })
    toast.success('Nuevo servicio agregado al catálogo de GlamStudio')
  }

  const handleUpdateServicePriceOrCommission = async (srv, field, value) => {
    await ProductRepository.saveService({
      ...srv,
      [field]: Number(value),
    })
    toast.success(`Servicio actualizado: ${srv.name}`)
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    if (!newPrd.name.trim()) return
    await ProductRepository.saveProduct({
      ...newPrd,
      sku: newPrd.sku || `GS-${Math.floor(100 + Math.random() * 900)}`,
      image:
        'https://images.unsplash.com/photo-1608248597359-0e6d526a6828?auto=format&fit=crop&w=800&q=80',
    })
    setNewPrd({
      sku: '',
      name: '',
      brand: 'Kérastase',
      category: 'Tratamientos',
      price: 55000,
      stock: 10,
      minStock: 4,
      description: '',
    })
    toast.success('Producto profesional incorporado al inventario')
  }

  const handleStockDelta = async (prd, delta) => {
    await ProductRepository.adjustStock(
      prd.id,
      delta,
      delta > 0 ? 'Reposición administrativa de stock' : 'Ajuste administrativo de inventario'
    )
    toast.success(`Stock de ${prd.name} actualizado`)
  }

  const handleSaveSalonHours = (e) => {
    e.preventDefault()
    AppointmentRepository.saveSalonHours(salonHours)
    toast.success('Horarios de apertura y cierre del salón actualizados.')
  }

  const handleResetDemo = async () => {
    await resetDatabaseToSeed()
    await loadAdminData()
    toast.success('Base de datos IndexedDB + LocalStorage restaurada a la semilla inicial.')
  }

  const totalCommissions = stylistStats.reduce((s, x) => s + x.totalCommission, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Encabezado Dirección */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#8A6D1B]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            Panel de Control Total • Rol ADMINISTRADOR
          </span>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#111111] mt-1">
            Dirección Financiera, Comisiones, Servicios & Stock
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'analytics', label: 'Finanzas & Comisiones', icon: TrendingUp },
            { id: 'services', label: `CRUD Servicios (${services.length})`, icon: Scissors },
            { id: 'stock', label: `Stock Reventa (${products.length})`, icon: Package },
            { id: 'team', label: 'Estilistas & Horarios', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#111111] text-[#D4AF37] shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-700 hover:border-[#D4AF37]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}

          <button
            type="button"
            onClick={handleResetDemo}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-600 hover:text-[#111111] text-xs font-semibold cursor-pointer"
            title="Restaurar datos de prueba originales"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Semilla
          </button>
        </div>
      </div>

      {/* TAB 1: ANALÍTICA FINANCIERA Y RENDIMIENTO DE ESTILISTAS (RECHARTS) */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111111] text-white rounded-2xl p-5 border border-[#D4AF37]/40">
              <span className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold">
                Ingresos Brutos Hoy
              </span>
              <p className="font-serif-luxury text-3xl font-bold mt-1">
                {formatCurrency(cashSummary?.totalDayRevenue || 0)}
              </p>
              <span className="text-xs text-stone-400">
                {cashSummary?.salesCount || 0} tickets facturados hoy
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-bold">
                Facturación Servicios Salón
              </span>
              <p className="font-serif-luxury text-3xl font-bold text-[#111111] mt-1">
                {formatCurrency(cashSummary?.servicesRevenue || 0)}
              </p>
              <span className="text-xs text-emerald-700 font-medium">
                Corte, Coloración & Tratamientos
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-bold">
                Facturación Reventa Capilar
              </span>
              <p className="font-serif-luxury text-3xl font-bold text-[#111111] mt-1">
                {formatCurrency(cashSummary?.productsRevenue || 0)}
              </p>
              <span className="text-xs text-[#8A6D1B] font-medium">
                Kérastase, Olaplex & L'Oréal
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-bold">
                Comisiones de Estilistas
              </span>
              <p className="font-serif-luxury text-3xl font-bold text-emerald-700 mt-1">
                {formatCurrency(totalCommissions)}
              </p>
              <span className="text-xs text-stone-500">
                Liquidación automática por ticket
              </span>
            </div>
          </div>

          {/* Gráfico Recharts + Tabla de Liquidación de Comisiones */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8A6D1B]">
                  Recharts Analytics
                </span>
                <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
                  Facturación Bruta vs. Comisión por Profesional
                </h3>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stylistStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => formatCurrency(val)}
                      contentStyle={{
                        backgroundColor: '#111111',
                        color: '#F9F8F6',
                        borderRadius: '12px',
                        border: '1px solid #D4AF37',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="grossRevenue"
                      name="Facturación Generada"
                      fill="#111111"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="totalCommission"
                      name="Comisión Estilista"
                      fill="#D4AF37"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
                Liquidación de Comisiones por Estilista
              </h3>
              <div className="space-y-3">
                {stylistStats.map((st) => (
                  <div
                    key={st.employeeId}
                    className="p-3.5 rounded-xl bg-[#F9F8F6] border border-stone-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-serif-luxury text-lg font-bold text-[#111111]">
                        {st.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {st.servicesCount} servicios • {st.productsCount} productos vendidos
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                        Comisión a Pagar
                      </span>
                      <span className="font-mono text-sm font-bold text-emerald-700">
                        {formatCurrency(st.totalCommission)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CRUD DE SERVICIOS, PRECIOS Y COMISIONES */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreateService}
            className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 p-6 space-y-4"
          >
            <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
              Crear Nuevo Servicio de Salón
            </h3>
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">
                Nombre del Servicio
              </label>
              <input
                type="text"
                required
                value={newSrv.name}
                onChange={(e) => setNewSrv({ ...newSrv, name: e.target.value })}
                placeholder="Ej: Babylights + Tratamiento Metal Detox"
                className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Duración (min)
                </label>
                <input
                  type="number"
                  value={newSrv.duration}
                  onChange={(e) =>
                    setNewSrv({ ...newSrv, duration: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Precio Salón ($)
                </label>
                <input
                  type="number"
                  value={newSrv.price}
                  onChange={(e) =>
                    setNewSrv({ ...newSrv, price: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">
                Comisión Estilista (%)
              </label>
              <input
                type="number"
                value={newSrv.commissionPct}
                onChange={(e) =>
                  setNewSrv({ ...newSrv, commissionPct: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">
                Descripción Técnica
              </label>
              <textarea
                rows={2}
                value={newSrv.description}
                onChange={(e) =>
                  setNewSrv({ ...newSrv, description: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#111111] text-[#D4AF37] text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              + Guardar Servicio
            </button>
          </form>

          <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
              Tarifario Oficial & Comisiones de Salón
            </h3>
            <div className="space-y-3">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-4 rounded-xl bg-[#F9F8F6] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#8A6D1B]">
                      {srv.category} • {srv.duration} min
                    </span>
                    <h4 className="font-serif-luxury text-xl font-bold text-[#111111]">
                      {srv.name}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="block text-[10px] text-stone-500">
                        Precio ($)
                      </label>
                      <input
                        type="number"
                        defaultValue={srv.price}
                        onBlur={(e) =>
                          handleUpdateServicePriceOrCommission(
                            srv,
                            'price',
                            e.target.value
                          )
                        }
                        className="w-28 px-2.5 py-1 rounded-lg bg-white border border-stone-300 font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-500">
                        Comisión (%)
                      </label>
                      <input
                        type="number"
                        defaultValue={srv.commissionPct}
                        onBlur={(e) =>
                          handleUpdateServicePriceOrCommission(
                            srv,
                            'commissionPct',
                            e.target.value
                          )
                        }
                        className="w-20 px-2.5 py-1 rounded-lg bg-white border border-stone-300 font-mono text-xs font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => ProductRepository.deleteService(srv.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer mt-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTROL DE STOCK DE REVENTA Y LOGS */}
      {activeTab === 'stock' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleCreateProduct}
            className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 p-6 space-y-4"
          >
            <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
              Alta de Producto de Reventa
            </h3>
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">
                Nombre del Producto
              </label>
              <input
                type="text"
                required
                value={newPrd.name}
                onChange={(e) => setNewPrd({ ...newPrd, name: e.target.value })}
                placeholder="Ej: Kérastase Chronologiste Huile 100ml"
                className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  value={newPrd.brand}
                  onChange={(e) => setNewPrd({ ...newPrd, brand: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Precio ($)
                </label>
                <input
                  type="number"
                  value={newPrd.price}
                  onChange={(e) =>
                    setNewPrd({ ...newPrd, price: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Stock Inicial
                </label>
                <input
                  type="number"
                  value={newPrd.stock}
                  onChange={(e) =>
                    setNewPrd({ ...newPrd, stock: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Stock Mínimo Alerta
                </label>
                <input
                  type="number"
                  value={newPrd.minStock}
                  onChange={(e) =>
                    setNewPrd({ ...newPrd, minStock: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#111111] text-[#D4AF37] text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              + Incorporar Producto
            </button>
          </form>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
                Inventario de Reventa & Semáforo de Stock
              </h3>
              <div className="space-y-3">
                {products.map((prd) => {
                  const statusColor =
                    prd.stock <= 0
                      ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                      : prd.stock <= prd.minStock
                      ? 'bg-[#EAB308]/20 text-amber-800 border-[#EAB308]/40'
                      : 'bg-[#10B981]/15 text-emerald-800 border-[#10B981]/30'

                  return (
                    <div
                      key={prd.id}
                      className="p-4 rounded-xl bg-[#F9F8F6] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-stone-500">
                          {prd.sku} • {prd.brand}
                        </span>
                        <h4 className="font-serif-luxury text-lg font-bold text-[#111111]">
                          {prd.name}
                        </h4>
                        <span className="text-xs font-bold text-[#8A6D1B]">
                          {formatCurrency(prd.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}
                        >
                          Stock: {prd.stock} u.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStockDelta(prd, 5)}
                          className="px-3 py-1.5 rounded-lg bg-[#10B981] text-[#111111] text-xs font-bold hover:bg-emerald-400 cursor-pointer"
                        >
                          +5 Reponer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStockDelta(prd, -1)}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-300 cursor-pointer"
                        >
                          -1
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bitácora de Movimientos (inventory_logs) */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
              <h4 className="font-serif-luxury text-xl font-bold text-[#111111]">
                Bitácora de Movimientos de Stock (IndexedDB `inventory_logs`)
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {inventoryLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-[#F9F8F6] border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <strong className="text-[#111111]">{log.productName}</strong>
                      <p className="text-stone-500 text-[11px]">{log.reason}</p>
                    </div>
                    <span className="font-mono font-bold">
                      {log.quantityChange > 0
                        ? `+${log.quantityChange}`
                        : log.quantityChange}{' '}
                      (Quedan: {log.newStock})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ESTILISTAS, COMISIONES Y HORARIOS DEL SALÓN */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveSalonHours}
            className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 p-6 space-y-4"
          >
            <h3 className="font-serif-luxury text-2xl font-bold text-[#111111] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              Horarios de Apertura y Cierre
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Apertura Salón
                </label>
                <input
                  type="time"
                  value={salonHours.openTime}
                  onChange={(e) =>
                    setSalonHours({ ...salonHours, openTime: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">
                  Cierre Salón
                </label>
                <input
                  type="time"
                  value={salonHours.closeTime}
                  onChange={(e) =>
                    setSalonHours({ ...salonHours, closeTime: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#111111] text-[#D4AF37] text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Guardar Horario Operativo
            </button>
          </form>

          <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
            <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
              Plantel de Profesionales & Comisiones Base
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-4 rounded-xl bg-[#F9F8F6] border border-stone-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#D4AF37]"
                    />
                    <div>
                      <h4 className="font-serif-luxury text-lg font-bold text-[#111111]">
                        {emp.name}
                      </h4>
                      <p className="text-xs text-[#8A6D1B]">{emp.specialty}</p>
                      <p className="text-[11px] text-stone-500">{emp.station}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <label className="block text-[10px] text-stone-500">
                      Comisión (%)
                    </label>
                    <input
                      type="number"
                      defaultValue={emp.commissionRate}
                      onBlur={(e) =>
                        ProductRepository.saveEmployee({
                          ...emp,
                          commissionRate: Number(e.target.value),
                        }).then(() => toast.success(`Comisión de ${emp.name} actualizada`))
                      }
                      className="w-16 px-2 py-1 rounded bg-white border border-stone-300 font-mono text-xs font-bold text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
