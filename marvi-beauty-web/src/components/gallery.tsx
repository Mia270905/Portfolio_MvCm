import { Card } from "./ui/card2";
import { AnimatedText } from "./animations/animated-text";
import { AnimatedCard } from "./animations/animated-card";
import { Star } from "lucide-react";

export default function GallerySection() {
  return (
    <section className="py-20 lg:py-32 bg-[#E3E2DD]">
        <div className="text-center mb-16">
          <AnimatedText>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 flex gap-3">
              <Star className="w-3 h-3 text-[#EFA8B8] fill-[#EFA8B8]" />
              <Star className="w-4 h-4 text-[#EFA8B8] fill-[#EFA8B8]" />
              <Star className="w-3 h-3 text-[#EFA8B8] fill-[#EFA8B8]" />
            </div>
          <h2 className="font-serif text-4xl lg:text-6xl font-bold text-[#D97B93] mb-4 text-balance">
            Nuestros Trabajos
          </h2>
          <p className="text-lg text-[#987E71] max-w-2xl mx-auto leading-relaxed">
            Descubre algunos de nuestros diseños más recientes y populares
          </p>
          </AnimatedText>
        </div>
      <div className="mx-auto max-w-6xl space-y-8 md:space-y-16 max-h-max">
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 px-6">
            <AnimatedCard> <Card src="/assets/1.jpg" title="" /> </AnimatedCard>
            <AnimatedCard> <Card src="/assets/2.jpg" title="" /> </AnimatedCard>
            <AnimatedCard> <Card src="/assets/3.jpg" title="" /> </AnimatedCard>
            <AnimatedCard> <Card src="/assets/4.jpg" title="" /> </AnimatedCard>
            <AnimatedCard> <Card src="/assets/5.jpg" title="" /> </AnimatedCard>
            <AnimatedCard> <Card src="/assets/6.jpg" title="" /> </AnimatedCard>
          </div>
        </div>
    </section>
  );
}
