"use client"

import { ArrowLeft, Image, MoreVertical, Upload, Check, X, CloudUpload } from "lucide-react";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense, useRef } from "react";
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { uploadLogo } from "@/lib/actions/logo.actions"
import { logoUrls } from "@/lib/utils/logoUrlHandler"

export default function Page() {
    const router = useRouter()
    const [user, setUser] = useState()
    const [permissions, setPermissions] = useState<string[]>([])
    const [canUpload, setCanUpload] = useState(false);
    const inputFileRefLogo = useRef(null);
    const inputFileRefLongLogo = useRef(null);
    const inputFileRefMiniLogo = useRef(null);
    
    const [pendingUploads, setPendingUploads] = useState({
        logo: { file: null as File | null, previewUrl: '' },
        longLogo: { file: null as File | null, previewUrl: '' },
        miniLogo: { file: null as File | null, previewUrl: '' }
    });

    let imageUrls = {
        logo: logoUrls.logo,
        miniLogo: logoUrls.minilogo,
        longlogo: logoUrls.longlogo
    }

    useEffect(() => {
        const loadUserAndPermissions = async () => {
        try {
            const localUser = await getUserWithPermissions();
            const localPermissions = Array.isArray(localUser?.permissions)
            ? localUser.permissions.map((p: any) => p.code)
            : [];
            await setUserAndPermissions(localUser,localPermissions);            
        } catch (error) {
            toast.error("No se pudieron cargar los permisos del usuario.")
        }
        };
        loadUserAndPermissions();
    }, []);

    async function setUserAndPermissions(user: any, permissions: string[]){
        setUser(user);
        setPermissions(permissions)

        if(!permissions.includes('menu:logo')){
            toast.error("No tiene permiso para acceder a este módulo.")
            router.push('/dashboard/seguridad')
        }

        if(permissions.includes('upload:logo')){
            setCanUpload(true);
        }
    }

    const handleButtonClickLogo = () => {
        if(!!inputFileRefLogo.current && typeof(inputFileRefLogo.current) == 'object'){
            //@ts-ignore
            inputFileRefLogo.current.click();
        }
    };
    const handleButtonClickLongLogo = () => {
        if(!!inputFileRefLongLogo.current && typeof(inputFileRefLongLogo.current) == 'object'){
            //@ts-ignore
            inputFileRefLongLogo.current.click();
        }
    };
    const handleButtonClickMiniLogo = () => {
        if(!!inputFileRefMiniLogo.current && typeof(inputFileRefMiniLogo.current) == 'object'){
            //@ts-ignore
            inputFileRefMiniLogo.current.click();
        }
    };

    const handleFileChange = async (event: any) => {
        const file = event.target.files[0];
        const imageType = event.target.name;
        
        if (file) {
            const previewUrl = await readAsDataURL(file);
            setPendingUploads(prev => ({
                ...prev,
                [imageType]: {
                    file: file,
                    previewUrl: previewUrl as string
                }
            }));
        }
    };

    const confirmUpload = async (type: string) => {
        const pendingUpload = pendingUploads[type as keyof typeof pendingUploads];
        
        if (!pendingUpload.file) return;

        try {
            const process = await uploadLogo(type, pendingUpload.file);
            
            if (process.success) {
                toast.success("¡Se cargó la imagen exitosamente!");
                // Limpiar preview temporal
                setPendingUploads(prev => ({
                    ...prev,
                    [type]: { file: null, previewUrl: '' }
                }));
                // Actualizar la URL de la imagen (deberías recargar las URLs del servidor)
                // imageUrls[type as keyof typeof imageUrls] = process.url;
            } else {
                toast.error(process.error);
            }
        } catch (error) {
            toast.error("Error al subir la imagen");
        } finally {
            // Limpiar input file
            if (type === 'logo' && inputFileRefLogo.current) (inputFileRefLogo.current as HTMLInputElement).value = '';
            if (type === 'longLogo' && inputFileRefLongLogo.current) (inputFileRefLongLogo.current as HTMLInputElement).value = '';
            if (type === 'miniLogo' && inputFileRefMiniLogo.current) (inputFileRefMiniLogo.current as HTMLInputElement).value = '';
        }
    };

    const cancelUpload = (type: string) => {
        setPendingUploads(prev => ({
            ...prev,
            [type]: { file: null, previewUrl: '' }
        }));
        
        // Limpiar input file
        if (type === 'logo' && inputFileRefLogo.current) (inputFileRefLogo.current as HTMLInputElement).value = '';
        if (type === 'longLogo' && inputFileRefLongLogo.current) (inputFileRefLongLogo.current as HTMLInputElement).value = '';
        if (type === 'miniLogo' && inputFileRefMiniLogo.current) (inputFileRefMiniLogo.current as HTMLInputElement).value = '';
    };

    function readAsDataURL(file: File): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.result) resolve(reader.result);
                else reject(new Error("No se pudo leer el archivo"));
            };
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    function getImageSrc(type: string) {
        const pending = pendingUploads[type as keyof typeof pendingUploads];
        
        // Mapear los tipos a las propiedades correctas de imageUrls
        const urlMap: { [key: string]: string } = {
            'logo': imageUrls.logo,
            'longLogo': imageUrls.longlogo, // ← usa longlogo (minúscula)
            'miniLogo': imageUrls.miniLogo
        };
        
        const baseUrl = urlMap[type];
        
        if (pending.previewUrl) {
            return pending.previewUrl;
        }
        
        if (baseUrl) {
            return `${baseUrl}?t=${Date.now()}`;
        }
        
        return '';
    }

    function hasPendingUpload(type: string) {
        return !!pendingUploads[type as keyof typeof pendingUploads].file;
    }

    return (
  <div className="min-h-screen bg-[#F5F1E8]">
    <div className="mb-6 p-4">
      <a
        href="/dashboard/sitio-web"
        className="inline-flex items-center text-gray-600 hover:text-custom-accent-primary p-2 hover:bg-[#FAF7F2] rounded-lg transition-all duration-200"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
      </a>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Logos</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CARD */}
        {[
          { title: "Logo Principal", type: "logo" },
          { title: "Logo Largo", type: "longLogo" },
          { title: "Logo Pequeño", type: "miniLogo" },
        ].map(({ title, type }) => (
          <div
            key={type}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-custom-accent-border transition-all duration-300 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>

                {canUpload && !hasPendingUpload(type) && (
                  <Popover>
                    <PopoverTrigger>
                      <MoreVertical
                        size={18}
                        className="text-gray-400 hover:text-custom-accent-primary cursor-pointer transition-colors"
                      />
                    </PopoverTrigger>

                    <PopoverContent className="w-48 bg-white border border-gray-200">
                      <input
                        type="file"
                        name={type}
                        ref={
                          type === "logo"
                            ? inputFileRefLogo
                            : type === "longLogo"
                            ? inputFileRefLongLogo
                            : inputFileRefMiniLogo
                        }
                        onChange={handleFileChange}
                        hidden
                        accept=".jpg,.png,.jpeg,.webp"
                      />

                      <button
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#FAF7F2] hover:text-custom-accent-primary rounded-md flex items-center gap-2 transition-colors"
                        onClick={() => {
                          if (type === "logo") handleButtonClickLogo();
                          if (type === "longLogo") handleButtonClickLongLogo();
                          if (type === "miniLogo") handleButtonClickMiniLogo();
                        }}
                      >
                        <Upload size={16} />
                        Cargar imagen
                      </button>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Preview */}
              <div className="flex items-center justify-center p-4 bg-[#FAF7F2] rounded-xl border-2 border-dashed border-gray-300 min-h-[160px] w-full mb-4">
                <div className="flex justify-center items-center w-full h-32">
                  {getImageSrc(type) ? (
                    <img
                      src={getImageSrc(type)}
                      className="max-h-32 max-w-full object-contain"
                      alt={`${title} preview`}
                    />
                  ) : (
                    <div className="text-center">
                      <Image
                        size={48}
                        className="text-gray-400 mx-auto mb-2"
                      />
                      <p className="text-sm text-gray-500">
                        Sin imagen
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              {hasPendingUpload(type) && (
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => cancelUpload(type)}
                    className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-[#FAF7F2] flex items-center gap-2 transition-all"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={() => confirmUpload(type)}
                    className="px-3 py-2 text-sm bg-custom-accent-primary text-[#1F1A17] rounded-lg hover:bg-custom-accent-secondary flex items-center gap-2 transition-all"
                  >
                    <CloudUpload size={16} />
                    Subir
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

}