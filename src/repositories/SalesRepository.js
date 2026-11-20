import { STORES, getAllFromStore, putInStore, ensureSeedData } from '../db/indexedDb'
import { ProductRepository } from './ProductRepository'
import { AppointmentRepository } from './AppointmentRepository'
import { syncService, SYNC_CHANNELS } from '../services/syncService'
import { getTodayISO } from '../lib/utils'

export const SalesRepository = {
  async getAllSales() {
    await ensureSeedData()
    const sales = await getAllFromStore(STORES.SALES)
    return sales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  async getSalesByDate(dateISO) {
    const all = await this.getAllSales()
    return all.filter((s) => s.date === dateISO)
  },

  async createSale({
    customerName = 'Cliente Salón',
    paymentMethod = 'Efectivo',
    items = [],
    discount = 0,
    cashierEmail = 'recepcion@glamstudio.com',
    linkedAppointmentId = null,
  }) {
    await ensureSeedData()
    if (!items || items.length === 0) {
      throw new Error('El carrito está vacío.')
    }

    const subtotal = items.reduce(
      (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 1),
      0
    )
    const numericDiscount = Number(discount || 0)
    const total = Math.max(0, subtotal - numericDiscount)

    const existingSales = await this.getAllSales()
    const nextTicketNum = existingSales.length + 101

    const saleRecord = {
      id: `sale-${Date.now()}`,
      ticketNumber: `GS-${String(nextTicketNum).padStart(6, '0')}`,
      date: getTodayISO(),
      createdAt: new Date().toISOString(),
      customerName,
      paymentMethod,
      items: items.map((it) => ({
        id: it.id,
        type: it.type || 'service',
        name: it.name,
        price: Number(it.price),
        quantity: Number(it.quantity || 1),
        employeeId: it.employeeId || 'emp-1',
        employeeName: it.employeeName || 'Camila Moreau',
        commissionPct: Number(it.commissionPct ?? (it.type === 'product' ? 10 : 38)),
      })),
      subtotal,
      discount: numericDiscount,
      total,
      cashierEmail,
      linkedAppointmentId,
    }

    await putInStore(STORES.SALES, saleRecord)

    // Descontar stock de productos de reventa
    for (const item of saleRecord.items) {
      if (item.type === 'product') {
        await ProductRepository.adjustStock(
          item.id,
          -Math.abs(item.quantity),
          `Venta POS Ticket ${saleRecord.ticketNumber} (${customerName})`
        )
      }
    }

    // Si proviene de un turno del salón, marcar turno como cobrado y finalizado
    if (linkedAppointmentId) {
      try {
        await AppointmentRepository.updateAppointmentStatus(linkedAppointmentId, {
          paid: true,
          salonStatus: 'Listo / Finalizado',
        })
      } catch (e) {
        // Turno opcional
      }
    }

    syncService.emit(SYNC_CHANNELS.SALES, 'create', saleRecord)
    return saleRecord
  },

  async getStylistPerformanceReport() {
    const [sales, employees] = await Promise.all([
      this.getAllSales(),
      ProductRepository.getAllEmployees(),
    ])

    const statsMap = {}
    employees.forEach((emp) => {
      statsMap[emp.id] = {
        employeeId: emp.id,
        name: emp.name,
        specialty: emp.specialty,
        station: emp.station,
        baseCommissionPct: emp.commissionRate,
        servicesCount: 0,
        productsCount: 0,
        grossRevenue: 0,
        totalCommission: 0,
      }
    })

    sales.forEach((sale) => {
      ;(sale.items || []).forEach((item) => {
        const empId = item.employeeId || 'emp-1'
        if (!statsMap[empId]) {
          statsMap[empId] = {
            employeeId: empId,
            name: item.employeeName || 'Estilista',
            specialty: 'Estilista General',
            station: 'Salón',
            baseCommissionPct: 35,
            servicesCount: 0,
            productsCount: 0,
            grossRevenue: 0,
            totalCommission: 0,
          }
        }
        const lineTotal = Number(item.price || 0) * Number(item.quantity || 1)
        const commPct = Number(item.commissionPct ?? 35)
        const commAmount = Math.round((lineTotal * commPct) / 100)

        statsMap[empId].grossRevenue += lineTotal
        statsMap[empId].totalCommission += commAmount
        if (item.type === 'product') {
          statsMap[empId].productsCount += Number(item.quantity || 1)
        } else {
          statsMap[empId].servicesCount += Number(item.quantity || 1)
        }
      })
    })

    return Object.values(statsMap).sort((a, b) => b.grossRevenue - a.grossRevenue)
  },
}
