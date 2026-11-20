import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  const num = Number(amount) || 0
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(num)
}

export function getTodayISO() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + (minutes || 0)
}

export function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function addMinutesToTime(timeStr, durationMinutes) {
  return minutesToTime(timeToMinutes(timeStr) + Number(durationMinutes || 0))
}

export const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  VENDEDOR: 'VENDEDOR',
  ESTILISTA: 'ESTILISTA',
  CONSULTA: 'CONSULTA',
}

export const ROLE_BADGES = {
  ADMINISTRADOR: {
    label: 'Administrador General',
    bg: 'bg-[#111111] text-[#D4AF37] border-[#D4AF37]/50',
    description: 'Control total de servicios, precios, comisiones, stock y finanzas',
  },
  VENDEDOR: {
    label: 'Recepcionista / POS',
    bg: 'bg-[#D4AF37]/15 text-[#8A6D1B] border-[#D4AF37]/40',
    description: 'Punto de Venta, carritos simultáneos, agenda general y estaciones',
  },
  ESTILISTA: {
    label: 'Estilista Profesional',
    bg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
    description: 'Agenda propia, fichas técnicas capilares y estados en salón',
  },
  CONSULTA: {
    label: 'Cliente / Consulta',
    bg: 'bg-stone-200/80 text-stone-700 border-stone-300',
    description: 'Reserva de turnos con Slot Matching, catálogo y favoritos',
  },
}

/**
 * Devuelve una fotografía real verificada de respaldo según el ID del producto o servicio
 */
const VERIFIED_REAL_FALLBACKS = [
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=800&q=80',
]

export function getUniqueItemFallbackImage(item = {}) {
  const seedStr = `${item.id || ''}-${item.sku || ''}-${item.name || ''}`
  let hash = 0
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0
  }
  return VERIFIED_REAL_FALLBACKS[hash % VERIFIED_REAL_FALLBACKS.length]
}
