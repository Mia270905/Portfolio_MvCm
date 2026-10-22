import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'

export default function LogoCloud() {
    return (
        <section className="overflow-hidden py-10">
            <div className="group relative m-auto max-w-7xl px-6">
                <div className="flex flex-col items-center md:flex-row">
                    <div className="md:max-w-44 md:border-r md:pr-6">
                        <p className="text-end text-sm text-white">Impulsando a los mejores equipos</p>
                    </div>
                    <div className="relative py-6 md:w-[calc(100%-11rem)]">
                        <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
                            <div className="flex">
                                <img
                                    className="mx-auto max-h-[100px] h-auto w-auto object-contain"
                                    src="/assets/logos/mariposa.webp"
                                    alt="Mariposa"
                                />
                            </div>

                            <div className="flex">
                                <img
                                    className="mx-auto max-h-[100px] h-auto w-auto object-contain"
                                    src="/assets/logos/gobxalisco.png"
                                    alt="Gobierno Jalisco"
                                />
                            </div>

                            <div className="flex">
                                <img
                                    className="mx-auto max-h-[110px] h-auto w-auto object-contain"
                                    src="/assets/logos/polleria.png"
                                    alt="Polleria"
                                    height="80"
                                    width="auto"
                                />
                            </div>

                            <div className="flex">
                                <img
                                    className="mx-auto max-h-[80px] h-auto w-auto object-contain my-auto"
                                    src="/assets/logos/uan.png"
                                    alt="UAN"
                                />
                            </div>

                            <div className="flex">
                                <img
                                    className="mx-auto max-h-[100px] h-auto w-auto object-contain"
                                    src="/assets/logos/fiscalia.png"
                                    alt="Fiscalia"
                                />
                            </div>
        
                            <div className="flex">
                                <img
                                    className="mx-auto max-h-[100px] h-auto w-auto object-contain"
                                    src="/assets/logos/jasu.png"
                                    alt="Jasu"
                                />
                            </div>

                            <div className="flex">
                                <img
                                    className="mx-auto max-h-[100px] h-auto w-auto object-contain"
                                    src="/assets/logos/congreso.png"
                                    alt="Congreso"
                                />
                            </div>

                            <div className="flex">
                                <img
                                    className="mx-auto max-h-[100px] h-auto w-auto object-contain"
                                    src="/assets/logos/deleon.png"
                                    alt="De Leon"
                                />
                            </div>

                            <div className="flex">
                                <img
                                    className="mx-auto max-h-[100px] h-auto w-auto object-contain"
                                    src="/assets/logos/judicial.png"
                                    alt="Judicial"
                                />
                            </div>

                            {/*
                            <div className="flex">
                                <img
                                    className="mx-auto max-h-[100px] h-auto w-auto object-contain"
                                    src="/assets/logos/granjero.png"
                                    alt="Granjero"
                                />
                            </div>
                            */}                       

                            <div className="flex">
                                <img
                                    className="mx-auto max-h-[100px] h-auto w-auto object-contain"
                                    src="/assets/logos/sucret.png"
                                    alt="Sucret"
                                />
                            </div>
                        </InfiniteSlider>

                        {/* Quitamos los div con bg-linear */}
                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-20"
                            direction="left"
                            blurIntensity={1}
                        />
                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-20"
                            direction="right"
                            blurIntensity={1}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
