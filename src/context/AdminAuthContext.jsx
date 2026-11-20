import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'

export const OFFICIAL_ACCOUNTS = {
  ADMINISTRADOR: {
    id: 'usr-admin',
    name: 'Victoria Sterling',
    email: 'admin@glamstudio.com',
    password: 'Glam2026!',
    role: 'ADMINISTRADOR',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    permissions: [
      'ALL',
      'MANAGE_SERVICES',
      'MANAGE_PRODUCTS',
      'MANAGE_EMPLOYEES',
      'MANAGE_HOURS',
      'POS_OPERATIONS',
      'VIEW_FINANCE',
      'SALON_BOARD',
      'AGENDA_ALL',
      'BOOK_ONLINE',
    ],
  },
  VENDEDOR: {
    id: 'usr-recepcion',
    name: 'Clara Montes',
    email: 'recepcion@glamstudio.com',
    password: 'Recepcion123',
    role: 'VENDEDOR',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    permissions: [
      'POS_OPERATIONS',
      'SALON_BOARD',
      'AGENDA_ALL',
      'ASSIGN_STATIONS',
      'BOOK_ONLINE',
    ],
  },
  ESTILISTA: {
    id: 'usr-estilista',
    employeeId: 'emp-1',
    name: 'Camila Moreau',
    email: 'estilista@glamstudio.com',
    password: 'Estilista123',
    role: 'ESTILISTA',
    station: 'Sillón 1 - VIP Gold',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    permissions: [
      'AGENDA_OWN',
      'SALON_BOARD_OWN',
      'CLIENT_TECHNICAL_NOTES',
      'UPDATE_SALON_STATUS',
    ],
  },
  CONSULTA: {
    id: 'usr-cliente',
    customerId: 'cust-1',
    name: 'Sofía Mendizábal',
    email: 'cliente@glamstudio.com',
    password: 'Cliente123',
    role: 'CONSULTA',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    permissions: ['BOOK_ONLINE', 'VIEW_CATALOG', 'MANAGE_FAVORITES', 'TRACK_OWN_TURN'],
  },
}

const AUTH_STORAGE_KEY = 'glamstudio_session_v3'

// Limpia sesiones heredadas de versiones anteriores (antes se iniciaba como admin por defecto)
try {
  localStorage.removeItem('glamstudio_active_user_v2')
} catch (e) {
  // ignore
}

const AdminAuthContext =
  globalThis.__GLAM_ADMIN_AUTH_CTX__ ||
  (globalThis.__GLAM_ADMIN_AUTH_CTX__ = createContext(null))

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      // default
    }
    return null
  })

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    } catch (e) {
      // ignore
    }
  }, [user])

  const loginWithCredentials = (email, password) => {
    const cleanEmail = String(email || '').trim().toLowerCase()
    const cleanPass = String(password || '').trim()

    const match = Object.values(OFFICIAL_ACCOUNTS).find(
      (acc) => acc.email.toLowerCase() === cleanEmail && acc.password === cleanPass
    )

    if (!match) {
      toast.error('Credenciales incorrectas. Verifica tu correo y contraseña.')
      return { success: false, error: 'Credenciales inválidas' }
    }

    const safeUser = {
      id: match.id,
      name: match.name,
      email: match.email,
      role: match.role,
      avatar: match.avatar,
      employeeId: match.employeeId,
      customerId: match.customerId,
      station: match.station,
      permissions: match.permissions,
    }

    setUser(safeUser)
    setIsLoginModalOpen(false)
    toast.success(`Bienvenida/o, ${safeUser.name}`)
    return { success: true, user: safeUser }
  }

  const logout = () => {
    setUser(null)
    toast.info('Has cerrado sesión correctamente.')
  }

  const hasPermission = (perm) => {
    if (!user) return false
    if (user.role === 'ADMINISTRADOR' || user.permissions?.includes('ALL')) return true
    return Boolean(user.permissions?.includes(perm))
  }

  const hasRole = (...roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        role: user?.role || 'CONSULTA',
        isAuthenticated: Boolean(user),
        loginWithCredentials,
        logout,
        hasPermission,
        hasRole,
        isLoginModalOpen,
        setIsLoginModalOpen,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) {
    return {
      user: null,
      role: 'CONSULTA',
      isAuthenticated: false,
      loginWithCredentials: () => ({ success: false }),
      logout: () => {},
      hasPermission: () => false,
      hasRole: () => false,
      isLoginModalOpen: false,
      setIsLoginModalOpen: () => {},
    }
  }
  return ctx
}
