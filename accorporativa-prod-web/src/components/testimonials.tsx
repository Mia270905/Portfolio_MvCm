import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'

type Testimonial = {
    name: string
    role: string
    image: string
    quote: string
}

const testimonials: Testimonial[] = [
    {
        name: 'Patt Jimenez',
        role: 'A través de Facebook',
        image: '',
        quote: 'Recomiendo ampliamente las capacitaciones con Ana Corona y su equipo. (...) nos encontramos más que satisfechos con las actualizaciones y capacitaciones constantes!!',
    },
    {
        name: 'Torres Lizzette Ilenia',
        role: 'A través de Facebook',
        image: '',
        quote: 'Excelente capacitación y excelente trato',
    },
    {
        name: 'Cintia Garcia',
        role: 'A través de Facebook',
        image: '',
        quote: 'Muy didáctico y súper divertido aparte de aprender mucho te diviertes en el proceso, resuelven todas tus dudas con buena actitud 👌',
    },
    
]

const chunkArray = (array: Testimonial[], chunkSize: number): Testimonial[][] => {
    const result: Testimonial[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize))
    }
    return result
}

const testimonialChunks = chunkArray(testimonials, Math.ceil(testimonials.length / 3))

export default function WallOfLoveSection() {
    return (
        <section>
            <div className="py-16 md:py-32 bg-[#F2F2F2]">
                <div className="mx-auto max-w-6xl px-6">
                    <div className="text-center">
                        <h2 className=" text-3xl font-semibold">Opiniones de las personas</h2>
                        {/* <p className=" mt-6">Harum quae dolore orrupti aut temporibus ariatur.</p> */}
                    </div>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-12 lg:grid-cols-3">
                        {testimonialChunks.map((chunk, chunkIndex) => (
                            <div
                                key={chunkIndex}
                                className="space-y-3 flex flex-col"
                            >
                                {chunk.map(({ name, role, quote, image }, index) => (
                                    <Card key={index} className="h-full">
                                        <CardContent className="grid grid-cols-[auto_1fr] gap-3 pt-6">
                                            <Avatar className="size-9">
                                                <AvatarImage
                                                    alt={name}
                                                    src={image}
                                                    loading="lazy"
                                                    width="120"
                                                    height="120"
                                                />
                                                <AvatarFallback>{name.substring(0,2).toUpperCase()}</AvatarFallback>
                                            </Avatar>

                                            <div className="flex flex-col h-full">
                                                <h3 className="font-medium">{name}</h3>

                                                <span className="text-muted-foreground block text-sm tracking-wide">{role}</span>

                                                <blockquote className="mt-3">
                                                    <p className="text-gray-700 dark:text-gray-300">{quote}</p>
                                                </blockquote>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
