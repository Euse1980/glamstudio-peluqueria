import React from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
} from '@tanstack/react-router'
import { RootLayout } from './routes/__root'
import { IndexPage } from './routes/index'
import { TiendaPage } from './routes/tienda'
import { ReservasPage } from './routes/reservas'
import { AgendaPage } from './routes/agenda'
import { SalonPage } from './routes/salon'
import { VentasPOSPage } from './routes/ventas'
import { AdminDashboardPage } from './routes/admin'

function RootErrorComponent({ error }) {
  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-6">
      <div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-md">
        <h2 className="font-serif-luxury text-2xl font-bold text-[#111111]">
          Se produjo una actualización en la vista
        </h2>
        <p className="text-xs text-stone-500">
          {error?.message || 'Recarga la página para continuar.'}
        </p>
        <Link
          to="/"
          onClick={() => window.location.reload()}
          className="inline-block px-5 py-2.5 rounded-xl bg-[#111111] text-[#D4AF37] text-xs font-bold uppercase tracking-wider"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
  errorComponent: RootErrorComponent,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
})

const tiendaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tienda',
  component: TiendaPage,
})

const reservasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reservas',
  component: ReservasPage,
})

const agendaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agenda',
  component: AgendaPage,
})

const salonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/salon',
  component: SalonPage,
})

const ventasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ventas',
  component: VentasPOSPage,
})

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboardPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  tiendaRoute,
  reservasRoute,
  agendaRoute,
  salonRoute,
  ventasRoute,
  adminRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})
