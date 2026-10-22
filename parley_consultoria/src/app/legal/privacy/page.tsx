import FooterSection from "@/components/footer";
import { HeroHeader } from "@/components/header";
import Link from "next/link";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";
import { getWhatsAppContacts } from "@/lib/utils/whatsapp_contacts";

export default async function AvisoDePrivacidadPage() {
  const contacts = await getWhatsAppContacts();

  return (
    <>
      <HeroHeader />

      <main className="relative min-h-screen bg-[#260d0d] text-gray-300">

        {/* Fondos */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-neutral-900/30 to-black/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent" />
        </div>

        <section className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8 py-24">

          {/* Header */}
          <header className="mb-16 text-center">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-wide text-white">
              Aviso de Privacidad Integral
            </h1>
          </header>

          {/* Documento */}
          <article className="space-y-12 text-[15px] leading-8 sm:text-base text-[justify]">

            {/* 0 */}
            <section>
              <p>
                <strong>Parley Consultoría Jurídica Integral</strong> con domicilio en Calle Paseo de Viena número 20, 
                fraccionamiento Ciudad del valle, Tepic, Nayarit, México, representado por Enrique Jordán del Toro Medina y Jesús Alberto Bautista García,
                es el sujeto obligado y responsable del tratamiento de los datos personales que se recaban de forma general a través  
                de <strong>https://parleyconsultoria.com/</strong>, los cuales serán protegidos conforme a lo dispuesto por 
                la Ley Federal De Protección De Datos Personales En Posesión De Los Particulares, 
                y demás normatividad que resulte aplicable.
              </p>
            </section>

            {/* 1 */}
            <section>
              <h2 className="text-xl font-semibold text-[#F78911] mb-4">
                1. Finalidades del tratamiento
              </h2>

              <p>
                Los datos personales que recabamos de usted, los utilizaremos para las siguientes finalidades: Mantener actualizada 
                nuestra base de datos de clientes con la finalidad de brindar un servicio eficaz y oportuno, de atención personalizada. De manera adicional, 
                utilizaremos su información personal para las siguientes finalidades que no son necesarias, pero que nos permiten y facilitan brindarle una mejor atención: 
                Envío de notificaciones, comunicación telefónica, envió de información de servicios y/o invitaciones a eventos.
                Utilizar <strong>Parley Consultoría Jurídica Integral</strong> la información recabada con terceros que trabajen con el sujeto obligado para el cumplimiento 
                de los servicios contratados a medida de lo aplicable. En caso de que no desee que sus datos personales sean tratados para estos fines adicionales, esta plataforma 
                le permitirá indicarlo o usted puede manifestarlo así al correo electrónico: <strong>contacto@parleyconsultoria.com</strong>
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-semibold text-[#F78911] mb-4">
                2. Datos personales recabados
              </h2>
              <p>
                Para las finalidades antes señaladas se solicitarán los siguientes datos personales: Nombre completo, estado civil, fecha de nacimiento, nombre comercial, 
                domicilio, número telefónico, RFC, CURP, firma. Adicionalmente, se recaban datos sensibles como: Actividades que puedan ser objeto de servicios jurídicos.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-semibold text-[#F78911] mb-4">
                3. Fundamento legal
              </h2>
              <p>
                El fundamento para el tratamiento de datos personales y transferencias es el artículo 12 de la Ley Federal De Protección De Datos 
                Personales En Posesión De Los Particulares
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-semibold text-[#F78911] mb-4">
                4. Transferencia de datos personales
              </h2>
              <p>
                Le informamos que sus datos personales no son compartidos con personas, empresas, organizaciones y autoridades distintas al responsable.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-semibold text-[#F78911] mb-4">
                5. Derechos ARCO
              </h2>
              <p className="mb-4">
                Usted tiene derecho a conocer qué datos personales se tienen de usted, para qué se utilizan y las condiciones del uso que les damos (Acceso). 
                Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); 
                que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada conforme a los principios, 
                deberes y obligaciones previstas en la ley (Cancelación); así como oponerse al uso de sus datos personales para fines específicos (Oposición). 
                Estos derechos se conocen como derechos ARCO. Para el ejercicio de cualquiera de los derechos ARCO, usted podrá presentar solicitud por escrito ante la Unidad de Transparencia, 
                formato o medio electrónico, la que deberá contener:
              </p>

              <ul className="list-disc pl-6 space-y-2 mb-4 leading-tight">
                El nombre del titular y su domicilio o cualquier otro medio para recibir notificaciones;
                Los documentos que acrediten la identidad del titular, y en su caso, la personalidad e identidad de su representante;
                De ser posible, el área responsable que trata los datos personales;
                La descripción clara y precisa de los datos personales respecto de los que se busca ejercer alguno de los derechos ARCO, salvo que se trate del derecho de acceso;
                La descripción del derecho ARCO que se pretende ejercer, o bien, lo que solicita el titular;
                Cualquier otro elemento o documento que facilite la localización de los datos personales, en su caso.
              </ul>

              <p className="mb-4">
                En caso de solicitar la rectificación, adicionalmente deberá indicar las modificaciones a realizarse y aportar la documentación oficial necesaria que sustente su petición. 
                En el derecho de cancelación debe expresar las causas que motivan la eliminación. Y en el derecho de oposición debe señalar los motivos que justifican se finalice el tratamiento 
                de los datos personales y el daño o perjuicio que le causaría, o bien, si la oposición es parcial, debe indicar las finalidades específicas con las que se no está de acuerdo, 
                siempre que no sea un requisito obligatorio. La Unidad de Transparencia responderá en el domicilio o medio que el titular de los datos personales designe en su solicitud, 
                en un plazo de 15 días hábiles, que puede ser ampliado por 10 días hábiles más previa notificación. La respuesta indicará si la solicitud de acceso, rectificación, cancelación 
                u oposición es procedente y, en su caso, hará efectivo dentro de los 15 días hábiles siguientes a la fecha en que comunique la respuesta.

              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-semibold text-[#F78911] mb-4">
                6. Datos de la Unidad de Transparencia
              </h2>

              <ul className="list-disc pl-6 space-y-2">
                <li>Domicilio: Calle Paseo de Viena número 20, fraccionamiento Ciudad del valle, Tepic, Nayarit, México.</li>
                <li>Teléfono: 311 132 16691</li>
                <li>Correo electrónico institucional: contacto@parleyconsultoria.com</li>
              </ul>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-semibold text-[#F78911] mb-4">
                7. Cambios al Aviso de Privacidad
              </h2>

              <p>
                En caso de realizar alguna modificación al Aviso de Privacidad, se le hará de su conocimiento mediante correo electrónico.
                *NOTA: El texto puede sufrir modificaciones según se actualicen los requisitos, según el medio o mecanismo por el que se dé a conocer. 
                El diseño, tipografía, o inclusión de colores o imágenes es responsabilidad de cada sujeto obligado siempre que no contravenga lo dispuesto por la ley.
              </p>
            </section>
          </article>

          {/* Footer legal */}
          <footer className="mt-20 border-t border-gray-700/50 pt-6 text-center text-xs text-gray-400">
            <p>
              Tepic, Nayarit ·{" "}
              <Link href="/" className="text-[#F78911] hover:underline">
                Parley Consultoría Integral
              </Link>
            </p>
          </footer>

        </section>
      </main>

      <FooterSection />

      <WhatsAppFloat
        contacts={contacts}
        headerText="Iniciar conversación"
        subtitleText=""
        responseTimeText="El equipo suele responder en unos minutos."
      />
    </>
  );
}