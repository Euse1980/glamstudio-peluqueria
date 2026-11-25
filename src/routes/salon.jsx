import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import {
  Columns3,
  Clock,
  Scissors,
  Sparkles,
  CheckCircle2,
  CreditCard,
  FileText,
  User,
  Droplets,
  AlertCircle,
  CalendarPlus,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { ProductRepository } from '../repositories/ProductRepository'
import { syncService } from '../services/syncService'
import { useAuth } from '../context/AdminAuthContext'
import { useCart } from '../context/CartContext'
import { formatCurrency, getTodayISO } from '../lib/utils'

export const SALON_COLUMNS = [
  {
    id: 'En espera',
    title: 'En espera',
    subtitle: 'Recepción & Café de Bienvenida',
    badgeBg: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
    headerBorder: 'border-amber-500',
    icon: Clock,
  },
  {
    id: 'En bacha',
    title: 'En bacha',
    subtitle: 'Lavado Spa, Matiz & Rituales',
    badgeBg: 'bg-sky-500/15 text-sky-800 border-sky-500/30',
    headerBorder: 'border-sky-500',
    icon: Droplets,
  },
  {
    id: 'En proceso',
    title: 'En proceso',
    subtitle: 'En Corte, Coloración o Brushing',
    badgeBg: 'bg-[#D4AF37]/20 text-[#8A6D1B] border-[#D4AF37]/40',
    headerBorder: 'border-[#D4AF37]',
    icon: Scissors,
  },
  {
    id: 'Listo / Finalizado',
    title: 'Listo / Finalizado',
    subtitle: 'Listo para Cierre y Cobro POS',
    badgeBg: 'bg-[#10B981]/15 text-emerald-800 border-[#10B981]/30',
    headerBorder: 'border-[#10B981]',
    icon: CheckCircle2,
  },
]

const STATIONS = [
  'Sillón 1 - VIP Gold',
  'Sillón 2 - Studio',
  'Sillón 3 - Spa Capilar',
  'Sillón 4 - Color Lab',
]

export function SalonPage() {
  const navigate = useNavigate()
  const { user, role, isAuthenticated, setIsLoginModalOpen } = useAuth()
  const { importAppointmentToCart } = useCart()

  const [appointments, setAppointments] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedDate, setSelectedDate] = useState(getTodayISO())
  const [showAllDates, setShowAllDates] = useState(true)
  const [filterStylist, setFilterStylist] = useState('ALL')
  const [editingNotesId, setEditingNotesId] = useState(null)
  const [notesDraft, setNotesDraft] = useState('')

  const loadBoard = async () => {
    const [appts, emps] = await Promise.all([
      AppointmentRepository.getAllAppointments(),
      ProductRepository.getAllEmployees(),
    ])
    setAppointments(appts.filter((a) => a.status !== 'CANCELADO'))
    setEmployees(emps)
  }

  useEffect(() => {
    loadBoard()
    return syncService.subscribe(() => {
      loadBoard()
    })
  }, [])

  // Si es ESTILISTA, por defecto filtramos por su propio ID (aunque puede ver todo si quiere o limitarse a su agenda)
  useEffect(() => {
    if (role === 'ESTILISTA' && user?.employeeId) {
      setFilterStylist(user.employeeId)
    } else {
      setFilterStylist('ALL')
    }
  }, [role, user?.employeeId])

  const canModifyStatus =
    isAuthenticated &&
    (role === 'ADMINISTRADOR' || role === 'VENDEDOR' || role === 'ESTILISTA')
  const canAssignStation =
    isAuthenticated && (role === 'ADMINISTRADOR' || role === 'VENDEDOR')
  const canSendToPOS =
    isAuthenticated && (role === 'ADMINISTRADOR' || role === 'VENDEDOR')

  if (!canModifyStatus) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-[#111111] text-[#F9F8F6] rounded-2xl border border-[#D4AF37]/40 p-8 text-center space-y-5 shadow-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Área Operativa de Salón
          </span>
          <h2 className="font-serif-luxury text-3xl font-bold text-white">
            Tablero Kanban exclusivo para Estilistas y Recepción
          </h2>
          <p className="text-sm text-stone-300 max-w-lg mx-auto">
            Por privacidad de nuestros clientes, el tablero operativo con fórmulas capilares y estaciones requiere iniciar sesión con una cuenta del personal.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-[#D4AF37] text-[#111111] text-xs font-bold uppercase tracking-wider hover:bg-[#e5c145] transition cursor-pointer"
            >
              Iniciar Sesión (Personal)
            </button>
            <Link
              to="/agenda"
              className="px-6 py-3 rounded-xl bg-white/10 text-white border border-white/20 text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition"
            >
              Consultar Mi Turno
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const dateFiltered = showAllDates
    ? appointments
    : appointments.filter((a) => a.date === selectedDate)

  const filteredAppointments = dateFiltered.filter((apt) => {
    if (filterStylist !== 'ALL' && apt.employeeId !== filterStylist) return false
    return true
  })

  const handleMoveState = async (apt, newStatus) => {
    if (!canModifyStatus) {
      toast.error('Tu rol actual es de solo lectura en el tablero Kanban.')
      return
    }
    await AppointmentRepository.updateAppointmentStatus(apt.id, {
      salonStatus: newStatus,
    })
    toast.success(`${apt.customerName} → ${newStatus}`, {
      description: `${apt.serviceName} (${apt.station})`,
    })
  }

  const handleStationChange = async (apt, newStation) => {
    if (!canAssignStation) return
    await AppointmentRepository.updateAppointmentStatus(apt.id, {
      station: newStation,
    })
    toast.success(`Estación actualizada: ${newStation}`)
  }

  const handleSaveTechnicalNotes = async (apt) => {
    await AppointmentRepository.updateAppointmentStatus(apt.id, {
      technicalNotes: notesDraft,
    })
    setEditingNotesId(null)
    toast.success('Ficha técnica capilar guardada', {
      description: `Notas actualizadas para ${apt.customerName}`,
    })
  }

  const handleSendToPOS = (apt) => {
    importAppointmentToCart(apt)
    navigate({ to: '/ventas' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Cabecera Kanban */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#8A6D1B]">
            <Columns3 className="w-3.5 h-3.5 text-[#D4AF37]" />
            Tablero Operativo Kanban en Tiempo Real
          </span>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#111111] mt-1">
            Estado de Salón & Flujo de Estaciones
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            {role === 'ESTILISTA'
              ? `Vista de Estilista (${user?.name}): gestiona tus estados en bacha/corte y fórmulas de tintura.`
              : role === 'CONSULTA'
                ? 'Vista de Cliente: sigue en tiempo real el avance de tu turno y disponibilidad de estaciones.'
                : 'Control de Recepción & Dirección: asigna estaciones, monitorea tiempos y transfiere al POS en 1 clic.'}
          </p>
        </div>

        {/* Controles y Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAllDates((v) => !v)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${showAllDates
                ? 'bg-[#111111] text-[#D4AF37] border-[#111111]'
                : 'bg-white text-stone-700 border-stone-200 hover:border-[#D4AF37]'
              }`}
          >
            {showAllDates ? 'Todas las fechas ✓' : 'Ver todas las fechas'}
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setShowAllDates(false)
            }}
            className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold"
          />

          <select
            value={filterStylist}
            onChange={(e) => setFilterStylist(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="ALL">Todos los Estilistas ({dateFiltered.length})</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} {user?.employeeId === emp.id ? '(Mis Turnos)' : `(${emp.station})`}
              </option>
            ))}
          </select>

          <Link
            to="/reservas"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-[#D4AF37] text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Nuevo Turno
          </Link>
        </div>
      </div>

      {/* 4 COLUMNAS KANBAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {SALON_COLUMNS.map((col, colIndex) => {
          const Icon = col.icon
          const columnItems = filteredAppointments.filter(
            (a) => a.salonStatus === col.id
          )

          return (
            <div
              key={col.id}
              className="bg-stone-100/90 rounded-2xl border border-stone-200/90 p-3.5 flex flex-col gap-3 min-h-[220px] lg:min-h-[540px]"
            >
              {/* Header de Columna */}
              <div
                className={`bg-white rounded-xl p-3.5 border-t-4 ${col.headerBorder} shadow-2xs flex items-center justify-between`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#111111]" />
                    <h3 className="font-serif-luxury text-xl font-bold text-[#111111]">
                      {col.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-500">{col.subtitle}</p>
                </div>
                <span className="w-7 h-7 rounded-full bg-[#111111] text-[#D4AF37] text-xs font-bold flex items-center justify-center">
                  {columnItems.length}
                </span>
              </div>

              {/* Tarjetas de la Columna */}
              <div className="space-y-3 flex-1">
                {columnItems.length === 0 ? (
                  <div className="h-44 rounded-xl border border-dashed border-stone-300 flex flex-col items-center justify-center text-center p-4 text-stone-400">
                    <Sparkles className="w-5 h-5 mb-1 opacity-50" />
                    <p className="text-xs font-medium">Sin clientes en "{col.title}"</p>
                  </div>
                ) : (
                  columnItems.map((apt) => {
                    const prevCol = SALON_COLUMNS[colIndex - 1]
                    const nextCol = SALON_COLUMNS[colIndex + 1]
                    const isEditingNotes = editingNotesId === apt.id

                    return (
                      <div
                        key={apt.id}
                        className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs hover:border-[#D4AF37] transition space-y-3"
                      >
                        {/* Hora + Estado de Cobro */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#111111] text-[#D4AF37] font-mono text-xs font-bold">
                            {apt.startTime} - {apt.endTime}
                          </span>
                          {apt.paid ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-emerald-800 text-[10px] font-bold border border-[#10B981]/30">
                              ✓ Cobrado POS
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-[#111111]">
                              {formatCurrency(apt.servicePrice)}
                            </span>
                          )}
                        </div>

                        {/* Cliente y Servicio */}
                        <div>
                          <h4 className="font-serif-luxury text-xl font-bold text-[#111111] flex items-center gap-1.5">
                            <User className="w-4 h-4 text-[#D4AF37]" />
                            {apt.customerName}
                          </h4>
                          <p className="text-xs font-semibold text-[#8A6D1B] mt-0.5">
                            {apt.serviceName} ({apt.duration} min)
                          </p>
                        </div>

                        {/* Estilista y Selector de Estación */}
                        <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-stone-600">
                            <span>Estilista:</span>
                            <strong className="text-[#111111]">{apt.employeeName}</strong>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-stone-500">Estación:</span>
                            {canAssignStation ? (
                              <select
                                value={apt.station}
                                onChange={(e) => handleStationChange(apt, e.target.value)}
                                className="px-2 py-1 rounded-md bg-[#F9F8F6] border border-stone-200 text-[11px] font-semibold text-[#111111]"
                              >
                                {STATIONS.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-semibold text-[#111111]">
                                {apt.station}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ficha Técnica / Fórmula de Tintura y Alergias */}
                        <div className="bg-[#F9F8F6] rounded-lg p-2.5 border border-stone-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-[#D4AF37]" />
                              Fórmula & Alertas Capilares
                            </span>
                            {canModifyStatus && !isEditingNotes && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNotesId(apt.id)
                                  setNotesDraft(apt.technicalNotes || '')
                                }}
                                className="text-[10px] font-bold text-[#8A6D1B] hover:underline cursor-pointer"
                              >
                                Editar Ficha
                              </button>
                            )}
                          </div>

                          {isEditingNotes ? (
                            <div className="space-y-2">
                              <textarea
                                rows={3}
                                value={notesDraft}
                                onChange={(e) => setNotesDraft(e.target.value)}
                                className="w-full p-2 rounded-md bg-white border border-[#D4AF37] text-xs focus:outline-none"
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingNotesId(null)}
                                  className="px-2 py-1 rounded text-[10px] font-semibold text-stone-600 hover:bg-stone-200"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveTechnicalNotes(apt)}
                                  className="px-2.5 py-1 rounded bg-[#111111] text-[#D4AF37] text-[10px] font-bold"
                                >
                                  Guardar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-stone-700 leading-snug">
                              {apt.technicalNotes || 'Sin notas registradas.'}
                            </p>
                          )}
                        </div>

                        {/* Acciones de Movimiento de Estado Kanban */}
                        {canModifyStatus && (
                          <div className="pt-1 flex items-center justify-between gap-2">
                            {prevCol ? (
                              <button
                                type="button"
                                onClick={() => handleMoveState(apt, prevCol.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-[11px] font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                {prevCol.title}
                              </button>
                            ) : (
                              <span />
                            )}

                            {nextCol && (
                              <button
                                type="button"
                                onClick={() => handleMoveState(apt, nextCol.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111111] text-[#D4AF37] text-[11px] font-bold hover:bg-stone-800 transition cursor-pointer ml-auto"
                              >
                                Pasar a {nextCol.title}
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Botón directo de Facturar en POS cuando está Finalizado */}
                        {canSendToPOS && !apt.paid && (
                          <button
                            type="button"
                            onClick={() => handleSendToPOS(apt)}
                            className="w-full py-2 px-3 rounded-lg bg-[#D4AF37] hover:bg-[#e5c042] text-[#111111] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Transferir al POS & Cobrar
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
