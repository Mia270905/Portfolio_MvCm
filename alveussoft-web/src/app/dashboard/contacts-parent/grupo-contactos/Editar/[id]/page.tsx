"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ContactGroup } from "@/components/dashboard/grupo-de-contactos/contact-group-list";
import ContactGroupForm from "@/components/dashboard/grupo-de-contactos/contact-group-form";
import { updateContactGroup } from "@/lib/actions/contact_group.actions";
import { uploadFile } from "@/lib/supabase/upload-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactGroupListSkeleton } from "@/components/dashboard/grupo-de-contactos/contact-group-list-skeleton";
import { ContactList } from "@/components/contacts/contact-list";
import { GroupContactsList } from "@/components/dashboard/grupo-de-contactos/group-contacts-list";
import { deleteGroupContacts } from "@/lib/actions/contact.actions";

const supabase = createClient();

export default function EditContactGroupPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [contactGroup, setContactGroup] = useState<ContactGroup | null>(null);
  const [formData, setFormData] = useState<Partial<ContactGroup>>({
    title: "",
    description: "",
    image_url: "",
    active: true,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadedStatus, setLoadedStatus] = useState("loading");
  const [activeTab, setActiveTab] = useState("info"); // "info" o "children"

  const contactGroupId = params.id as string;

  // Obtener el grupo de contactos al cargar la página
  useEffect(() => {
    if (!contactGroupId) {
      setLoadedStatus("failed");
      return;
    }

    const fetchContactGroup = async () => {
      try {
        const { data, error } = await supabase
          .from("contact_groups")
          .select("*")
          .eq("id", contactGroupId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setContactGroup(data);
          setFormData({
            title: data.title,
            description: data.description,
            image_url: data.image_url || "",
            active: data.active,
          });
        }
        setLoadedStatus("loaded");
      } catch (error) {
        console.error("Error al obtener grupo de contactos:", error);
        toast.error("Error al cargar el grupo de contactos");
        setLoadedStatus("failed");
      } finally {
        setIsFetching(false);
      }
    };

    if (contactGroupId) {
      fetchContactGroup();
    }
  }, [contactGroupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Usuario no autenticado");

      let imageUrl = formData.image_url as string | undefined;

      if (formData.image_url && formData.image_url instanceof File) {
        const uploadResult = await uploadFile(
          "contactGroups",
          contactGroupId,
          formData.image_url
        );
        if (!uploadResult.success) {
          toast.error("Error al subir la imagen: " + uploadResult.error);
          setLoading(false);
          return;
        }
        imageUrl = uploadResult.url;
      }

      if (!formData.image_url) {
        imageUrl = "";
      }

      const result = await updateContactGroup({
        contactGroupId,
        title: formData.title!,
        description: formData.description!,
        image_url: imageUrl,
        active: formData.active,
        userId: user.id,
      });

      if (result.success) {
        setContactGroup(result.data!);
        toast.success("¡Grupo de contactos actualizado con éxito!");
        // Recargar datos si estamos en la pestaña de hijos
        if (activeTab === "children") {
          // Podrías recargar la página o manejar de otra manera
          setTimeout(() => {
            router.refresh();
          }, 500);
        } else {
          setTimeout(
            () => router.push("/dashboard/contacts-parent/grupo-contactos"),
            1500
          );
        }
      } else {
        toast.error("Error al actualizar el grupo de contactos: " + result.message);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error inesperado al actualizar el grupo de contactos");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleToggleActive = () => {
    setFormData((prev) => ({ ...prev, active: !prev.active }));
  };

  if (isFetching) {
    return (
      <div>
        <div className="mb-6">
          <div className="inline-flex items-center text-gray-600 p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="h-8 bg-gray-800 rounded-sm w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-800 rounded-sm w-96 animate-pulse"></div>
          </div>

          <div className="bg-[#0A0F17] rounded-lg shadow-xs border border-gray-800 p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-10 bg-gray-800 rounded"></div>
              <div className="h-24 bg-gray-800 rounded"></div>
              <div className="h-10 bg-gray-800 rounded"></div>
              <div className="h-10 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contactGroup) {
    return (
      <div>
        <div className="mb-6">
          <a
            href="/dashboard/contacts-parent/grupo-contactos"
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </a>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Grupo de contacto no encontrado
            </h1>
            <p className="text-gray-500 mb-4">
              El grupo de contacto que intentas editar no existe o ha sido eliminada.
            </p>
            <a
              href="/dashboard/contacts-parent/grupo-contactos"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Grupos de Contactos
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <a
          href="/dashboard/contacts-parent/grupo-contactos"
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Editar Grupo de Contactos</h1>
          <p className="text-gray-500 mt-1">
            Modifica los datos del grupo de contactos
          </p>
        </div>

        {loadedStatus === "loading" ? (
          <ContactGroupListSkeleton />
        ) : loadedStatus === "failed" ? (
          <div className="text-center py-12">
            <p className="text-gray-200">
              No se encontró la empresa específicada.
            </p>
            <button
              onClick={() => router.push("/dashboard/empresas-padre/empresas")}
              className="mt-4 inline-flex items-center text-yellow-400 hover:text-yellow-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Empresas
            </button>
          </div>
        ) : (
          <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-gray-900/50 border border-gray-800">
              <TabsTrigger 
                value="info" 
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900 transition-all"
              >
                Información General
              </TabsTrigger>
              <TabsTrigger 
                value="children" 
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all"
              >
                Contactos del Grupo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-0">
              <ContactGroupForm
              handleSubmit={handleSubmit}
              formData={formData}
              handleChange={handleChange}
              handleToggleActive={handleToggleActive}
              errors={errors}
              buttonText="Actualizar"
              buttonLoadingText="Actualizando..."
              loading={loading}
              onImageChange={(fileOrUrl: string | File) =>
                setFormData((prev) => ({ ...prev, image_url: fileOrUrl }))
              }
            />
            </TabsContent>

            <TabsContent value="children" className="mt-0">
              <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-6">
                <GroupContactsList
                  contactGroupId={contactGroupId}
                  userPermissions={["read:contacts", "update:contacts", "delete:contacts", "create:contacts", "create:group_contacts", "update:group_contacts", "delete:group_contacts"]} 
                  onRemoveAffiliation={async (gcId) => {
                  const result = await deleteGroupContacts(gcId);
                    if (!result.success) {
                      throw new Error(result.message);
                    }
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
