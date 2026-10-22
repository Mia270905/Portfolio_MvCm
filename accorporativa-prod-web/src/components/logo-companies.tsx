import { AnimatedFadeIn } from "./animations/animated-fadein"

export default function LogoCompanies() {
    return (
        <section className="bg-background py-16">
            <div className="mx-auto max-w-5xl px-6">
                <h2 className="text-center text-lg font-medium">Marcas que confían en nosotros.</h2>
                <AnimatedFadeIn>
                    <div className="mx-auto mt-20 flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-8 sm:gap-x-16 sm:gap-y-12">
                        <img className="h-10 w-fit" src="/assets/logos/grupo-embotellador.png" alt="Grupo embotellador" height="20" width="auto" />
                        <img className="h-16 w-fit" src="/assets/logos/mitsubishi.svg" alt="Mitsubishi Motors" height="20" width="auto" />
                        <img className="h-12 w-fit" src="/assets/logos/logo-va.png" alt="Vallarta Adventures" height="20" width="auto" />
                        <img className="h-16 w-fit" src="/assets/logos/logo-aga.webp" alt="Aga" height="20" width="auto" />
                        <img className="h-20 w-fit" src="/assets/logos/logofray.jpg" alt="Fray Junipero" height="20" width="auto" />
                        <img className="h-20 w-fit" src="/assets/logos/jdsj.png" alt="Jardines de san Juan" height="20" width="auto" />
                    </div>
                </AnimatedFadeIn>
            </div>
        </section>
    )
}