import {
  STORES,
  getAllFromStore,
  putInStore,
  deleteFromStore,
  ensureSeedData,
} from '../db/indexedDb'
import { syncService, SYNC_CHANNELS } from '../services/syncService'
import { timeToMinutes, minutesToTime, addMinutesToTime } from '../lib/utils'

const SALON_HOURS_KEY = 'glamstudio_salon_hours'
const STAFF_NOTIFS_KEY = 'glamstudio_staff_notifications_v1'

export const AppointmentRepository = {
  getSalonHours() {
    try {
      const raw = localStorage.getItem(SALON_HOURS_KEY)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      // fallback
    }
    return { openTime: '09:00', closeTime: '20:00', slotStepMinutes: 30 }
  },

  saveSalonHours(config) {
    const updated = { ...this.getSalonHours(), ...config }
    localStorage.setItem(SALON_HOURS_KEY, JSON.stringify(updated))
    syncService.emit(SYNC_CHANNELS.SALON_CONFIG, 'update', updated)
    return updated
  },

  async getAllAppointments() {
    await ensureSeedData()
    const list = await getAllFromStore(STORES.APPOINTMENTS)
    return list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    })
  },

  async getAppointmentsByDate(dateISO) {
    const all = await this.getAllAppointments()
    return all.filter((a) => a.date === dateISO && a.status !== 'CANCELADO')
  },

  async getAllCustomers() {
    await ensureSeedData()
    return getAllFromStore(STORES.CUSTOMERS)
  },

  async saveCustomer(customerData) {
    await ensureSeedData()
    const item = {
      ...customerData,
      id: customerData.id || `cust-${Date.now()}`,
      visits: Number(customerData.visits ?? 1),
      favorites: Array.isArray(customerData.favorites) ? customerData.favorites : [],
    }
    await putInStore(STORES.CUSTOMERS, item)
    syncService.emit(SYNC_CHANNELS.CUSTOMERS, 'save', item)
    return item
  },

  /**
   *Verifica si un rango [startMin, endMin] colisiona con los turnos de un estilista en esa fecha
   */
  hasOverlap(appointmentsForStylist, startMin, endMin, ignoreAppointmentId = null) {
    return appointmentsForStylist.find((apt) => {
      if (ignoreAppointmentId && apt.id === ignoreAppointmentId) return false
      if (apt.status === 'CANCELADO') return false
      const aptStart = timeToMinutes(apt.startTime)
      const aptEnd = timeToMinutes(apt.endTime || addMinutesToTime(apt.startTime, apt.duration || 60))
      return startMin < aptEnd && endMin > aptStart
    })
  },

  /**
   * MOTOR INTELIGENTE DE TURNOS Y SUGERENCIA AUTOMÁTICA (SLOT MATCHING)
   * Calcula nativamente la duración del servicio y, si el horario solicitado está ocupado,
   * devuelve sugerencias inmediatas:
   * 1) Mismo profesional en franjas libres cercanas (antes/después en el día)
   * 2) Profesionales alternativos disponibles en el mismo horario exacto o cercano
   */
  async evaluateSlotMatching({ date, startTime, serviceId, employeeId, ignoreAppointmentId = null }) {
    await ensureSeedData()
    const [services, employees, dayAppointments] = await Promise.all([
      getAllFromStore(STORES.SERVICES),
      getAllFromStore(STORES.EMPLOYEES),
      this.getAppointmentsByDate(date),
    ])

    const service = services.find((s) => s.id === serviceId) || services[0]
    const duration = Number(service?.duration || 60)
    const stylist = employees.find((e) => e.id === employeeId) || employees[0]

    const { openTime, closeTime, slotStepMinutes = 30 } = this.getSalonHours()
    const openMin = timeToMinutes(stylist?.workStart || openTime)
    const closeMin = timeToMinutes(stylist?.workEnd || closeTime)

    const requestedStartMin = timeToMinutes(startTime)
    const requestedEndMin = requestedStartMin + duration

    const stylistAppointments = dayAppointments.filter((a) => a.employeeId === stylist.id)
    const conflictingAppointment = this.hasOverlap(
      stylistAppointments,
      requestedStartMin,
      requestedEndMin,
      ignoreAppointmentId
    )

    const outOfHours = requestedStartMin < openMin || requestedEndMin > closeMin

    if (!conflictingAppointment && !outOfHours) {
      return {
        isAvailable: true,
        requestedSlot: {
          date,
          startTime,
          endTime: minutesToTime(requestedEndMin),
          duration,
          employeeId: stylist.id,
          employeeName: stylist.name,
          station: stylist.station,
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.price,
        },
        conflict: null,
        sameStylistAlternatives: [],
        otherStylistAlternatives: [],
      }
    }

    // 1. Buscar franjas libres cercanas con el MISMO estilista en ese día
    const sameStylistCandidates = []
    for (let t = openMin; t + duration <= closeMin; t += slotStepMinutes) {
      if (t === requestedStartMin) continue
      const conflict = this.hasOverlap(stylistAppointments, t, t + duration, ignoreAppointmentId)
      if (!conflict) {
        const diffMinutes = t - requestedStartMin
        sameStylistCandidates.push({
          id: `alt-same-${stylist.id}-${minutesToTime(t)}`,
          type: 'SAME_STYLIST',
          badge: diffMinutes < 0 ? 'Más temprano (Mismo Profesional)' : 'Más tarde (Mismo Profesional)',
          date,
          startTime: minutesToTime(t),
          endTime: minutesToTime(t + duration),
          duration,
          employeeId: stylist.id,
          employeeName: stylist.name,
          employeeSpecialty: stylist.specialty,
          employeeAvatar: stylist.avatar,
          station: stylist.station,
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.price,
          diffAbs: Math.abs(diffMinutes),
          diffLabel:
            diffMinutes < 0
              ? `${Math.abs(diffMinutes)} min antes`
              : `${diffMinutes} min después`,
        })
      }
    }

    sameStylistCandidates.sort((a, b) => a.diffAbs - b.diffAbs)
    const sameStylistAlternatives = sameStylistCandidates.slice(0, 4)

    // 2. Buscar otros profesionales disponibles en el MISMO horario solicitado (o ±30 min)
    const otherStylistAlternatives = []
    const otherEmployees = employees.filter((e) => e.active !== false && e.id !== stylist.id)

    for (const altEmp of otherEmployees) {
      const empAppts = dayAppointments.filter((a) => a.employeeId === altEmp.id)
      const exactConflict = this.hasOverlap(empAppts, requestedStartMin, requestedEndMin, ignoreAppointmentId)

      if (!exactConflict && requestedStartMin >= openMin && requestedEndMin <= closeMin) {
        otherStylistAlternatives.push({
          id: `alt-emp-${altEmp.id}-${startTime}`,
          type: 'ALTERNATIVE_STYLIST_EXACT',
          badge: 'Mismo horario • Otro Profesional',
          date,
          startTime,
          endTime: minutesToTime(requestedEndMin),
          duration,
          employeeId: altEmp.id,
          employeeName: altEmp.name,
          employeeSpecialty: altEmp.specialty,
          employeeAvatar: altEmp.avatar,
          station: altEmp.station,
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.price,
          diffAbs: 0,
          diffLabel: 'Mismo horario exacto',
        })
      } else {
        // Probar ±30 o ±60 min con este estilista alternativo
        for (const offset of [-30, 30, -60, 60]) {
          const tryStart = requestedStartMin + offset
          const tryEnd = tryStart + duration
          if (tryStart < openMin || tryEnd > closeMin) continue
          if (!this.hasOverlap(empAppts, tryStart, tryEnd, ignoreAppointmentId)) {
            otherStylistAlternatives.push({
              id: `alt-emp-${altEmp.id}-${minutesToTime(tryStart)}`,
              type: 'ALTERNATIVE_STYLIST_NEAR',
              badge: 'Horario cercano • Otro Profesional',
              date,
              startTime: minutesToTime(tryStart),
              endTime: minutesToTime(tryEnd),
              duration,
              employeeId: altEmp.id,
              employeeName: altEmp.name,
              employeeSpecialty: altEmp.specialty,
              employeeAvatar: altEmp.avatar,
              station: altEmp.station,
              serviceId: service.id,
              serviceName: service.name,
              servicePrice: service.price,
              diffAbs: Math.abs(offset),
              diffLabel: offset < 0 ? `${Math.abs(offset)} min antes` : `${offset} min después`,
            })
            break
          }
        }
      }
    }

    return {
      isAvailable: false,
      requestedSlot: {
        date,
        startTime,
        endTime: minutesToTime(requestedEndMin),
        duration,
        employeeId: stylist.id,
        employeeName: stylist.name,
      },
      conflict: conflictingAppointment
        ? {
            id: conflictingAppointment.id,
            customerName: conflictingAppointment.customerName,
            serviceName: conflictingAppointment.serviceName,
            startTime: conflictingAppointment.startTime,
            endTime: conflictingAppointment.endTime,
            employeeName: conflictingAppointment.employeeName,
          }
        : {
            reason: 'Fuera del horario de apertura/cierre del salón',
          },
      sameStylistAlternatives,
      otherStylistAlternatives,
    }
  },

  async createAppointment(appointmentData) {
    await ensureSeedData()
    const [services, employees] = await Promise.all([
      getAllFromStore(STORES.SERVICES),
      getAllFromStore(STORES.EMPLOYEES),
    ])

    const service = services.find((s) => s.id === appointmentData.serviceId) || services[0]
    const stylist = employees.find((e) => e.id === appointmentData.employeeId) || employees[0]
    const duration = Number(appointmentData.duration || service.duration || 60)
    const endTime = addMinutesToTime(appointmentData.startTime, duration)

    const newAppointment = {
      id: `apt-${Date.now()}`,
      customerId: appointmentData.customerId || 'cust-guest',
      customerName: appointmentData.customerName || 'Cliente GlamStudio',
      customerEmail: appointmentData.customerEmail || 'cliente@glamstudio.com',
      customerPhone: appointmentData.customerPhone || '+54 9 11 5555-0100',
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: Number(service.price),
      duration,
      employeeId: stylist.id,
      employeeName: stylist.name,
      station: appointmentData.station || stylist.station,
      date: appointmentData.date,
      startTime: appointmentData.startTime,
      endTime,
      salonStatus: appointmentData.salonStatus || 'En espera',
      status: appointmentData.status || 'PENDIENTE',
      confirmedBy: appointmentData.confirmedBy || null,
      confirmedAt: appointmentData.confirmedAt || null,
      technicalNotes:
        appointmentData.technicalNotes ||
        'Sin observaciones adicionales. Realizar diagnóstico capilar previo en sillón.',
      paid: false,
      isNewOnlineBooking: true,
      createdAt: new Date().toISOString(),
    }

    await putInStore(STORES.APPOINTMENTS, newAppointment)

    // Registrar notificación inmediata para ADMINISTRADOR, VENDEDOR y ESTILISTA
    try {
      const currentNotifs = this.getStaffNotifications()
      const notif = {
        id: `notif-${newAppointment.id}`,
        appointmentId: newAppointment.id,
        customerName: newAppointment.customerName,
        customerEmail: newAppointment.customerEmail,
        customerPhone: newAppointment.customerPhone,
        serviceName: newAppointment.serviceName,
        servicePrice: newAppointment.servicePrice,
        employeeId: newAppointment.employeeId,
        employeeName: newAppointment.employeeName,
        station: newAppointment.station,
        date: newAppointment.date,
        startTime: newAppointment.startTime,
        endTime: newAppointment.endTime,
        createdAt: newAppointment.createdAt,
        targetRoles: ['ADMINISTRADOR', 'VENDEDOR', 'ESTILISTA'],
        readByRoles: [],
      }
      localStorage.setItem(
        STAFF_NOTIFS_KEY,
        JSON.stringify([notif, ...currentNotifs].slice(0, 50))
      )
    } catch (e) {
      // ignore storage errors
    }

    syncService.emit(SYNC_CHANNELS.APPOINTMENTS, 'create', newAppointment)
    return newAppointment
  },

  getStaffNotifications() {
    try {
      const raw = localStorage.getItem(STAFF_NOTIFS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  },

  markNotificationAsRead(notifId, role) {
    try {
      const list = this.getStaffNotifications().map((n) => {
        if (n.id === notifId) {
          const readBy = Array.isArray(n.readByRoles) ? n.readByRoles : []
          if (!readBy.includes(role)) {
            return { ...n, readByRoles: [...readBy, role] }
          }
        }
        return n
      })
      localStorage.setItem(STAFF_NOTIFS_KEY, JSON.stringify(list))
      syncService.emit(SYNC_CHANNELS.APPOINTMENTS, 'notif_read', { notifId, role })
      return list
    } catch (e) {
      return []
    }
  },

  markAllNotificationsAsRead(role) {
    try {
      const list = this.getStaffNotifications().map((n) => {
        const readBy = Array.isArray(n.readByRoles) ? n.readByRoles : []
        if (!readBy.includes(role)) {
          return { ...n, readByRoles: [...readBy, role] }
        }
        return n
      })
      localStorage.setItem(STAFF_NOTIFS_KEY, JSON.stringify(list))
      syncService.emit(SYNC_CHANNELS.APPOINTMENTS, 'notif_read_all', { role })
      return list
    } catch (e) {
      return []
    }
  },

  async confirmAppointmentByStaff(appointmentId, staffUser) {
    const updated = await this.updateAppointmentStatus(appointmentId, {
      status: 'CONFIRMADO',
      confirmedBy: staffUser?.name || staffUser?.email || 'Recepción GlamStudio',
      confirmedAt: new Date().toISOString(),
    })

    // Actualizar también la notificación en la bandeja del staff
    try {
      const list = this.getStaffNotifications().map((n) =>
        n.appointmentId === appointmentId
          ? { ...n, appointmentStatus: 'CONFIRMADO', confirmedBy: updated.confirmedBy }
          : n
      )
      localStorage.setItem(STAFF_NOTIFS_KEY, JSON.stringify(list))
    } catch (e) {
      // ignore
    }

    syncService.emit(SYNC_CHANNELS.APPOINTMENTS, 'staff_confirmed', updated)
    return updated
  },

  async updateAppointmentStatus(appointmentId, updates) {
    const appointments = await this.getAllAppointments()
    const existing = appointments.find((a) => a.id === appointmentId)
    if (!existing) throw new Error('Turno no encontrado')

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    await putInStore(STORES.APPOINTMENTS, updated)
    syncService.emit(SYNC_CHANNELS.APPOINTMENTS, 'update', updated)
    return updated
  },

  async deleteAppointment(appointmentId) {
    await deleteFromStore(STORES.APPOINTMENTS, appointmentId)
    syncService.emit(SYNC_CHANNELS.APPOINTMENTS, 'delete', { id: appointmentId })
    return true
  },
}
