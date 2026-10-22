"use client";

import { useState } from "react";
import type { Company } from "@/lib/actions/company.actions";
import {
  MapPin,
  Phone,
  Globe,
  MoreVertical,
  Calendar,
  Edit,
  Trash2,
  Smartphone,
  Users,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CompanyCardProps {
  company: Company;
  onEdit?: (company: Company) => void;
  onDelete?: (company: Company) => void;
  userPermissions?: string[];
}

export default function CompanyCard({
  company,
  onEdit,
  onDelete,
  userPermissions = [],
}: CompanyCardProps) {
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const canUpdate = userPermissions.includes("update:empresas");
  const canDelete = userPermissions.includes("delete:empresas");

  const handleCardClick = () => {};

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(false);
    router.push(`/dashboard/empresas-padre/empresas/editar/${company.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(false);
    if (onDelete) onDelete(company);
  };

  const handlePopoverTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const formatAddress = () => {
    const parts = [];
    if (company.street) parts.push(company.street);
    if (company.address_number) parts.push(company.address_number);
    if (company.colony) parts.push(company.colony);

    const address = parts.join(", ");
    const locationParts = [];
    if (company.city) locationParts.push(company.city);
    if (company.state) locationParts.push(company.state);
    if (company.zip_code) locationParts.push(company.zip_code);

    const location = locationParts.join(", ");

    return { address, location };
  };

  const { address, location } = formatAddress();

  const childCompanies = company.child_companies || [];
  const isParentCompany = childCompanies.length > 0;

  return (
    <div
      className="bg-custom-bg-secondary border border-custom-border-secondary rounded-lg hover:shadow-lg hover:shadow-custom-accent-primary/5 hover:border-custom-accent-primary/30 transition-all cursor-pointer overflow-hidden relative"
      onClick={handleCardClick}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-custom-text-primary line-clamp-2 mb-3">
              {company.name}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {company.rfc && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  RFC: {company.rfc}
                </span>
              )}

              {isParentCompany ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-custom-accent-primary/20 text-custom-accent-primary border border-custom-accent-primary/30">
                  Empresa Padre
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-custom-bg-hover text-custom-text-muted border border-custom-border-primary">
                  Empresa Individual
                </span>
              )}
            </div>

            {/* Empresas hijas */}
            {isParentCompany && (
              <div className="flex items-start gap-1 mb-3 text-sm text-custom-text-secondary">
                <Users className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-custom-accent-primary">
                    Sucursales ({childCompanies.length}):
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {childCompanies.slice(0, 3).map((child) => (
                      <span
                        key={child.id}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-custom-bg-hover text-custom-text-secondary border border-custom-border-primary"
                      >
                        {child.name}
                        {child.rfc && (
                          <span className="ml-1 text-custom-text-muted">
                            ({child.rfc})
                          </span>
                        )}
                      </span>
                    ))}
                    {childCompanies.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-custom-bg-hover text-custom-text-muted border border-custom-border-primary">
                        +{childCompanies.length - 3} más...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions Popover */}
          {(canUpdate || canDelete) && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-2 hover:bg-custom-accent-primary/10 rounded-lg transition-colors border border-custom-border-primary flex-shrink-0 ml-2"
                  onClick={handlePopoverTriggerClick}
                >
                  <MoreVertical size={18} className="text-custom-text-secondary" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-40 p-3 bg-custom-bg-secondary border border-custom-border-secondary rounded-lg shadow-lg"
                align="end"
              >
                <div className="space-y-1">
                  {canUpdate && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-custom-text-secondary hover:bg-custom-accent-primary/10 hover:text-custom-accent-primary rounded-md transition-colors"
                      onClick={handleEdit}
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                  )}

                  {canDelete && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-md transition-colors"
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Información de la empresa */}
        <div className="space-y-3">
          {/* Dirección */}
          {(address || location) && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-custom-text-muted flex-shrink-0 mt-0.5" />
              <div className="text-custom-text-secondary">
                {address && <div className="line-clamp-1">{address}</div>}
                {location && (
                  <div className="text-xs text-custom-text-muted line-clamp-1">
                    {location}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Teléfonos */}
          <div className="flex flex-wrap gap-4">
            {company.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-custom-text-muted flex-shrink-0" />
                <span className="text-custom-text-secondary">{company.phone}</span>
              </div>
            )}

            {company.cellphone && (
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="w-4 h-4 text-custom-text-muted flex-shrink-0" />
                <span className="text-custom-text-secondary">{company.cellphone}</span>
              </div>
            )}
          </div>

          {/* Website */}
          {company.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <a
                href={
                  company.website.startsWith("http")
                    ? company.website
                    : `https://${company.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {company.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>

        {/* Footer con fechas */}
        <div className="mt-4 pt-3 border-t border-custom-border-secondary">
          <div className="flex items-center gap-2 text-xs text-custom-text-muted">
            <Calendar className="w-3 h-3" />
            <span>
              Creado:{" "}
              {new Date(company.created_at).toLocaleDateString("es-MX")}
            </span>
          </div>
          {company.updated_at !== company.created_at && (
            <div className="flex items-center gap-2 text-xs text-custom-text-muted mt-1">
              <Calendar className="w-3 h-3" />
              <span>
                Actualizado:{" "}
                {new Date(company.updated_at).toLocaleDateString("es-MX")}
              </span>
            </div>
          )}
        </div>

        {/* Botones de acción visibles */}
        {(canUpdate || canDelete) && (
          <div className="mt-4 pt-3 border-t border-custom-border-secondary flex gap-2">
            {canUpdate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex-1 bg-transparent border-custom-accent-primary/30 text-custom-accent-primary hover:bg-custom-accent-primary/10 hover:text-custom-accent-secondary"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                className="flex-1 bg-transparent border-red-400/30 text-red-400 hover:bg-red-400/10 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}