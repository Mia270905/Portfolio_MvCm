'use client'
import Link from 'next/link'
import { LogoImg } from '@/components/logo'
import { Menu, X } from 'lucide-react'
import { AuthButton } from '@/components/auth/auth-button'
import React from 'react'

const menuItems = [
    { name: 'Nuestra oferta', href: '#oferta' },
    { name: 'Servicios', href: '#servicios' },
    { name: 'Galería', href: '#galeria' },
    { name: 'Opiniones', href: '#opiniones' },
    { name: 'Contacto', href: '#contacto' },
]

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)

    return (
        <header>
            <nav className="bg-background/50 fixed z-20 w-full border-b backdrop-blur-3xl">
                <div className="mx-auto max-w-6xl px-6 transition-all duration-300">
                    <div className="relative flex items-center justify-between gap-6 py-3 lg:py-4">

                        {/* Logo */}
                        <Link href="/" aria-label="home" className="flex items-center space-x-1">
                            <LogoImg className='w-30' />
                        </Link>

                        {/* Nav desktop */}
                        <ul className="hidden lg:flex gap-8 text-sm font-bold">
                            {menuItems.map((item, index) => (
                                <li key={index}>
                                    <Link
                                        href={item.href}
                                        className="text-black hover:text-accent-foreground block duration-150">
                                        <span>{item.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {/* Auth + hamburguesa */}
                        <div className="flex items-center gap-4">
                            {/* AuthButton desktop */}
                            <div className="hidden lg:block">
                                <AuthButton />
                            </div>

                            {/* Hamburguesa móvil */}
                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                {menuState
                                    ? <X className="m-auto size-6" />
                                    : <Menu className="m-auto size-6" />
                                }
                            </button>
                        </div>

                    </div>
                </div>
            </nav>

            {/* Overlay móvil */}
            {menuState && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setMenuState(false)}
                    />

                    {/* Drawer lateral */}
                    <div className="fixed top-0 right-0 h-full w-[300px] sm:w-[400px] bg-background border-l border-black/10 z-50 lg:hidden">
                        <div className="flex h-full flex-col p-6">

                            {/* Header del drawer */}
                            <div className="flex items-center justify-between mb-8">
                                <Link href="/" onClick={() => setMenuState(false)}>
                                    <LogoImg className='w-24' />
                                </Link>
                                <button
                                    onClick={() => setMenuState(false)}
                                    className="p-2 rounded-md hover:bg-black/10">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Links */}
                            <nav className="flex flex-col gap-6">
                                {menuItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        onClick={() => setMenuState(false)}
                                        className="text-base font-medium text-muted-foreground hover:text-accent-foreground transition-colors border-b border-black/10 pb-2">
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>

                            {/* AuthButton móvil al fondo */}
                            <div className="mt-auto pt-6 border-t border-black/10">
                                <AuthButton mobileView />
                            </div>

                        </div>
                    </div>
                </>
            )}
        </header>
    )
}