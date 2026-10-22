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
    <div className="min-h-screen bg-[#F5F1E8] px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-4xl mx-auto bg-white border border-[#E5E1D8] rounded-xl p-6">
        <EditContactForm contactId={id} />
      </div>
    </div>
  );
}
