'use client'
import Link from 'next/link'
import { LogoImg } from '@/components/logo'
import { Menu, X } from 'lucide-react'
import React from 'react'

const menuItems = [
  { name: 'Servicios', href: '/#servicios' },
  { name: 'Galería', href: '/#galeria' },
  { name: 'Contacto', href: '/#contacto' },
]

export const LoginHeader = () => {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav
        className={`bg-[#E3E2DD] text-[#987E71] w-full backdrop-blur-3xl transition-all duration-300 ${
          scrolled ? 'border-b-2 border-[#d6c9c0] shadow-lg' : 'border-b-0 shadow-none'
        }`}
      >
        <div className="mx-auto max-w-6xl px-6 transition-all duration-300">
          <div className="relative flex items-center justify-between py-3 lg:py-4">
            {/* Izquierda */}
            <div className="flex items-center gap-12">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2"
              >
                <LogoImg />
              </Link>

              {/* Menú grande */}
              <div className="hidden lg:block">
                <ul className="flex gap-8 text-[#987E71] text-sm font-bold">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="hover:text-[#40222D] duration-150"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Derecha */}
            <div className="flex items-center gap-4">

              {/* Burguer */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                className="relative z-30 lg:hidden"
              >
                {menuOpen ? (
                  <X className="w-6 h-6 text-[#987E71]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#987E71]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {menuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-[#E3E2DD] border-t border-[#d6c9c0] shadow-lg z-20">
            <ul className="flex flex-col items-center py-6 space-y-4 text-[#987E71] font-bold text-lg">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)} // cerrar al hacer click
                    className="hover:text-[#40222D] duration-150"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </header>
  )
}
