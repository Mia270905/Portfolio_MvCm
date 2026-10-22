import { ContactTabs } from "@/components/contacts/contact-tabs";


interface EditContactPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditContactPage({ params }: EditContactPageProps) {
  // Esperar a que los params se resuelvan
  const { id } = await params;
  
  return (
    <>
      <div className="bg-gray-[#04060B]">
        <ContactTabs contactId={id} />
      </div>
    </>
  );
}