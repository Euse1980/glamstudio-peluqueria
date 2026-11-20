import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { syncService, SYNC_CHANNELS } from '../services/syncService'

const FAVORITES_KEY = 'glamstudio_customer_favorites_v2'

const CustomerAuthContext =
  globalThis.__GLAM_CUSTOMER_AUTH_CTX__ ||
  (globalThis.__GLAM_CUSTOMER_AUTH_CTX__ = createContext(null))

export function CustomerAuthProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      // ignore
    }
    return ['srv-4', 'prd-1', 'prd-2']
  })

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    } catch (e) {
      // ignore
    }
  }, [favorites])

  const toggleFavorite = (itemId, itemName = 'Elemento') => {
    setFavorites((prev) => {
      const exists = prev.includes(itemId)
      const next = exists ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      toast(exists ? 'Eliminado de tus Favoritos ⭐' : 'Guardado en tus Favoritos ⭐', {
        description: itemName,
      })
      syncService.emit(SYNC_CHANNELS.FAVORITES, 'toggle', { itemId, favorites: next })
      return next
    })
  }

  const isFavorite = (itemId) => favorites.includes(itemId)

  return (
    <CustomerAuthContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomer() {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) {
    return {
      favorites: [],
      toggleFavorite: () => { },
      isFavorite: () => false,
    }
  }
  return ctx
}
