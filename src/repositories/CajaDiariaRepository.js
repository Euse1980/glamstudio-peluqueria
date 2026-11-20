import { STORES, getAllFromStore, putInStore, ensureSeedData } from '../db/indexedDb'
import { SalesRepository } from './SalesRepository'
import { syncService, SYNC_CHANNELS } from '../services/syncService'
import { getTodayISO } from '../lib/utils'

export const CajaDiariaRepository = {
  async getActiveSession() {
    await ensureSeedData()
    const sessions = await getAllFromStore(STORES.CASH_SESSIONS)
    return sessions.find((s) => s.status === 'OPEN') || null
  },

  async openCashSession({ initialCash = 50000, openedBy = 'recepcion@glamstudio.com', notes = '' }) {
    await ensureSeedData()
    const current = await this.getActiveSession()
    if (current) return current

    const session = {
      id: `cash-${Date.now()}`,
      date: getTodayISO(),
      openedAt: new Date().toISOString(),
      openedBy,
      initialCash: Number(initialCash) || 0,
      status: 'OPEN',
      notes: notes || 'Apertura de caja diaria GlamStudio',
    }
    await putInStore(STORES.CASH_SESSIONS, session)
    syncService.emit(SYNC_CHANNELS.CASH, 'open', session)
    return session
  },

  async getDailySummary(dateISO = getTodayISO()) {
    const [activeSession, todaySales, closes] = await Promise.all([
      this.getActiveSession(),
      SalesRepository.getSalesByDate(dateISO),
      getAllFromStore(STORES.DAILY_CLOSES),
    ])

    let cashSales = 0
    let cardSales = 0
    let transferSales = 0
    let servicesRevenue = 0
    let productsRevenue = 0

    todaySales.forEach((sale) => {
      const total = Number(sale.total || 0)
      if (sale.paymentMethod === 'Efectivo') {
        cashSales += total
      } else if (sale.paymentMethod?.toLowerCase().includes('tarjeta')) {
        cardSales += total
      } else {
        transferSales += total
      }

      ;(sale.items || []).forEach((it) => {
        const line = Number(it.price || 0) * Number(it.quantity || 1)
        if (it.type === 'product') productsRevenue += line
        else servicesRevenue += line
      })
    })

    const initialCash = Number(activeSession?.initialCash || 0)
    const expectedCashInDrawer = initialCash + cashSales
    const totalDayRevenue = cashSales + cardSales + transferSales

    return {
      activeSession,
      date: dateISO,
      initialCash,
      cashSales,
      cardSales,
      transferSales,
      expectedCashInDrawer,
      totalDayRevenue,
      servicesRevenue,
      productsRevenue,
      salesCount: todaySales.length,
      closesHistory: closes.sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt)),
    }
  },

  /**
   * Realiza el arqueo y cierre de caja diaria con autocompletado en 0 para campos vacíos
   */
  async closeCashSession({
    countedCash = 0,
    countedCard = 0,
    countedTransfer = 0,
    closedBy = 'recepcion@glamstudio.com',
    notes = '',
  }) {
    const summary = await this.getDailySummary(getTodayISO())
    const active = summary.activeSession

    // Autocompletado seguro en ceros si algún valor viene vacío o nulo
    const safeCountedCash = Number(countedCash || 0)
    const safeCountedCard = Number(countedCard || 0)
    const safeCountedTransfer = Number(countedTransfer || 0)

    const difference = safeCountedCash - summary.expectedCashInDrawer

    const closeRecord = {
      id: `close-${Date.now()}`,
      date: getTodayISO(),
      closedAt: new Date().toISOString(),
      closedBy,
      initialCash: summary.initialCash,
      expectedCash: summary.expectedCashInDrawer,
      countedCash: safeCountedCash,
      cardTotal: safeCountedCard || summary.cardSales,
      transferTotal: safeCountedTransfer || summary.transferSales,
      difference,
      totalRevenue: summary.totalDayRevenue,
      notes: notes || 'Arqueo de caja verificado.',
    }

    await putInStore(STORES.DAILY_CLOSES, closeRecord)

    if (active) {
      await putInStore(STORES.CASH_SESSIONS, {
        ...active,
        status: 'CLOSED',
        closedAt: closeRecord.closedAt,
      })
    }

    syncService.emit(SYNC_CHANNELS.CASH, 'close', closeRecord)
    return closeRecord
  },
}
