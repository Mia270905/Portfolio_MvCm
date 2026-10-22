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
            <main className="pt-8 relative min-h-screen bg-[#0c0a09] text-gray-200">
                {/* Fondos decorativos coherentes con el sitio */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-gray-900/20 to-black/30" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-400/5 via-transparent to-transparent" />
                </div>

                <section className="relative z-10 mx-auto max-w-4xl px-6 py-24">
                    {/* Encabezado */}
                    <header className="mb-12 text-center">
                        <h1 className="text-3xl md:text-4xl font-medium text-white">
                            Aviso de Privacidad Integral
                        </h1>
                        <p className="mt-4 text-sm text-gray-400">
                            Última actualización: 12 de diciembre de 2025
                        </p>
                    </header>

                    {/* Contenido */}
                    <article className="space-y-10 text-sm leading-relaxed">
                        {/* I */}
                        <section>
                            <h2 className="text-lg font-medium text-amber-400 mb-3">
                                I. Datos del Responsable
                            </h2>
                            <p>
                                Con fundamento en los artículos 2, 7, 9, 14 y 21 de la Ley Federal de Protección   
                                de Datos Personales en Posesión de los particulares; artículos 3, 4   
                                fracción II, 17, 18 y 19 de la Ley de Protección de Datos Personales En   
                                Posesión de Sujetos Obligados Para El Estado de Nayarit, y demás que   
                                resulten aplicables, la moral A{" "}
                                <strong>ALVEUS SOFT, S.A.S.</strong>, con domicilio físico en   
                                Calle Higuera número 25 de la Colonia Nayarabastos, Código Postal   
                                63173 de la Ciudad Tepic, Nayarit, se constituye como la responsable del   
                                uso y protección de sus datos personales, por lo cual le informa lo   
                                siguiente:   
                            </p>
                        </section>

                        {/* II */}
                        <section>
                            <h2 className="text-lg font-medium text-amber-400 mb-3">
                                II. Finalidades del tratamiento de los datos personales
                            </h2>
                            <p>
                                Los datos personales recabados serán utilizados única y exclusivamente para   
                                las siguientes finalidades, mismas que son necesarias para el ejercicio de las   
                                funciones de la relación que subsiste:  
                            </p>
                            <ul className="mt-3 list-disc pl-6 space-y-2">
                                <li>
                                    Mantener actualizada nuestra base de datos de clientes con la finalidad   
                                    de brindar un servicio eficaz y oportuno, de atención personalizada.  
                                </li>
                                <li>
                                    Medios de comunicación: información básica sobre los datos de   
                                    localización que nos permiten y facilitan brindarle una mejor atención,   
                                    como lo son envío de notificaciones, comunicación telefónica, envío de   
                                    información de servicios por terceros.  
                                </li>
                            </ul>

                            <p className="mt-4">
                                Asimismo, de manera adicional se podrá utilizar su información personal para:
                            </p>
                            <ul className="mt-3 list-disc pl-6 space-y-2">
                                <li>
                                    Evaluación: información recabada para apreciar la calidad del servicio   
                                    brindado por la moral Alveus Soft, S.A.S., lo cual permite y facilita   
                                    brindarles una mejor atención a sus necesidades.  
                                </li>
                                <li>
                                    Difusión: información recabada para difundir y hacer llegar invitaciones   
                                    a eventos especiales que realice la responsable de sus datos personales   
                                    o para fines de difusión comercial en lo que respecta únicamente a la   
                                    marca comercial de la persona titular.   
                                </li>
                            </ul>
                            <p className="mt-4">
                                Asimismo, le informamos que con fundamento en el artículo 29 de la Ley de   
                                Protección de Datos Personales En Posesión de Sujetos Obligados Para El   
                                Estado de Nayarit, Alveus Soft, S.A.S. no está obligado a recabar el   
                                consentimiento del titular para el tratamiento de sus datos personales en los   
                                siguientes casos:  
                            </p>
                            <ol className="mt-3 list-[upper-roman] pl-6 space-y-2">
                                <li>
                                    Cuando una ley así lo disponga. 
                                </li>
                                <li>
                                    Cuando las transferencias que se realicen entre responsables, sean   
                                    sobre datos personales que se utilicen para el ejercicio de facultades   
                                    propias, compatibles o análogas.      
                                </li>
                                <li>
                                    Cuando exista una orden judicial, resolución o mandato fundado y   
                                    motivado de autoridad competente.   
                                </li>
                                <li>
                                    Para el reconocimiento o defensa de derechos del titular ante   
                                    autoridad competente.   
                                </li>
                                <li>
                                    Cuando los datos personales se requieran para ejercer un derecho o   
                                    cumplir obligaciones derivadas de una relación jurídica entre el   
                                    titular y el AGN.   
                                </li>
                                <li>
                                    Cuando exista una situación de emergencia que potencialmente   
                                    pueda dañar a un individuo en su persona o en sus bienes.    
                                </li>
                                <li>
                                    Cuando los datos personales sean necesarios para efectuar un tratamiento 
                                    para la prevención, diagnóstico, la prestación de asistencia sanitaria. 
                                </li>
                                <li>
                                    Cuando los datos personales figuren en fuentes de acceso público.   
                                </li>
                                <li>
                                    Cuando los datos personales se sometan a un procedimiento previo   
                                    de disociación.   
                                </li>
                                <li>
                                    Cuando el titular de los datos personales sea una persona reportada   
                                    como desaparecida en los términos de la ley en la materia.  
                                </li>
                            </ol>
                        </section>

                        {/* III */}
                        <section>
                            <h2 className="text-lg font-medium text-amber-400 mb-3">
                                III. Tipo de datos personales recabados
                            </h2>
                            <p>
                                Para llevar a cabo las finalidades descritas en el presente aviso de privacidad,   
                                utilizaremos las siguientes categorías de datos personales:  
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>
                                    <strong>Datos de identificación de persona física.</strong> Información concerniente a   
                                    una persona que permite diferenciarla de otras en una colectividad,   
                                    tales como: nombre; firma; Registro Federal de Contribuyentes (RFC);   
                                    Clave Única de Registro de Población (CURP); lugar y fecha de   
                                    nacimiento; nacionalidad.  
                                </li>
                                <li>
                                    <strong>Datos de identificación de persona moral.</strong> Información concerniente   
                                    a una persona moral que permite diferenciarla de otras, tales como:   
                                    razón social; nombre de su representante o apoderado legal; nombre   
                                    comercial, firma; y Registro Federal de Contribuyentes (RFC).  
                                </li>
                                <li>
                                    <strong>Datos de contacto.</strong> Información que permite mantener o entrar en   
                                    contacto con el titular de los datos personales, tal como domicilio; correo   
                                    electrónico; teléfono fijo y teléfono celular.  
                                </li>
                                <li>
                                    <strong>Datos para medios de comunicación.</strong> Para la promoción de los   
                                    servicios de Alveus Soft, S.A.S. en redes sociales, página web, material   
                                    impreso, folletos y cualquier otro medio de comunicación.  
                                    Cualquier otro fin relacionado con el objeto social de Alveus Soft, S.A.S.
                                    Dicho consentimiento es voluntario y puede ser revocado en cualquier   
                                    momento mediante una solicitud por escrito dirigida a Alveus Soft, S.A.S.   
                                    de manera física o por medio del correo electrónico:{" "}   
                                    <a
                                        href="mailto:contacto@alveussoft.com"
                                        className="text-amber-400 hover:underline"
                                    >contacto@alveussoft.com </a>
                                    con la salvedad de que dicha revocación no   
                                    afectará el uso de las imágenes previamente publicadas o utilizadas.  
                                </li>
                            </ul>
                        </section>

                        {/* IV */}
                        <section>
                            <h2 className="text-lg font-medium text-amber-400 mb-3">
                                IV. Mecanismos para manifestar negativa
                            </h2>
                            <p>
                                Para el caso de las finalidades adicionales de difusión y evaluación, se requiere   
                                su consentimiento para el tratamiento, por ello, en caso de que no desee que   
                                sus datos personales sean tratados para estos fines, puede manifestarlo así al   
                                correo electrónico {" "}
                                <a
                                    href="mailto:contacto@alveussoft.com"
                                    className="text-amber-400 hover:underline"
                                >
                                    contacto@alveussoft.com
                                </a>
                                .
                            </p>
                        </section>

                        {/* V */}
                        <section>
                            <h2 className="text-lg font-medium text-amber-400 mb-3">
                                V. Fundamento legal
                            </h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Artículos 6º y 16 de la Constitución Política de los Estados Unidos Mexicanos.</li>
                                <li>
                                    Artículos 3, 4 fracción II, 12, 17, 18 y 19 de la Ley de Protección
                                    de Datos Personales en Posesión de Sujetos Obligados para el
                                    Estado de Nayarit.
                                </li>
                            </ul>
                        </section>

                        {/* VI */}
                        <section>
                            <h2 className="text-lg font-medium text-amber-400 mb-3">
                                VI. Transferencia de datos personales
                            </h2>
                            <p>
                                Le informamos que sus datos personales no son compartidos con personas,   
                                empresas, organizaciones y autoridades distintas al responsable o terceros   
                                con los que se guarda relación jurídica comercial para fines del servicio.  
                            </p>
                        </section>

                        {/* VII */}
                        <section>
                            <h2 className="text-lg font-medium text-amber-400 mb-3">
                                VII. Medidas de seguridad
                            </h2>
                            <p>
                                Alveus Soft, S.A.S. ha implementado medidas de seguridad técnicas,   
                                administrativas y físicas para proteger los datos personales contra daño,   
                                pérdida, alteración, destrucción o uso no autorizado, en apego a lo dispuesto   
                                en la normatividad aplicable.  
                            </p>
                        </section>

                        {/* VIII */}
                        <section>
                            <h2 className="text-lg font-medium text-amber-400 mb-3">
                                VIII. Derechos ARCO
                            </h2>
                            <p>
                                Usted tiene derecho a conocer qué datos personales se tienen de usted, para   
                                qué se utilizan y las condiciones del uso que les damos (Acceso). Asimismo, es   
                                su derecho solicitar la corrección de su información personal en caso de que   
                                esté desactualizada, sea inexacta o incompleta (Rectificación); que la   
                                eliminemos de nuestros registros o bases de datos cuando considere que la   
                                misma no está siendo utilizada conforme a los principios, deberes y   
                                obligaciones previstas en la ley (Cancelación); así como oponerse al uso de sus   
                                datos personales para fines específicos (Oposición). Estos derechos se conocen   
                                como derechos ARCO.  
                            </p>
                            <ol className="list-decimal pl-6 space-y-4 mt-4">
                                <li>
                                    Para el ejercicio de cualquiera de los derechos ARCO, usted podrá presentar solicitud por escrito ante la Unidad de Transparencia, formato o medio electrónico, la que deberá contener:
                                    <ul className="list-disc pl-6 space-y-2 mt-2">
                                    <li>El nombre del titular y su domicilio o cualquier otro medio para recibir notificaciones;</li>
                                    <li>Los documentos que acrediten la identidad del titular, y en su caso, la personalidad e identidad de su representante;</li>
                                    <li>De ser posible, el área responsable que trata los datos personales;</li>
                                    <li>La descripción clara y precisa de los datos personales respecto de los que se busca ejercer alguno de los derechos ARCO, salvo que se trate del derecho de acceso;</li>
                                    <li>La descripción del derecho ARCO que se pretende ejercer, o bien, lo que solicita el titular, y</li>
                                    <li>Cualquier otro elemento o documento que facilite la localización de los datos personales, en su caso.</li>
                                    </ul>
                                </li>
                            </ol>
                            <p className="mt-2">
                                En caso de solicitar la rectificación, adicionalmente deberá indicar las   
                                modificaciones a realizarse y aportar la documentación oficial necesaria que   
                                sustente su petición. En el derecho de cancelación debe expresar las causas   
                                que motivan la eliminación. Y en el derecho de oposición debe señalar los   
                                motivos que justifican se finalice el tratamiento de los datos personales y el   
                                daño o perjuicio que le causaría, o bien, si la oposición es parcial, debe indicar   
                                las finalidades específicas con las que se no está de acuerdo, siempre que no   
                                sea un requisito obligatorio.  
                            </p>
                            <p className="mt-2">
                                La Unidad de Transparencia responderá en el domicilio o medio que el titular   
                                de los datos personales designe en su solicitud, en un plazo de 15 días hábiles,   
                                que puede ser ampliado por 10 días hábiles más previa notificación. La   
                                respuesta indicará si la solicitud de acceso, rectificación, cancelación u 
                                oposición es procedente y, en su caso, hará efectivo dentro de los 15 días   
                                hábiles siguientes a la fecha en que comunique la respuesta.  
                            </p>
                        </section>

                        {/* IX */}
                        <section>
                            <h2 className="text-lg font-medium text-amber-400 mb-3">
                                IX. Unidad de Transparencia
                            </h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><span className="underline">Domicilio:</span> Calle Higuera 25, Col. Nayarabastos, Tepic, Nayarit.</li>
                                <li><span className="underline">Teléfono:</span> 311 122 1842</li>
                                <li><span className="underline">Correo electrónico:</span> contacto@alveussoft.com</li>
                            </ul>
                        </section>

                        {/* X */}
                        <section>
                            <h2 className="text-lg font-medium text-amber-400 mb-3">
                                X. Cambios al Aviso de Privacidad
                            </h2>
                            <p className="mt-2"> 
                                En caso de realizar alguna modificación al Aviso de Privacidad, se le hará de su   
                                conocimiento mediante correo electrónico.  
                            </p>
                            <p className="mt-2">
                                *NOTA: El texto puede sufrir modificaciones según se actualicen los requisitos,   
                                según el medio o mecanismo por el que se dé a conocer. El diseño, tipografía,   
                                o inclusión de colores o imágenes es responsabilidad de cada sujeto obligado   
                                siempre que no contravenga lo dispuesto por la ley.  
                            </p>
                            <p className="mt-2">
                                Asimismo, en caso de duda y aclaración podrá comunicarse a la Unidad de   
                                Transparencia en los términos de los datos de contacto precisados en el   
                                punto VIII del presente aviso de privacidad.  
                            </p>
                        </section>
                    </article>

                    {/* Footer legal */}
                    <footer className="mt-16 border-t border-gray-700/50 pt-6 text-center text-xs text-gray-400">
                        <p>
                            Tepic, Nayarit, a 12 de diciembre de 2025 ·{" "}
                            <Link href="/" className="text-amber-400 hover:underline">
                            ALVEUS SOFT
                            </Link>
                        </p>
                    </footer>
                </section>
            </main>
            <FooterSection/>
            <WhatsAppFloat
                contacts={contacts}
                headerText="Iniciar conversación"
                subtitleText=""
                responseTimeText="El equipo suele responder en unos minutos."
            />
        </>
    );
}
