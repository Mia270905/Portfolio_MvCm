import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AnimatedBlock } from './animated-block'

export default function CallToAction() {
    return (
        <section className="py-16">
            <div className="mx-auto max-w-5xl rounded-3xl border px-6 py-12 md:py-20 lg:py-32">
                <div className="text-center">
                     <AnimatedBlock>
                        <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
                            Lleva tu empresa al siguiente <span className='text-amber-400 font-bold'>nivel</span>
                        </h2>
                    </AnimatedBlock>

                    <AnimatedBlock delay={0.2}>
                        <p className="mt-4">
                            Asesoría, implementación y soporte continuo para optimizar tus procesos y asegurar un crecimiento real.
                        </p>
                    </AnimatedBlock>

                    <AnimatedBlock delay={0.4}>
                        <div className="mt-12 flex flex-wrap justify-center gap-4">
                            <Button
                                asChild
                                size="lg">
                                <Link href="https://wa.link/pxcv82" title='Contáctanos al instante por WhatsApp' target='_blank' className="inline-block transform transition-transform duration-200 ease-in-out hover:scale-110">
                                    <span>Hablemos ya!</span>
                                </Link>
                            </Button>

                            {/* <Button
                                asChild
                                size="lg"
                                variant="outline">
                                <Link href="/">
                                    <span>Book Demo</span>
                                </Link>
                            </Button> */}
                        </div>
                    </AnimatedBlock>

                </div>
            </div>
        </section>
    )
}
