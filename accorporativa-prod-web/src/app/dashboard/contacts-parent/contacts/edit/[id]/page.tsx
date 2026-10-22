import { EditContactForm } from "@/components/contacts/edit-contact-form";


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
      <div className="bg-white">
            <EditContactForm contactId={id} />
          </div>
    </>
  );
}