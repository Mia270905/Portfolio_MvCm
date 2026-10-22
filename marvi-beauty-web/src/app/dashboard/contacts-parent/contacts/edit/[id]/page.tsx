import { EditContactForm } from "@/components/contacts/edit-contact-form";
import { ArrowLeft } from "lucide-react";

interface EditContactPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditContactPage({ params }: EditContactPageProps) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen">
      <div className="mb-6 p-4">
        <a 
          href="/dashboard/contacts-parent/contacts" 
          className="inline-flex items-center text-foreground hover:text-primary p-2 hover:bg-muted rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Editar Contacto</h1>
        </div>
        <EditContactForm contactId={id} />
      </div>
    </div>
  );
}