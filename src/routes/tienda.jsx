import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Calendar,
  Clock,
  Star,
  ShoppingBag,
  ArrowRight,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Sparkles,
} from 'lucide-react'
import { ProductRepository } from '../repositories/ProductRepository'
import { syncService } from '../services/syncService'
import { useCustomer } from '../context/CustomerAuthContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AdminAuthContext'
import { formatCurrency, getUniqueItemFallbackImage } from '../lib/utils'

const PAGE_SIZE = { grid: 9, list: 8 }

function stockInfo(p) {
  const s = Number(p.stock)
  if (s <= 0) return { label: 'Agotado', dot: 'bg-[#EF4444]', text: 'text-red-700' }
  if (s <= Number(p.minStock || 4))
    return { label: `Últimas ${s} u.`, dot: 'bg-[#EAB308]', text: 'text-amber-700' }
  return { label: 'En stock', dot: 'bg-[#10B981]', text: 'text-emerald-700' }
}

function Pagination({ page, totalPages, onChange, total, from, to }) {
  if (totalPages <= 1) {
    return (
      <p className="text-xs text-stone-500 text-center pt-2">
        Mostrando {total} {total === 1 ? 'resultado' : 'resultados'}
      </p>
    )
  }
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  )
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200">
      <p className="text-xs text-stone-500">
        Mostrando <strong className="text-[#111111]">{from}–{to}</strong> de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-9 h-9 rounded-lg flex items-center justify-center border border-stone-200 bg-white text-stone-600 hover:border-[#111111] disabled:opacity-40 disabled:hover:border-stone-200 disabled:cursor-not-allowed cursor-pointer transition"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, idx) => (
          <React.Fragment key={p}>
            {idx > 0 && p - pages[idx - 1] > 1 && (
              <span className="px-1 text-stone-400 text-sm">…</span>
            )}
            <button
              onClick={() => onChange(p)}
              className={`min-w-9 h-9 px-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                p === page
                  ? 'bg-[#111111] text-[#D4AF37]'
                  : 'border border-stone-200 bg-white text-stone-700 hover:border-[#111111]'
              }`}
            >
              {p}
            </button>
          </React.Fragment>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-9 h-9 rounded-lg flex items-center justify-center border border-stone-200 bg-white text-stone-600 hover:border-[#111111] disabled:opacity-40 disabled:hover:border-stone-200 disabled:cursor-not-allowed cursor-pointer transition"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function TiendaPage() {
  const navigate = useNavigate()
  const { role, isAuthenticated } = useAuth()
  const { isFavorite, toggleFavorite, favorites } = useCustomer()
  const { addItemToActiveCart, addToShop } = useCart()

  const [services, setServices] = useState([])
  const [products, setProducts] = useState([])
  const [employees, setEmployees] = useState([])

  const [tab, setTab] = useState('all') // all | services | products | favorites
  const [view, setView] = useState('grid') // grid | list
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [sort, setSort] = useState('relevance')
  const [page, setPage] = useState(1)

  const canPOS = isAuthenticated && (role === 'ADMINISTRADOR' || role === 'VENDEDOR')

  useEffect(() => {
    const load = async () => {
      const [srv, prd, emp] = await Promise.all([
        ProductRepository.getAllServices(),
        ProductRepository.getAllProducts(),
        ProductRepository.getAllEmployees(),
      ])
      setServices(srv)
      setProducts(prd)
      setEmployees(emp)
    }
    load()
    return syncService.subscribe(load)
  }, [])

  const allItems = useMemo(
    () => [
      ...services.map((s) => ({ ...s, kind: 'service' })),
      ...products.map((p) => ({ ...p, kind: 'product' })),
    ],
    [services, products]
  )

  const baseItems = useMemo(() => {
    if (tab === 'all') return allItems
    if (tab === 'services') return allItems.filter((i) => i.kind === 'service')
    if (tab === 'products') return allItems.filter((i) => i.kind === 'product')
    return allItems.filter((i) => favorites.includes(i.id))
  }, [tab, allItems, favorites])

  const categories = useMemo(
    () => ['Todas', ...Array.from(new Set(baseItems.map((i) => i.category)))],
    [baseItems]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = baseItems.filter((i) => {
      if (category !== 'Todas' && i.category !== category) return false
      if (!q) return true
      return [i.name, i.description, i.brand, i.category]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q))
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [baseItems, category, query, sort])

  // Volver a la página 1 cuando cambian los filtros
  useEffect(() => setPage(1), [tab, category, query, sort, view])
  useEffect(() => setCategory('Todas'), [tab])

  const pageSize = PAGE_SIZE[view]
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const changePage = (p) => {
    setPage(p)
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const reserve = (srv) => navigate({ to: '/reservas', search: { serviceId: srv.id } })
  const addToCart = (item) =>
    addItemToActiveCart({ ...item, type: item.kind === 'service' ? 'service' : 'product' })

  // --- Botones de acción reutilizables ---
  const FavButton = ({ item, className = '' }) => (
    <button
      type="button"
      onClick={() => toggleFavorite(item.id, item.name)}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${className}`}
      title={isFavorite(item.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <Star
        className={`w-4 h-4 ${
          isFavorite(item.id) ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-stone-400'
        }`}
      />
    </button>
  )

  const PrimaryAction = ({ item, full = false }) => {
    if (item.kind === 'service') {
      return (
        <button
          type="button"
          onClick={() => reserve(item)}
          className={`${full ? 'flex-1' : ''} inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#111111] text-white text-[13px] font-semibold hover:bg-stone-800 transition cursor-pointer whitespace-nowrap`}
        >
          <Calendar className="w-4 h-4" />
          Reservar
        </button>
      )
    }
    const out = Number(item.stock) <= 0
    const handleClick = () => (canPOS ? addToCart(item) : addToShop(item))
    return (
      <button
        type="button"
        disabled={out}
        onClick={handleClick}
        className={`${full ? 'flex-1' : ''} inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold transition whitespace-nowrap ${
          out
            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
            : 'bg-[#D4AF37] text-[#111111] hover:bg-[#c9a42f] cursor-pointer'
        }`}
      >
        <ShoppingBag className="w-4 h-4" />
        {out ? 'Sin stock' : canPOS ? 'Agregar a caja' : 'Comprar'}
      </button>
    )
  }

  // --- Card en modo GRID ---
  const GridCard = ({ item }) => {
    const st = item.kind === 'product' ? stockInfo(item) : null
    return (
      <article className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg hover:border-stone-300 transition flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = getUniqueItemFallbackImage(item)
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <FavButton item={item} className="absolute top-3 right-3 bg-white/95 shadow-sm hover:bg-white" />
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-[11px] font-medium text-stone-700">
            {item.kind === 'service' ? item.category : item.brand}
          </span>
        </div>
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-3 text-xs text-stone-500 mb-1.5">
            {item.kind === 'service' ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {item.duration} min
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 font-medium ${st.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            )}
            {item.kind === 'product' && <span>{item.category}</span>}
          </div>
          <h3 className="font-serif-luxury text-xl font-bold text-[#111111] leading-snug line-clamp-2">
            {item.name}
          </h3>
          <p className="text-[13px] text-stone-500 mt-1.5 line-clamp-2 flex-1">
            {item.description}
          </p>
          <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-stone-100">
            <span className="font-serif-luxury text-2xl font-bold text-[#111111]">
              {formatCurrency(item.price)}
            </span>
            <PrimaryAction item={item} />
          </div>
        </div>
      </article>
    )
  }

  // --- Card en modo LIST ---
  const ListCard = ({ item }) => {
    const st = item.kind === 'product' ? stockInfo(item) : null
    return (
      <article className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md hover:border-stone-300 transition flex flex-col sm:flex-row">
        <div className="relative sm:w-48 shrink-0 aspect-[16/9] sm:aspect-auto overflow-hidden bg-stone-100">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = getUniqueItemFallbackImage(item)
            }}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        </div>
        <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 mb-1">
              <span className="font-medium text-[#8A6D1B]">
                {item.kind === 'service' ? item.category : item.brand}
              </span>
              {item.kind === 'service' ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {item.duration} min
                </span>
              ) : (
                <>
                  <span>{item.category}</span>
                  <span className={`inline-flex items-center gap-1.5 font-medium ${st.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </>
              )}
            </div>
            <h3 className="font-serif-luxury text-xl font-bold text-[#111111] leading-snug">
              {item.name}
            </h3>
            <p className="text-[13px] text-stone-500 mt-1 line-clamp-2">{item.description}</p>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
            <span className="font-serif-luxury text-2xl font-bold text-[#111111] whitespace-nowrap">
              {formatCurrency(item.price)}
            </span>
            <div className="flex items-center gap-2">
              <FavButton item={item} className="border border-stone-200 hover:border-stone-300" />
              <PrimaryAction item={item} />
            </div>
          </div>
        </div>
      </article>
    )
  }

  const tabs = [
    { id: 'all', label: 'Todo', count: services.length + products.length },
    { id: 'services', label: 'Servicios', count: services.length },
    { id: 'products', label: 'Productos', count: products.length },
    { id: 'favorites', label: 'Favoritos', count: favorites.length },
  ]

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#111111]">
        <img
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2000&q=85"
          alt="Salón GlamStudio"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/80 to-[#111111]/20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.25em] uppercase text-[#D4AF37]">
              <span className="w-8 h-px bg-[#D4AF37]" />
              Peluquería & Estética Integral
            </span>

            <h1 className="font-serif-luxury text-4xl sm:text-6xl font-bold leading-[1.05] text-white">
              El arte de lucir{' '}
              <span className="text-[#D4AF37] italic font-medium">tu mejor versión</span>
            </h1>

            <p className="text-stone-300 text-base sm:text-lg leading-relaxed font-light max-w-xl">
              Cortes de autor, coloración experta, tratamientos y estética en un solo lugar.
              Reserva online en segundos y elige a tu estilista.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
              <Link
                to="/reservas"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-[#D4AF37] text-[#111111] font-semibold text-sm hover:bg-[#c9a42f] transition"
              >
                <Calendar className="w-4 h-4" />
                Reservar turno online
              </Link>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full border border-white/30 text-white font-medium text-sm hover:bg-white/10 transition cursor-pointer"
              >
                Ver servicios y productos
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/agenda"
                className="inline-flex items-center justify-center gap-2 h-10 sm:h-12 px-4 text-stone-300 font-medium text-sm hover:text-white transition"
              >
                Seguir mi turno
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-4 pt-8 border-t border-white/10">
              {[
                { value: `${services.length}+`, label: 'Servicios' },
                { value: `${products.length}+`, label: 'Productos profesionales' },
                { value: employees.length, label: 'Estilistas expertos' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-serif-luxury text-3xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATÁLOGO */}
      <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-6 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8A6D1B]">
              Catálogo
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#111111] mt-1">
              Servicios & Productos
            </h2>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 sm:inline-flex p-1 rounded-2xl sm:rounded-full bg-stone-200/60 w-full md:w-auto gap-1 sm:gap-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 sm:px-4 h-9 rounded-xl sm:rounded-full text-[13px] font-medium transition cursor-pointer whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-white text-[#111111] shadow-sm'
                    : 'text-stone-500 hover:text-[#111111]'
                }`}
              >
                {t.label}
                <span className="ml-1.5 text-stone-400">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-stone-200 p-3 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === 'products'
                  ? 'Buscar por producto, marca o categoría…'
                  : 'Buscar corte, color, keratina, manicura…'
              }
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#F9F8F6] border border-transparent text-sm focus:outline-none focus:border-[#D4AF37] focus:bg-white transition"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 min-w-[140px] sm:flex-initial h-10 px-3 rounded-xl bg-[#F9F8F6] border border-transparent text-sm text-stone-700 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'Todas' ? 'Todas las categorías' : c}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="flex-1 min-w-[140px] sm:flex-initial h-10 px-3 rounded-xl bg-[#F9F8F6] border border-transparent text-sm text-stone-700 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              <option value="relevance">Destacados</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name">Nombre A–Z</option>
            </select>
            <div className="inline-flex p-1 rounded-xl bg-[#F9F8F6] shrink-0">
              {[
                { id: 'grid', icon: LayoutGrid, label: 'Vista cuadrícula' },
                { id: 'list', icon: List, label: 'Vista lista' },
              ].map((v) => {
                const Icon = v.icon
                return (
                  <button
                    key={v.id}
                    onClick={() => setView(v.id)}
                    title={v.label}
                    aria-label={v.label}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                      view === v.id
                        ? 'bg-[#111111] text-[#D4AF37]'
                        : 'text-stone-400 hover:text-[#111111]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Chips de categoría */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 h-8 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                category === c
                  ? 'bg-[#111111] text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Resultados */}
        {pageItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-stone-300 py-16 text-center">
            {tab === 'favorites' ? (
              <Star className="w-8 h-8 text-stone-300 mx-auto" />
            ) : (
              <Search className="w-8 h-8 text-stone-300 mx-auto" />
            )}
            <p className="font-serif-luxury text-2xl font-bold text-[#111111] mt-3">
              {tab === 'favorites' ? 'Aún no tienes favoritos' : 'Sin resultados'}
            </p>
            <p className="text-sm text-stone-500 mt-1">
              {tab === 'favorites'
                ? 'Toca la estrella en cualquier servicio o producto para guardarlo.'
                : 'Prueba con otra búsqueda o categoría.'}
            </p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageItems.map((item) => (
              <GridCard key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {pageItems.map((item) => (
              <ListCard key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </div>
        )}

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onChange={changePage}
          total={filtered.length}
          from={filtered.length ? (currentPage - 1) * pageSize + 1 : 0}
          to={Math.min(currentPage * pageSize, filtered.length)}
        />
      </section>

      {/* EQUIPO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8A6D1B]">
              Nuestro equipo
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#111111] mt-1">
              Estilistas profesionales
            </h2>
          </div>
          <Link
            to="/reservas"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#111111] hover:text-[#8A6D1B]"
          >
            Reservar con un estilista <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition"
            >
              <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-5">
                <h3 className="font-serif-luxury text-xl font-bold text-[#111111]">{emp.name}</h3>
                <p className="text-[13px] text-[#8A6D1B] mt-0.5 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" />
                  {emp.specialty}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
