import React, { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Scissors,
  Zap,
  ArrowRight,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProductRepository } from '../repositories/ProductRepository'
import { AppointmentRepository } from '../repositories/AppointmentRepository'
import { syncService } from '../services/syncService'
import { useAuth } from '../context/AdminAuthContext'
import {
  formatCurrency,
  getTodayISO,
  timeToMinutes,
  addMinutesToTime,
} from '../lib/utils'

const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
]

export function ReservasPage() {
  const { user, role, isAuthenticated } = useAuth()

  const [services, setServices] = useState([])
  const [employees, setEmployees] = useState([])
  const [dayAppointments, setDayAppointments] = useState([])

  const [selectedServiceId, setSelectedServiceId] = useState('srv-4')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('emp-1')
  const [selectedDate, setSelectedDate] = useState(getTodayISO())
  const [selectedTime, setSelectedTime] = useState('12:00')

  const [customerName, setCustomerName] = useState(
    isAuthenticated && user?.role === 'CONSULTA' ? user.name : ''
  )
  const [customerEmail, setCustomerEmail] = useState(
    isAuthenticated && user?.role === 'CONSULTA' ? user.email : ''
  )
  const [customerPhone, setCustomerPhone] = useState('')
  const [technicalNotes, setTechnicalNotes] = useState('')

  useEffect(() => {
    if (isAuthenticated && user?.role === 'CONSULTA') {
      setCustomerName((prev) => prev || user.name || '')
      setCustomerEmail((prev) => prev || user.email || '')
    }
  }, [isAuthenticated, user])

  const [slotEvaluation, setSlotEvaluation] = useState(null)
  const [lastConfirmedApt, setLastConfirmedApt] = useState(null)

  const loadData = async () => {
    const [srv, emp, appts] = await Promise.all([
      ProductRepository.getAllServices(),
      ProductRepository.getAllEmployees(),
      AppointmentRepository.getAppointmentsByDate(selectedDate),
    ])
    setServices(srv)
    setEmployees(emp)
    setDayAppointments(appts)
  }

  useEffect(() => {
    loadData()
    return syncService.subscribe(() => {
      loadData()
    })
  }, [selectedDate])

  useEffect(() => {
    let active = true
    async function evaluate() {
      if (!selectedServiceId || !selectedEmployeeId || !selectedDate || !selectedTime) return
      const result = await AppointmentRepository.evaluateSlotMatching({
        date: selectedDate,
        startTime: selectedTime,
        serviceId: selectedServiceId,
        employeeId: selectedEmployeeId,
      })
      if (active) setSlotEvaluation(result)
    }
    evaluate()
    return () => {
      active = false
    }
  }, [selectedDate, selectedTime, selectedServiceId, selectedEmployeeId, dayAppointments])

  const selectedService =
    services.find((s) => s.id === selectedServiceId) || services[0]
  const selectedEmployee =
    employees.find((e) => e.id === selectedEmployeeId) || employees[0]

  // Determinar qué bloques están ocupados para el profesional elegido en el selector horario
  const isTimeSlotBusyForSelectedStylist = (timeStr) => {
    if (!selectedService || !selectedEmployee) return false
    const startMin = timeToMinutes(timeStr)
    const endMin = startMin + Number(selectedService.duration || 60)
    const stylistAppts = dayAppointments.filter(
      (a) => a.employeeId === selectedEmployee.id && a.status !== 'CANCELADO'
    )
    return Boolean(
      AppointmentRepository.hasOverlap(stylistAppts, startMin, endMin)
    )
  }

  const isStaff =
    isAuthenticated &&
    (role === 'ADMINISTRADOR' || role === 'VENDEDOR' || role === 'ESTILISTA')

  const handleConfirmBooking = async (overrideSlot = null) => {
    const cleanName = customerName.trim()
    const cleanEmail = customerEmail.trim()
    const cleanPhone = customerPhone.trim()

    if (!cleanName || (!cleanEmail && !cleanPhone)) {
      toast.error('Completa tu nombre y correo o teléfono en el Paso 4 para reservar.', {
        description: 'No necesitas registrarte: con tu correo o teléfono podrás seguir el estado de tu turno.',
      })
      document.getElementById('paso-datos-cliente')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    const targetDate = overrideSlot?.date || selectedDate
    const targetStartTime = overrideSlot?.startTime || selectedTime
    const targetEmployeeId = overrideSlot?.employeeId || selectedEmployeeId
    const targetServiceId = overrideSlot?.serviceId || selectedServiceId

    const initialStatus = isStaff ? 'CONFIRMADO' : 'PENDIENTE'

    const created = await AppointmentRepository.createAppointment({
      customerId: user?.customerId || `cust-${Date.now()}`,
      customerName: cleanName,
      customerEmail: cleanEmail || 'sin-correo@glamstudio.com',
      customerPhone: cleanPhone || '+54 9 11 0000-0000',
      serviceId: targetServiceId,
      employeeId: targetEmployeeId,
      date: targetDate,
      startTime: targetStartTime,
      technicalNotes,
      salonStatus: 'En espera',
      status: initialStatus,
      confirmedBy: isStaff ? user?.name : null,
      confirmedAt: isStaff ? new Date().toISOString() : null,
    })

    try {
      sessionStorage.setItem(
        'glamstudio_last_booking_contact',
        cleanEmail || cleanPhone
      )
    } catch (e) {
      // ignore
    }

    setLastConfirmedApt(created)
    setSelectedEmployeeId(targetEmployeeId)
    setSelectedTime(targetStartTime)

    if (isStaff) {
      toast.success('¡Turno agendado y confirmado!', {
        description: `${created.serviceName} con ${created.employeeName} (${created.date} · ${created.startTime} hs).`,
      })
    } else {
      toast.success('¡Solicitud de Turno Recibida!', {
        description: `El horario ${created.startTime} hs quedó reservado para ti y fue enviado a Recepción y a ${created.employeeName} para su confirmación.`,
      })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#8A6D1B]">
            <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
            Reserva Online • Sin Necesidad de Registro
          </span>
          <h1 className="font-serif-luxury text-3xl sm:text-5xl font-bold text-[#111111] mt-1">
            Reserva tu Turno Online
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            Elige tu servicio, estilista y horario libre. Si seleccionas una franja que ya está ocupada, nuestro motor inteligente te sugerirá horarios libres cercanos o profesionales alternativos.
          </p>
        </div>
      </div>

      {/* Banner de Reserva Recién Registrada */}
      {lastConfirmedApt && (
        <div className="bg-emerald-950 text-emerald-100 border border-emerald-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-[#10B981] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest text-[#10B981] font-bold">
                {lastConfirmedApt.status === 'CONFIRMADO'
                  ? '✓ Turno Confirmado en Agenda'
                  : '⏳ Horario Bloqueado para Ti • Enviado al Salón para Confirmación'}
              </span>
              <h3 className="font-serif-luxury text-2xl font-bold text-white">
                {lastConfirmedApt.serviceName} — {lastConfirmedApt.startTime} a{' '}
                {lastConfirmedApt.endTime} hs
              </h3>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Profesional: <strong>{lastConfirmedApt.employeeName}</strong> ({lastConfirmedApt.station}) • Cliente:{' '}
                <strong>{lastConfirmedApt.customerName}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/agenda"
              className="px-4 py-2 rounded-xl bg-[#10B981] text-[#111111] text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 transition"
            >
              Seguir Mi Turno
            </Link>
            {isAuthenticated && role !== 'CONSULTA' && (
              <Link
                to="/salon"
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
              >
                Ir al Tablero Kanban
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN DEL TURNO */}
        <div className="lg:col-span-7 space-y-6">
          {/* Paso 1: Elegir Servicio */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif-luxury text-2xl font-bold text-[#111111] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-[#D4AF37] text-xs font-sans font-bold flex items-center justify-center">
                  1
                </span>
                Selecciona el Servicio Capilar
              </h2>
              {selectedService && (
                <span className="text-xs font-semibold text-[#8A6D1B] bg-[#D4AF37]/15 px-3 py-1 rounded-full">
                  Duración estimada: {selectedService.duration} min
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((srv) => {
                const isSelected = srv.id === selectedServiceId
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setSelectedServiceId(srv.id)}
                    className={`text-left p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#D4AF37]/12 shadow-xs ring-1 ring-[#D4AF37]'
                        : 'border-stone-200 bg-[#F9F8F6]/60 hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          {srv.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600">
                          <Clock className="w-3 h-3 text-[#D4AF37]" />
                          {srv.duration} min
                        </span>
                      </div>
                      <p className="font-serif-luxury text-lg font-bold text-[#111111] mt-0.5">
                        {srv.name}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                      <span className="text-xs font-bold text-[#111111]">
                        {formatCurrency(srv.price)}
                      </span>
                      {isSelected && (
                        <span className="text-[11px] font-bold text-[#8A6D1B]">
                          Seleccionado ✓
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Paso 2: Elegir Profesional */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs space-y-4">
            <h2 className="font-serif-luxury text-2xl font-bold text-[#111111] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#111111] text-[#D4AF37] text-xs font-sans font-bold flex items-center justify-center">
                2
              </span>
              Elige tu Estilista Profesional
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {employees.map((emp) => {
                const isSelected = emp.id === selectedEmployeeId
                const empAppts = dayAppointments.filter((a) => a.employeeId === emp.id)
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setSelectedEmployeeId(emp.id)}
                    className={`text-left p-3.5 rounded-xl border transition cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#D4AF37]/12 ring-1 ring-[#D4AF37]'
                        : 'border-stone-200 bg-[#F9F8F6]/60 hover:border-stone-300'
                    }`}
                  >
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#D4AF37]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-serif-luxury text-lg font-bold text-[#111111] truncate">
                        {emp.name}
                      </p>
                      <p className="text-xs text-[#8A6D1B] truncate">{emp.specialty}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {emp.station} • {empAppts.length} turnos hoy
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Paso 3: Fecha y Horario (Con Semaforización en Vivo) */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif-luxury text-2xl font-bold text-[#111111] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-[#D4AF37] text-xs font-sans font-bold flex items-center justify-center">
                  3
                </span>
                Fecha y Franja Horaria Solicitada
              </h2>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold bg-[#F9F8F6] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 bg-[#F9F8F6] p-3 rounded-xl border border-stone-200">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Horario Libre
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Ocupado (Activa Slot Matching al hacer clic)
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
              {TIME_SLOTS.map((slot) => {
                const isBusy = isTimeSlotBusyForSelectedStylist(slot)
                const isSelected = selectedTime === slot
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-mono font-bold border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? isBusy
                          ? 'bg-[#EF4444] text-white border-[#EF4444] shadow-md scale-105'
                          : 'bg-[#111111] text-[#D4AF37] border-[#D4AF37] shadow-md scale-105'
                        : isBusy
                        ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/20'
                        : 'bg-[#10B981]/10 text-emerald-900 border-[#10B981]/30 hover:bg-[#10B981]/20'
                    }`}
                  >
                    <span>{slot}</span>
                    <span className="text-[9px] font-sans uppercase tracking-tighter opacity-85">
                      {isBusy ? 'Ocupado' : 'Libre'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Paso 4: Datos del Cliente y Notas Capilares */}
          <div id="paso-datos-cliente" className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif-luxury text-2xl font-bold text-[#111111] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-[#D4AF37] text-xs font-sans font-bold flex items-center justify-center">
                  4
                </span>
                Tus Datos de Contacto (Sin Registro Obligatorio)
              </h2>
              <span className="text-[11px] text-stone-500">
                Con tu correo o teléfono podrás seguir la confirmación en "Mi turno"
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  WhatsApp / Teléfono
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Fórmula Capilar / Alergias / Preferencias para el Estilista
              </label>
              <textarea
                rows={2}
                value={technicalNotes}
                onChange={(e) => setTechnicalNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F9F8F6] border border-stone-200 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: RESUMEN Y MOTOR INTELIGENTE SLOT MATCHING */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {slotEvaluation?.isAvailable ? (
            /* ESTADO DISPONIBLE (#10B981) */
            <div className="bg-[#111111] text-[#F9F8F6] rounded-2xl border border-[#10B981]/50 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/20 text-[#10B981] text-xs font-bold border border-[#10B981]/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Franja Horaria Disponible
                </span>
                <span className="text-xs font-mono text-stone-400">
                  {selectedDate}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                    Servicio Seleccionado
                  </span>
                  <h3 className="font-serif-luxury text-2xl font-bold text-white">
                    {selectedService?.name}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10 text-xs">
                  <div>
                    <span className="text-stone-400 block">Horario Exacto</span>
                    <span className="font-mono font-bold text-[#10B981] text-sm">
                      {selectedTime} a{' '}
                      {addMinutesToTime(selectedTime, selectedService?.duration || 60)} hs
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Duración Calculada</span>
                    <span className="font-bold text-white text-sm">
                      {selectedService?.duration} minutos
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Profesional</span>
                    <span className="font-bold text-[#D4AF37]">
                      {selectedEmployee?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Valor Estimado</span>
                    <span className="font-bold text-white">
                      {formatCurrency(selectedService?.price)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleConfirmBooking()}
                className="w-full py-3.5 px-5 rounded-xl bg-[#10B981] hover:bg-emerald-400 text-[#111111] font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Turno Ahora (1 Clic)
              </button>
            </div>
          ) : (
            /* ESTADO CONFLICTO: MOTOR DE SUGERENCIA AUTOMÁTICA (SLOT MATCHING) */
            <div className="bg-[#111111] text-[#F9F8F6] rounded-2xl border-2 border-[#D4AF37] p-6 shadow-2xl space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EF4444]/20 text-[#EF4444] text-[11px] font-bold border border-[#EF4444]/40">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Horario Ocupado ({selectedTime} hs)
                  </span>
                  <h3 className="font-serif-luxury text-2xl font-bold text-white mt-2">
                    Motor Inteligente Slot Matching
                  </h3>
                </div>
                <Sparkles className="w-6 h-6 text-[#D4AF37] shrink-0" />
              </div>

              {/* Detalle del conflicto detectado */}
              {slotEvaluation?.conflict && (
                <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs space-y-1">
                  <p className="font-bold text-red-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Colisión de agenda detectada para {selectedEmployee?.name}:
                  </p>
                  {slotEvaluation.conflict.serviceName ? (
                    <p className="text-stone-300">
                      Ya posee un turno de <strong>{slotEvaluation.conflict.serviceName}</strong>{' '}
                      ({slotEvaluation.conflict.startTime} a {slotEvaluation.conflict.endTime} hs) y el servicio solicitado requiere{' '}
                      <strong>{selectedService?.duration} min</strong>.
                    </p>
                  ) : (
                    <p className="text-stone-300">{slotEvaluation.conflict.reason}</p>
                  )}
                </div>
              )}

              {/* SUGERENCIAS A: MISMO PROFESIONAL ANTES / DESPUÉS */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  1. Franjas Cercanas con {selectedEmployee?.name}:
                </p>

                {slotEvaluation?.sameStylistAlternatives?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {slotEvaluation.sameStylistAlternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-between gap-3 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-[#10B981]">
                              {alt.startTime} - {alt.endTime} hs
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-semibold">
                              {alt.diffLabel}
                            </span>
                          </div>
                          <p className="text-xs text-stone-300 mt-0.5">
                            Mismo profesional: <strong>{alt.employeeName}</strong> ({alt.station})
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmBooking(alt)}
                          className="px-3.5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#e5c145] text-[#111111] text-xs font-bold uppercase tracking-wider shrink-0 transition cursor-pointer"
                        >
                          Reservar 1-Clic
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic">
                    Sin huecos de {selectedService?.duration} min con este profesional hoy.
                  </p>
                )}
              </div>

              {/* SUGERENCIAS B: PROFESIONAL ALTERNATIVO EN EL MISMO HORARIO */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  2. Mismo Horario ({selectedTime} hs) con Otro Profesional:
                </p>

                {slotEvaluation?.otherStylistAlternatives?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {slotEvaluation.otherStylistAlternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={alt.employeeAvatar}
                            alt={alt.employeeName}
                            className="w-9 h-9 rounded-full object-cover border border-[#10B981]"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-[#10B981]">
                                {alt.startTime} - {alt.endTime} hs
                              </span>
                              <span className="text-[10px] text-emerald-300 font-semibold">
                                ({alt.diffLabel})
                              </span>
                            </div>
                            <p className="text-xs font-bold text-white truncate">
                              {alt.employeeName}
                            </p>
                            <p className="text-[10px] text-stone-400 truncate">
                              {alt.employeeSpecialty}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmBooking(alt)}
                          className="px-3.5 py-2 rounded-lg bg-[#10B981] hover:bg-emerald-400 text-[#111111] text-xs font-bold uppercase tracking-wider shrink-0 transition cursor-pointer"
                        >
                          Confirmar 1-Clic
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic">
                    No hay otros estilistas disponibles en esta franja.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
