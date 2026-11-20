import React, { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  Columns3,
  Plus,
  Trash2,
  Search,
  LogIn,
  Lock,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { ProductRepository } from '../repositories/ProductRepository'
import { syncService } from '../services/syncService'
import { useAuth } from '../context/AdminAuthContext'
import { formatCurrency, getTodayISO } from '../lib/utils'
import { SALON_COLUMNS } from './salon'

export function AgendaPage() {
  const { user, role, isAuthenticated, setIsLoginModalOpen } = useAuth()

  const [appointments, setAppointments] = useState([])
  const [employees, setEmployees] = useState([])
  const [customers, setCustomers] = useState([])
  const [selectedDate, setSelectedDate] = useState(getTodayISO())
  const [showAllDates, setShowAllDates] = useState(true)
  const [selectedStylist, setSelectedStylist] = useState('ALL')

  // Búsqueda privada de turno para visitantes sin sesión iniciada
  const [lookupInput, setLookupInput] = useState(() => {
    try {
      return sessionStorage.getItem('glamstudio_last_booking_contact') || ''
    } catch (e) {
      return ''
    }
  })
  const [submittedLookup, setSubmittedLookup] = useState(() => {
    try {
      return sessionStorage.getItem('glamstudio_last_booking_contact') || ''
    } catch (e) {
      return ''
    }
  })

  const isStaff =
    isAuthenticated &&
    (role === 'ADMINISTRADOR' || role === 'VENDEDOR' || role === 'ESTILISTA')

  const loadAgenda = async () => {
    const [appts, emps, custs] = await Promise.all([
      AppointmentRepository.getAllAppointments(),
      ProductRepository.getAllEmployees(),
      AppointmentRepository.getAllCustomers(),
    ])
    setAppointments(appts.filter((a) => a.status !== 'CANCELADO'))
    setEmployees(emps)
    setCustomers(custs)
  }

  useEffect(() => {
    loadAgenda()
    return syncService.subscribe((payload) => {
      loadAgenda()
      if (
        payload?.channel === 'appointments' &&
        payload?.action === 'staff_confirmed' &&
        !isStaff &&
        payload?.data
      ) {
        toast.success('🎉 ¡Tu reserva fue confirmada con éxito por el salón!', {
          description: `${payload.data.serviceName} (${payload.data.date} · ${payload.data.startTime} hs con ${payload.data.employeeName})`,
        })
      }
    })
  }, [isStaff])

  useEffect(() => {
    if (role === 'ESTILISTA' && user?.employeeId) {
      setSelectedStylist(user.employeeId)
    } else {
      setSelectedStylist('ALL')
    }
  }, [role, user?.employeeId])

  const handleQuickStatusUpdate = async (apt, status) => {
    if (!isStaff) return
    await AppointmentRepository.updateAppointmentStatus(apt.id, {
      salonStatus: status,
    })
    toast.success(`Estado actualizado: ${status}`)
  }

  const handleConfirmByStaff = async (apt) => {
    if (!isStaff) return
    await AppointmentRepository.confirmAppointmentByStaff(apt.id, user)
    toast.success(`✓ Reserva confirmada a ${apt.customerName}`, {
      description: 'El cliente ya puede ver la confirmación exitosa en "Mi turno".',
    })
  }

  const handleCancelAppointment = async (apt) => {
    if (role !== 'ADMINISTRADOR' && role !== 'VENDEDOR') return
    await AppointmentRepository.deleteAppointment(apt.id)
    toast.info(`Turno de ${apt.customerName} liberado de la agenda.`)
  }

  // -------------------------------------------------------------------------
  // VISTA 1: VISITANTE PÚBLICO SIN SESIÓN INICIADA (PRIVACIDAD TOTAL)
  // -------------------------------------------------------------------------
  if (!isAuthenticated) {
    const cleanQuery = submittedLookup.trim().toLowerCase()
    const matchedTurns = cleanQuery
      ? appointments.filter(
          (apt) =>
            apt.customerEmail?.toLowerCase() === cleanQuery ||
            apt.id?.toLowerCase() === cleanQuery ||
            (apt.customerPhone &&
              apt.customerPhone.replace(/\D/g, '').endsWith(cleanQuery.replace(/\D/g, '')) &&
              cleanQuery.replace(/\D/g, '').length >= 6)
        )
      : []

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8A6D1B]">
                Consulta Privada de Reservas
              </span>
              <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#111111] mt-1">
                Seguimiento de Mi Turno
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Por privacidad de nuestros clientes, ingresa tu correo electrónico o inicia sesión para consultar el estado de tu reserva.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] text-[#D4AF37] text-xs font-semibold hover:bg-stone-800 transition shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <LogIn className="w-4 h-4" />
              Iniciar sesión
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSubmittedLookup(lookupInput)
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value)}
                placeholder="Ingresa el correo o teléfono con el que reservaste…"
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#F9F8F6] border border-stone-200 text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-6 rounded-xl bg-[#D4AF37] text-[#111111] text-sm font-semibold hover:bg-[#c9a42f] transition cursor-pointer whitespace-nowrap"
            >
              Buscar mi turno
            </button>
          </form>

          {cleanQuery && (
            <div className="pt-4 space-y-4">
              {matchedTurns.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#F9F8F6] border border-stone-200 text-center space-y-2">
                  <p className="font-serif-luxury text-xl font-bold text-[#111111]">
                    No encontramos turnos asociados a "{submittedLookup}"
                  </p>
                  <p className="text-xs text-stone-500">
                    Verifica que el correo o teléfono coincida exactamente con tu reserva, o agenda un nuevo turno online.
                  </p>
                </div>
              ) : (
                matchedTurns.map((apt) => (
                  <CustomerAppointmentCard key={apt.id} apt={apt} />
                ))
              )}
            </div>
          )}

          <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
            <span>¿Aún no tienes una reserva confirmada?</span>
            <Link
              to="/reservas"
              className="inline-flex items-center gap-1.5 font-semibold text-[#111111] hover:text-[#8A6D1B]"
            >
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              Reservar turno online →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // VISTA 2: CLIENTE AUTENTICADO (ROL CONSULTA) — SOLO SUS PROPIOS TURNOS,
  // SIN NOTAS TÉCNICAS INTERNAS NI BOTÓN KANBAN
  // -------------------------------------------------------------------------
  if (role === 'CONSULTA') {
    const myAppointments = appointments.filter(
      (apt) =>
        apt.customerEmail?.toLowerCase() === user?.email?.toLowerCase() ||
        (user?.customerId && apt.customerId === user.customerId)
    )

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A6D1B]">
              Portal del Cliente • {user?.name}
            </span>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#111111] mt-1">
              Mis Turnos & Estado en Vivo
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Sigue en tiempo real la etapa de atención de tus reservas en el salón.
            </p>
          </div>

          <Link
            to="/reservas"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37] text-[#111111] text-xs font-bold uppercase tracking-wider hover:bg-[#c9a42f] transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Reservar nuevo turno
          </Link>
        </div>

        {myAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center space-y-3">
            <Calendar className="w-8 h-8 text-[#D4AF37] mx-auto" />
            <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
              Aún no tienes turnos reservados
            </h3>
            <p className="text-xs text-stone-500">
              Elige tu servicio y profesional favorito para reservar tu próximo turno.
            </p>
            <Link
              to="/reservas"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] text-[#D4AF37] text-xs font-bold uppercase tracking-wider"
            >
              Reservar Ahora
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myAppointments.map((apt) => (
              <CustomerAppointmentCard key={apt.id} apt={apt} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // VISTA 3: STAFF DEL SALÓN (ESTILISTA / VENDEDOR / ADMINISTRADOR)
  // -------------------------------------------------------------------------
  const dateFiltered = showAllDates
    ? appointments
    : appointments.filter((a) => a.date === selectedDate)

  const filtered = dateFiltered.filter((apt) => {
    if (selectedStylist !== 'ALL' && apt.employeeId !== selectedStylist) {
      return false
    }
    return true
  })

  const newOnlineBookings = appointments.filter((a) => a.isNewOnlineBooking)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A6D1B]">
            {role === 'ESTILISTA'
              ? 'Agenda de Profesional & Recepción de Turnos'
              : 'Agenda Operativa Multiprofesional'}
          </span>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#111111] mt-1">
            {role === 'ESTILISTA'
              ? `Agenda de Turnos — ${user?.name}`
              : 'Agenda General de Turnos GlamStudio'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAllDates((v) => !v)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              showAllDates
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
            className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold"
          />

          <select
            value={selectedStylist}
            onChange={(e) => setSelectedStylist(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold"
          >
            <option value="ALL">Todos los Profesionales ({dateFiltered.length})</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} {user?.employeeId === e.id ? '(Mis Turnos)' : ''}
              </option>
            ))}
          </select>

          <Link
            to="/salon"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-[#111111] hover:border-[#D4AF37]"
          >
            <Columns3 className="w-3.5 h-3.5 text-[#D4AF37]" />
            Vista Kanban
          </Link>

          <Link
            to="/reservas"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-[#D4AF37] text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Turno
          </Link>
        </div>
      </div>

      {/* Aviso de nuevas reservas online recibidas para Administrador, Vendedor y Estilistas */}
      {newOnlineBookings.length > 0 && (
        <div className="bg-[#111111] text-[#F9F8F6] rounded-2xl border border-[#D4AF37]/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping shrink-0" />
            <div className="text-xs">
              <strong className="text-[#D4AF37] uppercase tracking-wider">
                {newOnlineBookings.length} {newOnlineBookings.length === 1 ? 'Nueva Reserva Online Recibida' : 'Nuevas Reservas Online Recibidas'}
              </strong>
              <p className="text-stone-300 mt-0.5">
                Última reserva: <strong>{newOnlineBookings[newOnlineBookings.length - 1].customerName}</strong> — {newOnlineBookings[newOnlineBookings.length - 1].serviceName} ({newOnlineBookings[newOnlineBookings.length - 1].date} a las {newOnlineBookings[newOnlineBookings.length - 1].startTime} hs con {newOnlineBookings[newOnlineBookings.length - 1].employeeName}).
              </p>
            </div>
          </div>
          {selectedStylist !== 'ALL' && (
            <button
              type="button"
              onClick={() => {
                setSelectedStylist('ALL')
                setShowAllDates(true)
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#111111] text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              Ver todos los estilistas
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center space-y-3">
            <Calendar className="w-8 h-8 text-[#D4AF37] mx-auto" />
            <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
              No hay turnos agendados para esta fecha
            </h3>
            <p className="text-xs text-stone-500">
              Utiliza el motor inteligente de reservas para asignar una nueva franja horaria.
            </p>
          </div>
        ) : (
          filtered.map((apt) => {
            const customerRecord = customers.find(
              (c) =>
                c.id === apt.customerId ||
                c.name.toLowerCase() === apt.customerName.toLowerCase()
            )
            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs hover:border-[#D4AF37]/60 transition flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#111111] text-[#D4AF37] text-center min-w-[92px]">
                    <span className="block font-mono text-sm font-bold">
                      {apt.startTime}
                    </span>
                    <span className="block text-[10px] text-stone-400 font-mono">
                      a {apt.endTime}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-stone-500">
                        {apt.date}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8A6D1B]">
                        {apt.station}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="text-xs font-semibold text-stone-600">
                        Prof: <strong>{apt.employeeName}</strong>
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          apt.status === 'PENDIENTE'
                            ? 'bg-amber-500/20 text-amber-800 border border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-800'
                        }`}
                      >
                        {apt.status === 'PENDIENTE'
                          ? '⏳ PENDIENTE DE CONFIRMAR AL CLIENTE'
                          : '✓ CONFIRMADO'}
                      </span>
                      {apt.isNewOnlineBooking && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#111111] text-[10px] font-bold uppercase tracking-wider">
                          ✨ Nueva Reserva Online
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif-luxury text-2xl font-bold text-[#111111]">
                      {apt.serviceName} —{' '}
                      <span className="text-[#8A6D1B]">{apt.customerName}</span>
                    </h3>

                    {/* Ficha técnica visible únicamente para el personal del salón */}
                    <div className="p-3 rounded-xl bg-[#F9F8F6] border border-stone-200/80 text-xs text-stone-700 space-y-1">
                      <p className="font-semibold text-[#111111] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Ficha Técnica Confidencial (Uso Interno):
                      </p>
                      <p>{apt.technicalNotes}</p>
                      {customerRecord?.allergies && (
                        <p className="text-amber-800 font-medium">
                          ⚠️ Alergias/Sensibilidad: {customerRecord.allergies}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-100">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                      Arancel Servicio
                    </span>
                    <span className="font-serif-luxury text-2xl font-bold text-[#111111]">
                      {formatCurrency(apt.servicePrice)}
                    </span>
                  </div>

                  {apt.status === 'PENDIENTE' && (
                    <button
                      type="button"
                      onClick={() => handleConfirmByStaff(apt)}
                      className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-[#111111] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      ✓ Confirmar Reserva al Cliente
                    </button>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    {SALON_COLUMNS.map((col) => {
                      const active = apt.salonStatus === col.id
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleQuickStatusUpdate(apt, col.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            active
                              ? 'bg-[#111111] text-[#D4AF37] border-[#D4AF37]'
                              : 'bg-[#F9F8F6] text-stone-600 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {col.title}
                        </button>
                      )
                    })}

                    {(role === 'ADMINISTRADOR' || role === 'VENDEDOR') && (
                      <button
                        type="button"
                        onClick={() => handleCancelAppointment(apt)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Cancelar / Liberar turno"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/**
 * Tarjeta limpia para el Cliente: muestra solo los datos de su propia reserva
 * y una barra de progreso visual de su atención en el salón, sin exponer notas internas.
 */
function CustomerAppointmentCard({ apt }) {
  const steps = ['En espera', 'En bacha', 'En proceso', 'Listo / Finalizado']
  const currentStepIndex = Math.max(0, steps.indexOf(apt.salonStatus))
  const isConfirmed = apt.status === 'CONFIRMADO'

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
      {/* Banner de estado de confirmación de la reserva */}
      {isConfirmed ? (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>
              ¡Tu turno fue verificado y <strong>CONFIRMADO CON ÉXITO</strong> por el salón!
              {apt.confirmedBy ? ` (Verificado por ${apt.confirmedBy})` : ''}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-semibold">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Horario reservado y bloqueado para ti</strong> • Pendiente de confirmación por Recepción / Estilista.
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="px-3.5 py-2.5 rounded-xl bg-[#111111] text-[#D4AF37] text-center min-w-[92px]">
            <span className="block font-mono text-sm font-bold">{apt.startTime}</span>
            <span className="block text-[10px] text-stone-400 font-mono">
              a {apt.endTime}
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono text-stone-500">{apt.date}</span>
              <span className="text-stone-300">•</span>
              <span className="font-semibold text-[#8A6D1B]">{apt.station}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isConfirmed
                    ? 'bg-emerald-500/15 text-emerald-800'
                    : 'bg-amber-500/20 text-amber-800'
                }`}
              >
                {isConfirmed ? '✓ CONFIRMADO' : '⏳ PENDIENTE DE APROBACIÓN'}
              </span>
            </div>
            <h3 className="font-serif-luxury text-2xl font-bold text-[#111111] mt-1">
              {apt.serviceName}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Estilista asignado: <strong className="text-[#111111]">{apt.employeeName}</strong> ({apt.duration} min)
            </p>
          </div>
        </div>

        <div className="sm:text-right">
          <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
            Valor del Servicio
          </span>
          <span className="font-serif-luxury text-2xl font-bold text-[#111111]">
            {formatCurrency(apt.servicePrice)}
          </span>
        </div>
      </div>

      {/* Barra de Progreso Visual en el Salón (solo lectura para el cliente) */}
      <div className="pt-4 border-t border-stone-100">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-3">
          Progreso de atención en salón:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex
            const isDone = idx < currentStepIndex
            return (
              <div
                key={step}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-[#111111] text-[#D4AF37] border-[#D4AF37]'
                    : isDone
                    ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30'
                    : 'bg-[#F9F8F6] text-stone-400 border-stone-200'
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isCurrent
                      ? 'text-[#D4AF37]'
                      : isDone
                      ? 'text-emerald-600'
                      : 'text-stone-300'
                  }`}
                />
                <span className="truncate">{step}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
