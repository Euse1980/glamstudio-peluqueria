import React, { useState, useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { Navbar } from '../components/Navbar'
import { AdminAuthProvider } from '../context/AdminAuthContext'
import { CustomerAuthProvider } from '../context/CustomerAuthContext'
import { CartProvider } from '../context/CartContext'
import { Scissors, ChevronsUp } from 'lucide-react'

const WHATSAPP_NUMBER = '381999999999'
const WHATSAPP_DEFAULT_TEXT =
  'Hola GlamStudio, quisiera realizar una consulta por mensaje.'

function OfficialWhatsAppIcon({ className = 'w-6 h-6' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.031 2C6.508 2 2.023 6.484 2.023 12.005c0 1.766.461 3.49 1.337 5.01L2 22l5.121-1.343a9.97 9.97 0 0 0 4.908 1.294h.004c5.522 0 10.007-4.484 10.007-10.005C22.04 6.484 17.554 2 12.031 2zm5.822 14.155c-.246.694-1.431 1.326-1.997 1.411-.513.077-1.183.109-1.91-.121-.44-.14-1.005-.327-1.727-.639-3.038-1.312-5.022-4.369-5.174-4.572-.152-.202-1.235-1.644-1.235-3.136 0-1.492.782-2.226 1.06-2.53.277-.303.606-.379.808-.379.202 0 .404.002.581.011.186.009.436-.071.682.521.253.607.859 2.099.934 2.251.076.152.126.329.025.531-.101.203-.151.329-.303.506-.152.177-.319.396-.455.532-.152.151-.31.315-.133.619.177.303.786 1.296 1.688 2.101 1.16.103 2.138 1.368 2.441 1.52.303.152.48.126.657-.076.177-.202.758-.885.96-1.189.202-.303.404-.253.682-.152.278.101 1.768.834 2.071.986.303.152.505.227.581.354.075.126.075.733-.171 1.427z" />
    </svg>
  )
}

export function RootLayout() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_DEFAULT_TEXT
  )}`

  return (
    <AdminAuthProvider>
      <CustomerAuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col bg-[#F9F8F6] text-[#111111] relative">
            <Navbar />
            <main className="flex-1">
              <Outlet />
            </main>

            {/* Botón izquierdo: flecha doble hacia arriba */}
            {showScrollTop && (
              <button
                type="button"
                onClick={scrollToTop}
                aria-label="Volver arriba"
                title="Volver arriba"
                className="fixed bottom-6 left-6 z-40 w-11 h-11 rounded-full bg-[#111111] text-[#D4AF37] border border-[#D4AF37]/60 shadow-lg hover:bg-[#D4AF37] hover:text-[#111111] hover:scale-105 transition-all duration-300 flex items-center justify-center cursor-pointer"
              >
                <ChevronsUp className="w-5 h-5" />
              </button>
            )}

            {/* Botón derecho: WhatsApp Oficial (Consultas únicamente por mensaje) */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Consultas por WhatsApp únicamente por mensaje"
              title="Consultas únicamente por mensaje de WhatsApp (no llamadas)"
              className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2.5 p-2.5 sm:pl-4 sm:pr-3.5 sm:py-2.5 rounded-full bg-[#25D366] text-white shadow-xl hover:bg-[#1ebe5d] hover:scale-105 transition-all duration-300"
            >
              <div className="text-right hidden sm:block leading-tight">
                <span className="block text-[11px] font-bold tracking-wide text-white">
                  WhatsApp Consultas
                </span>
                <span className="block text-[10px] font-medium text-white/90">
                  Únicamente por mensaje
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <OfficialWhatsAppIcon className="w-5 h-5 text-white" />
              </div>
            </a>

            <footer className="bg-[#111111] text-stone-400 border-t border-[#D4AF37]/30 pt-8 pb-24 sm:py-8 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
                    <Scissors className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-serif-luxury text-lg font-bold text-white tracking-wider">
                    GLAM<span className="text-[#D4AF37] italic font-normal">STUDIO</span>
                  </span>
                  <span className="text-stone-500">• Haute Coiffure & Estética Integral</span>
                </div>
                <p className="text-stone-400">
                  © {new Date().getFullYear()} GlamStudio. Todos los derechos reservados.
                </p>
              </div>
            </footer>
            <Toaster position="top-right" richColors closeButton />
          </div>
        </CartProvider>
      </CustomerAuthProvider>
    </AdminAuthProvider>
  )
}
