/**
 * Servicio Reactivo de Sincronización en Tiempo Real (Offline-First)
 * Emite CustomEvents en la ventana actual y sincroniza entre pestañas mediante localStorage.
 */

const SYNC_EVENT_NAME = 'glamstudio:sync'
const STORAGE_SIGNAL_KEY = 'glamstudio_reactive_signal'

export const SYNC_CHANNELS = {
  APPOINTMENTS: 'appointments',
  SERVICES: 'services',
  PRODUCTS: 'products',
  SALES: 'sales',
  CASH: 'cash_sessions',
  CUSTOMERS: 'customers',
  EMPLOYEES: 'employees',
  SALON_CONFIG: 'salon_config',
  POS_TRANSFER: 'pos_transfer',
  FAVORITES: 'favorites',
}

class ReactiveSyncService {
  constructor() {
    this.listeners = new Set()
    if (typeof window !== 'undefined') {
      window.addEventListener(SYNC_EVENT_NAME, (e) => {
        this.notifyListeners(e.detail)
      })
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_SIGNAL_KEY && e.newValue) {
          try {
            const payload = JSON.parse(e.newValue)
            this.notifyListeners(payload)
          } catch (err) {
            console.error('Error parsing storage sync signal:', err)
          }
        }
      })
    }
  }

  emit(channel, action = 'update', data = null) {
    const payload = {
      channel,
      action,
      data,
      timestamp: Date.now(),
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: payload }))
      try {
        localStorage.setItem(STORAGE_SIGNAL_KEY, JSON.stringify(payload))
      } catch (err) {
        console.warn('Could not persist sync signal in localStorage:', err)
      }
    }
  }

  subscribe(callback) {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  notifyListeners(payload) {
    this.listeners.forEach((cb) => {
      try {
        cb(payload)
      } catch (err) {
        console.error('Error in sync listener:', err)
      }
    })
  }
}

export const syncService = new ReactiveSyncService()
