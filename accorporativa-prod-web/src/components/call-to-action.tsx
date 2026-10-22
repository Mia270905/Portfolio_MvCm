import { Button } from '@/components/ui/button'
import Link from 'next/link'

import { Phone, Facebook, Instagram, Globe, MessageCircle } from "lucide-react";

export default function ContactSection() {
    return (
        <section className="w-full py-20 px-6">
            <div className="mx-auto max-w-6xl px-6">
                <h2 className="text-4xl font-bold pb-8">Contacto</h2>

                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <a href="tel:+523112279063" className="flex items-start gap-4">
                            <Phone className="text-[#40222D]" />
                            <div>
                                <h4 className="font-semibold">Teléfono</h4>
                                <p className="text-[#40222D]">+52 311 227 9063</p>
                            </div>
                        </a>

                        <div className="flex items-start gap-4">
                            <MessageCircle className="text-[#40222D]" />
                            <div>
                                <h4 className="font-semibold">WhatsApp</h4>
                                <a
                                    href="https://wa.link/ru37s4"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#40222D] underline hover:text-[#40222D]/50"
                                >
                                    +52 311 227 9063
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <Globe className="text-[#40222D]" />
                            <div>
                                <h4 className="font-semibold">Redes Sociales</h4>
                                <div className="flex gap-4 mt-1">
                                    <a
                                        href="https://www.facebook.com/ACCORPORATIVAA"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#40222D] hover:text-[#B49464]"
                                    >
                                        <Facebook />
                                    </a>
                                    <a
                                        href="https://www.instagram.com/accorporativa"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#40222D] hover:text-[#B49464]"
                                    >
                                        <Instagram />
                                    </a>
                                    <a
                                        href="https://www.tiktok.com/@ac.corporativa"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#40222D] hover:text-[#B49464]"
                                    >
                                        <svg
                                            className="size-6"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="1em"
                                            height="1em"
                                            viewBox="0 0 24 24">
                                            <path
                                                fill="currentColor"
                                                d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48"></path>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-end">
                        <div className="max-w-md text-center md:text-left">
                            <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
                                Potenciando personas, elevando empresas.
                            </h2>
                            <p className="mt-4 text-2xl">
                                Contáctanos hoy y descubre cómo podemos ayudarte a alcanzar tus objetivos.
                            </p>

                            <div className="mt-12 flex flex-wrap justify-center md:justify-start gap-4">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="bg-[#A65B6F] px-8 py-6 text-xl rounded-full"
                                    >
                                    <Link href="https://wa.link/ru37s4" target="_blank">
                                        Contáctenos
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}


export function CallToAction() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Potenciando personas, elevando empresas.</h2>
                    <p className="mt-4 text-2xl">Contáctanos hoy y descubre cómo podemos ayudarte a alcanzar tus objetivos.</p>

                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <Button
                            asChild
                            size="lg"
                            className='bg-[#A65B6F] px-8 py-6 text-xl rounded-full'
                        >
                            <Link href="https://wa.link/ru37s4" target='_blank'>
                                <span>Contáctenos</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}
