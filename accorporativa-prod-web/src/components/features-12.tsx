'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ChartBarIncreasingIcon, Coins, Database, Fingerprint, IdCard } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { BorderBeam } from '@/components/magicui/border-beam'
import { AnimatedText } from './animated-text'

export default function FeaturesButtons() {
    type ImageKey = 'item-1' | 'item-2' | 'item-3' | 'item-4'
    const [activeItem, setActiveItem] = useState<ImageKey>('item-1')

    const images = {
        'item-1': {
            image: '/assets/landing/laptop.avif',
            alt: 'Mejora de eficiencia',
        },
        'item-2': {
            image: '/assets/landing/planning.avif',
            alt: 'Ahorro de costos',
        },
        'item-3': {
            image: '/assets/landing/comunication.avif',
            alt: 'Soporte continuo',
        },
        'item-4': {
            image: '/assets/landing/growth.jpg',
            alt: 'Crecimiento sostenible',
        },
    }

    return (
        <section className="py-12 md:py-20 lg:py-32 ">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16 lg:space-y-20 dark:[--color-border:color-mix(in_oklab,var(--color-white)_10%,transparent)]">
                <div className="relative z-10 mx-auto max-w-2xl space-y-6 text-center">
                    <AnimatedText>
                        <h2 className="text-balance text-4xl font-semibold lg:text-6xl">
                        Impulsa tu negocio con resultados <span className="text-amber-400">reales</span>
                        </h2>
                    </AnimatedText>

                    <AnimatedText>
                        <p>
                        A través de nuestra experiencia en consultoría, implementación y soporte, ofrecemos soluciones que impactan directamente en la eficiencia y rentabilidad de tu negocio. Nos enfocamos en resultados concretos, optimizando procesos y adaptando nuestras estrategias a tus necesidades específicas para asegurar un crecimiento sostenible y real.
                        </p>
                    </AnimatedText>
                </div>

                <div className="grid gap-12 sm:px-12 md:grid-cols-2 lg:gap-20 lg:px-0">
                    <Accordion
                        type="single"
                        value={activeItem}
                        onValueChange={(value) => setActiveItem(value as ImageKey)}
                        className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-base">
                                    <Database className="size-4 text-amber-400" />
                                    Mejora en la eficiencia.
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>Al optimizar tus procesos internos, logramos que tu equipo trabaje de manera más ágil y eficiente, reduciendo tiempos de espera y eliminando tareas redundantes. Esto se traduce en una mayor productividad y en un aprovechamiento más efectivo de los recursos disponibles.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-base">
                                    <Coins className="size-4 text-amber-400" />
                                    Ahorro de costos
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>Nuestras soluciones están diseñadas para identificar y eliminar gastos innecesarios, ayudando a tu empresa a optimizar sus inversiones. Con un enfoque estratégico, implementamos tecnologías y procesos que no solo reducen los costos operativos, sino que también mejoran el retorno de inversión a largo plazo.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-base">
                                    <IdCard className="size-4 text-amber-400" />
                                    Soporte continuo
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>No solo te entregamos una solución, sino que nos aseguramos de que continúes recibiendo asistencia y ajustes a lo largo del tiempo. Nuestro soporte proactivo garantiza que cualquier desafío o cambio en tus necesidades se maneje de manera rápida y eficaz, asegurando que siempre estés un paso adelante.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-base">
                                    <ChartBarIncreasingIcon className="size-4 text-amber-400" />
                                    Crecimiento sostenible
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>Implementamos estrategias que no solo generan resultados inmediatos, sino que también fomentan el crecimiento a largo plazo de tu empresa. Al centrarnos en soluciones escalables, ayudamos a tu negocio a adaptarse y prosperar en un entorno cambiante, asegurando que puedas seguir creciendo de manera estable y rentable.</AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <div className="bg-background relative flex overflow-hidden rounded-3xl border p-2">
                        <div className="w-15 absolute inset-0 right-0 ml-auto border-l bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_8px)]"></div>
                        <div className="aspect-76/59 bg-background relative w-[calc(3/4*100%+3rem)] rounded-2xl">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${activeItem}-id`}
                                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                    className="size-full overflow-hidden rounded-2xl border bg-zinc-900 shadow-md">
                                    <Image
                                        src={images[activeItem].image}
                                        className="size-full object-cover object-left-top dark:mix-blend-lighten"
                                        alt={images[activeItem].alt}
                                        width={1207}
                                        height={929}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <BorderBeam
                            duration={6}
                            size={200}
                            className="from-transparent via-yellow-700 to-transparent dark:via-white/50"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
