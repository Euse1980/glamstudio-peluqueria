import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'

const SIMULTANEOUS_CARTS_KEY = 'glamstudio_pos_simultaneous_carts_v2'
const SHOP_CART_KEY = 'glamstudio_shop_cart_v1'

const DEFAULT_CARTS = [
  {
    id: 'cart-1',
    label: 'Sillón 2 • Elena Blaquier',
    customerName: 'Elena Blaquier',
    paymentMethod: 'Tarjeta de Crédito',
    linkedAppointmentId: 'apt-104',
    discount: 0,
    items: [
      {
        id: 'srv-1',
        type: 'service',
        name: 'Corte de Autor & Visagismo',
        price: 32000,
        quantity: 1,
        employeeId: 'emp-2',
        employeeName: 'Mateo Lombardo',
        commissionPct: 40,
      },
      {
        id: 'prd-1',
        type: 'product',
        name: "Kérastase Elixir Ultime L'Huile Originale 100ml",
        price: 64000,
        quantity: 1,
        employeeId: 'emp-2',
        employeeName: 'Mateo Lombardo',
        commissionPct: 10,
      },
    ],
  },
  {
    id: 'cart-2',
    label: 'Mostrador • Sofía Mendizábal',
    customerName: 'Sofía Mendizábal',
    paymentMethod: 'Transferencia / QR',
    linkedAppointmentId: null,
    discount: 0,
    items: [
      {
        id: 'prd-3',
        type: 'product',
        name: "L'Oréal Absolut Repair Gold Mask 250ml",
        price: 44000,
        quantity: 1,
        employeeId: 'emp-1',
        employeeName: 'Camila Moreau',
        commissionPct: 10,
      },
    ],
  },
]

const CartContext =
  globalThis.__GLAM_CART_CTX__ ||
  (globalThis.__GLAM_CART_CTX__ = createContext(null))

export function CartProvider({ children }) {
  const [carts, setCarts] = useState(() => {
    try {
      const saved = localStorage.getItem(SIMULTANEOUS_CARTS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_CARTS
  })

  const [activeCartId, setActiveCartId] = useState(() => carts[0]?.id || 'cart-1')

  useEffect(() => {
    try {
      localStorage.setItem(SIMULTANEOUS_CARTS_KEY, JSON.stringify(carts))
    } catch (e) {
      // ignore
    }
  }, [carts])

  const activeCart = carts.find((c) => c.id === activeCartId) || carts[0]

  const createNewCart = (customLabel = '', customerName = 'Cliente en Recepción') => {
    const newId = `cart-${Date.now()}`
    const index = carts.length + 1
    const newCart = {
      id: newId,
      label: customLabel || `Ticket #${index} • ${customerName}`,
      customerName,
      paymentMethod: 'Efectivo',
      linkedAppointmentId: null,
      discount: 0,
      items: [],
    }
    setCarts((prev) => [...prev, newCart])
    setActiveCartId(newId)
    toast.success(`Nuevo carrito abierto: ${newCart.label}`)
    return newId
  }

  const closeCartTab = (cartId) => {
    if (carts.length <= 1) {
      setCarts([
        {
          id: 'cart-1',
          label: 'Ticket #1 • Mostrador',
          customerName: 'Cliente en Recepción',
          paymentMethod: 'Efectivo',
          linkedAppointmentId: null,
          discount: 0,
          items: [],
        },
      ])
      setActiveCartId('cart-1')
      return
    }
    const remaining = carts.filter((c) => c.id !== cartId)
    setCarts(remaining)
    if (activeCartId === cartId) {
      setActiveCartId(remaining[0].id)
    }
  }

  const updateActiveCartMeta = (updates) => {
    setCarts((prev) =>
      prev.map((c) => (c.id === activeCart.id ? { ...c, ...updates } : c))
    )
  }

  const addItemToActiveCart = (item, employee = null) => {
    setCarts((prev) =>
      prev.map((cart) => {
        if (cart.id !== activeCart.id) return cart
        const existingIndex = cart.items.findIndex(
          (x) => x.id === item.id && x.type === item.type
        )
        let nextItems
        if (existingIndex >= 0) {
          nextItems = [...cart.items]
          nextItems[existingIndex] = {
            ...nextItems[existingIndex],
            quantity: nextItems[existingIndex].quantity + 1,
          }
        } else {
          nextItems = [
            ...cart.items,
            {
              id: item.id,
              type: item.type || 'product',
              name: item.name,
              price: Number(item.price),
              quantity: 1,
              employeeId: employee?.id || item.employeeId || 'emp-1',
              employeeName: employee?.name || item.employeeName || 'Camila Moreau',
              commissionPct: Number(
                item.commissionPct ?? (item.type === 'product' ? 10 : 38)
              ),
            },
          ]
        }
        return { ...cart, items: nextItems }
      })
    )
    toast.success(`Agregado al ${activeCart.label}`, {
      description: item.name,
    })
  }

  const updateItemQuantity = (itemId, type, delta) => {
    setCarts((prev) =>
      prev.map((cart) => {
        if (cart.id !== activeCart.id) return cart
        const nextItems = cart.items
          .map((it) => {
            if (it.id === itemId && it.type === type) {
              return { ...it, quantity: it.quantity + delta }
            }
            return it
          })
          .filter((it) => it.quantity > 0)
        return { ...cart, items: nextItems }
      })
    )
  }

  const updateItemStylist = (itemId, type, employee) => {
    setCarts((prev) =>
      prev.map((cart) => {
        if (cart.id !== activeCart.id) return cart
        const nextItems = cart.items.map((it) => {
          if (it.id === itemId && it.type === type) {
            return {
              ...it,
              employeeId: employee.id,
              employeeName: employee.name,
            }
          }
          return it
        })
        return { ...cart, items: nextItems }
      })
    )
  }

  const clearActiveCart = () => {
    setCarts((prev) =>
      prev.map((cart) =>
        cart.id === activeCart.id
          ? { ...cart, items: [], discount: 0, linkedAppointmentId: null }
          : cart
      )
    )
  }

  const importAppointmentToCart = (appointment) => {
    const existingCart = carts.find((c) => c.linkedAppointmentId === appointment.id)
    if (existingCart) {
      setActiveCartId(existingCart.id)
      toast.info(`Ticket de ${appointment.customerName} ya está abierto en POS`)
      return existingCart.id
    }

    const newCartId = `cart-apt-${appointment.id}`
    const newCart = {
      id: newCartId,
      label: `${appointment.station.split(' - ')[0]} • ${appointment.customerName}`,
      customerName: appointment.customerName,
      paymentMethod: 'Tarjeta de Crédito',
      linkedAppointmentId: appointment.id,
      discount: 0,
      items: [
        {
          id: appointment.serviceId,
          type: 'service',
          name: appointment.serviceName,
          price: Number(appointment.servicePrice),
          quantity: 1,
          employeeId: appointment.employeeId,
          employeeName: appointment.employeeName,
          commissionPct: 40,
        },
      ],
    }

    setCarts((prev) => [...prev, newCart])
    setActiveCartId(newCartId)
    toast.success(`Turno de ${appointment.customerName} transferido al POS`, {
      description: `${appointment.serviceName} listo para facturar.`,
    })
    return newCartId
  }

  // ---------- Carrito de compra online (clientes / visitantes) ----------
  const [shopItems, setShopItems] = useState(() => {
    try {
      const raw = localStorage.getItem(SHOP_CART_KEY)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      // ignore
    }
    return []
  })
  const [isShopOpen, setIsShopOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(SHOP_CART_KEY, JSON.stringify(shopItems))
    } catch (e) {
      // ignore
    }
  }, [shopItems])

  const addToShop = (product) => {
    const max = Number(product.stock ?? 99)
    if (max <= 0) {
      toast.error('Producto sin stock')
      return
    }
    const current = shopItems.find((i) => i.id === product.id)
    if (current && current.quantity >= max) {
      toast.error(`Solo hay ${max} unidades disponibles`)
      return
    }
    setShopItems((prev) =>
      current
        ? prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [
            ...prev,
            {
              id: product.id,
              name: product.name,
              brand: product.brand,
              image: product.image,
              price: Number(product.price),
              stock: max,
              quantity: 1,
            },
          ]
    )
    toast.success('Agregado al carrito', { description: product.name })
  }

  const updateShopQty = (id, delta) => {
    setShopItems((prev) =>
      prev
        .map((i) =>
          i.id === id
            ? { ...i, quantity: Math.min(i.stock ?? 99, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    )
  }

  const removeFromShop = (id) => setShopItems((prev) => prev.filter((i) => i.id !== id))
  const clearShop = () => setShopItems([])
  const shopCount = shopItems.reduce((s, i) => s + i.quantity, 0)
  const shopTotal = shopItems.reduce((s, i) => s + i.price * i.quantity, 0)

  const totalItemsAcrossAllCarts = carts.reduce(
    (sum, c) => sum + c.items.reduce((s, i) => s + i.quantity, 0),
    0
  )

  return (
    <CartContext.Provider
      value={{
        carts,
        activeCart,
        activeCartId,
        setActiveCartId,
        createNewCart,
        closeCartTab,
        updateActiveCartMeta,
        addItemToActiveCart,
        updateItemQuantity,
        updateItemStylist,
        clearActiveCart,
        importAppointmentToCart,
        totalItemsAcrossAllCarts,
        shopItems,
        shopCount,
        shopTotal,
        addToShop,
        updateShopQty,
        removeFromShop,
        clearShop,
        isShopOpen,
        setIsShopOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    return {
      carts: DEFAULT_CARTS,
      activeCart: DEFAULT_CARTS[0],
      activeCartId: 'cart-1',
      setActiveCartId: () => {},
      createNewCart: () => {},
      closeCartTab: () => {},
      updateActiveCartMeta: () => {},
      addItemToActiveCart: () => {},
      updateItemQuantity: () => {},
      updateItemStylist: () => {},
      clearActiveCart: () => {},
      importAppointmentToCart: () => {},
      totalItemsAcrossAllCarts: 0,
      shopItems: [],
      shopCount: 0,
      shopTotal: 0,
      addToShop: () => {},
      updateShopQty: () => {},
      removeFromShop: () => {},
      clearShop: () => {},
      isShopOpen: false,
      setIsShopOpen: () => {},
    }
  }
  return ctx
}
