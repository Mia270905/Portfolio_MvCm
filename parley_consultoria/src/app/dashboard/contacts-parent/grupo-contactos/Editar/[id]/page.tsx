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
  const [activeTab, setActiveTab] = useState("info");

  const contactGroupId = params.id as string;

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
        if (activeTab === "children") {
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
        <div className="mb-6 p-4 lg:p-6">
          <div className="inline-flex items-center p-2">
            <ArrowLeft className="w-5 h-5 mr-2 text-neutral-400" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="h-8 bg-[#f5efe6] rounded-sm w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-[#f5efe6] rounded-sm w-96 animate-pulse"></div>
          </div>

          <div className="bg-white rounded-lg border border-[#f5efe6] p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-10 bg-[#faf8f3] rounded"></div>
              <div className="h-24 bg-[#faf8f3] rounded"></div>
              <div className="h-10 bg-[#faf8f3] rounded"></div>
              <div className="h-10 bg-[#faf8f3] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contactGroup) {
    return (
      <div>
        <div className="mb-6 p-4 lg:p-6">
          <button
            onClick={() => router.push("/dashboard/contacts-parent/grupo-contactos")}
            className="inline-flex items-center text-neutral-600 hover:text-[#c6a365] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-white rounded-xl border border-[#f5efe6] p-8 max-w-md mx-auto shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#fdeaea] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#c62828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Grupo de contacto no encontrado
              </h3>
              <p className="text-neutral-600 mb-6">
                El grupo de contacto que intentas editar no existe o ha sido eliminado.
              </p>
              <button
                onClick={() => router.push("/dashboard/contacts-parent/grupo-contactos")}
                className="inline-flex items-center text-[#c6a365] hover:text-[#b59555]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 p-4 lg:p-6">
        <button
          onClick={() => router.push("/dashboard/contacts-parent/grupo-contactos")}
          className="inline-flex items-center text-neutral-600 hover:text-[#c6a365] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Editar Grupo de Contactos</h1>
          <p className="text-neutral-600 mt-2">
            Modifica los datos del grupo de contactos
          </p>
        </div>

        {loadedStatus === "loading" ? (
          <ContactGroupListSkeleton />
        ) : loadedStatus === "failed" ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">
              No se encontró el grupo de contactos especificado.
            </p>
            <button
              onClick={() => router.push("/dashboard/contacts-parent/grupo-contactos")}
              className="mt-4 inline-flex items-center text-[#c6a365] hover:text-[#b59555]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
            </button>
          </div>
        ) : (
          <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-[#F5F1E8] border border-[#CFC7B8] rounded-lg p-1 shadow-sm">
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#a78447] data-[state=active]:to-[#c6a365] data-[state=active]:text-white
                          data-[state=inactive]:bg-[#EDE7D9] data-[state=inactive]:text-[#c6a365]
                          data-[state=active]:shadow-inner data-[state=active]:rounded-lg
                          hover:bg-[#c6a365] transition-all"
              >
                Información General
              </TabsTrigger>
              <TabsTrigger
                value="children"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#a78447] data-[state=active]:to-[#c6a365] data-[state=active]:text-white
                          data-[state=inactive]:bg-[#EDE7D9] data-[state=inactive]:text-[#4B4B4B]
                          data-[state=active]:shadow-inner data-[state=active]:rounded-lg
                          hover:bg-[#c6a365] transition-all"
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
              <div className="bg-white rounded-lg border border-[#f5efe6] p-6 shadow-sm">
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