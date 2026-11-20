import {
  STORES,
  getAllFromStore,
  putInStore,
  deleteFromStore,
  ensureSeedData,
} from '../db/indexedDb'
import { syncService, SYNC_CHANNELS } from '../services/syncService'

export const ProductRepository = {
  async getAllProducts() {
    await ensureSeedData()
    return getAllFromStore(STORES.PRODUCTS)
  },

  async saveProduct(productData) {
    await ensureSeedData()
    const item = {
      ...productData,
      id: productData.id || `prd-${Date.now()}`,
      price: Number(productData.price) || 0,
      cost: Number(productData.cost) || 0,
      stock: Number(productData.stock) || 0,
      minStock: Number(productData.minStock ?? 4),
    }
    await putInStore(STORES.PRODUCTS, item)
    syncService.emit(SYNC_CHANNELS.PRODUCTS, 'save', item)
    return item
  },

  async deleteProduct(id) {
    await deleteFromStore(STORES.PRODUCTS, id)
    syncService.emit(SYNC_CHANNELS.PRODUCTS, 'delete', { id })
    return true
  },

  async adjustStock(productId, deltaQuantity, reason = 'Ajuste manual de stock') {
    const products = await this.getAllProducts()
    const product = products.find((p) => p.id === productId)
    if (!product) throw new Error('Producto no encontrado')

    const newStock = Math.max(0, Number(product.stock) + Number(deltaQuantity))
    const updated = { ...product, stock: newStock }
    await putInStore(STORES.PRODUCTS, updated)

    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      productName: product.name,
      type:
        newStock === 0
          ? 'AGOTADO'
          : newStock <= product.minStock
          ? 'ALERTA_PREVENTIVA'
          : deltaQuantity > 0
          ? 'INGRESO_STOCK'
          : 'EGRESO_VENTA',
      quantityChange: deltaQuantity,
      newStock,
      reason,
      createdAt: new Date().toISOString(),
    }
    await putInStore(STORES.INVENTORY_LOGS, logEntry)
    syncService.emit(SYNC_CHANNELS.PRODUCTS, 'stock_update', { product: updated, log: logEntry })
    return updated
  },

  async getInventoryLogs() {
    await ensureSeedData()
    const logs = await getAllFromStore(STORES.INVENTORY_LOGS)
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  },

  // --- SERVICIOS DE PELUQUERÍA Y ESTÉTICA ---
  async getAllServices() {
    await ensureSeedData()
    return getAllFromStore(STORES.SERVICES)
  },

  async saveService(serviceData) {
    await ensureSeedData()
    const item = {
      ...serviceData,
      id: serviceData.id || `srv-${Date.now()}`,
      duration: Number(serviceData.duration) || 45,
      price: Number(serviceData.price) || 0,
      commissionPct: Number(serviceData.commissionPct ?? 35),
      featured: Boolean(serviceData.featured),
    }
    await putInStore(STORES.SERVICES, item)
    syncService.emit(SYNC_CHANNELS.SERVICES, 'save', item)
    return item
  },

  async deleteService(id) {
    await deleteFromStore(STORES.SERVICES, id)
    syncService.emit(SYNC_CHANNELS.SERVICES, 'delete', { id })
    return true
  },

  // --- ESTILISTAS Y PROFESIONALES ---
  async getAllEmployees() {
    await ensureSeedData()
    return getAllFromStore(STORES.EMPLOYEES)
  },

  async saveEmployee(empData) {
    await ensureSeedData()
    const item = {
      ...empData,
      id: empData.id || `emp-${Date.now()}`,
      commissionRate: Number(empData.commissionRate ?? 35),
      workStart: empData.workStart || '09:00',
      workEnd: empData.workEnd || '20:00',
      active: empData.active !== false,
    }
    await putInStore(STORES.EMPLOYEES, item)
    syncService.emit(SYNC_CHANNELS.EMPLOYEES, 'save', item)
    return item
  },
}
