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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(false);
    router.push(`/dashboard/empresas-padre/empresas/editar/${company.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(false);
    onDelete?.(company);
  };

  const formatAddress = () => {
    const parts = [];
    if (company.street) parts.push(company.street);
    if (company.address_number) parts.push(company.address_number);
    if (company.colony) parts.push(company.colony);

    const address = parts.join(", ");
    const location = [company.city, company.state, company.zip_code]
      .filter(Boolean)
      .join(", ");

    return { address, location };
  };

  const { address, location } = formatAddress();

  const childCompanies = company.child_companies || [];
  const isParentCompany = childCompanies.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl hover:border-amber-400 hover:shadow-md transition-all cursor-pointer">
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
              {company.name}
            </h3>

            <div className="flex flex-wrap gap-2">
              {company.rfc && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  RFC: {company.rfc}
                </span>
              )}

              {isParentCompany ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                  Empresa Padre
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border">
                  Empresa Individual
                </span>
              )}
            </div>
          </div>

          {(canUpdate || canDelete) && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical size={18} className="text-gray-600" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-40 p-2 bg-white border border-gray-200 rounded-lg shadow-md"
              >
                {canUpdate && (
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-amber-50 text-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDeleteClick}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Sucursales */}
        {isParentCompany && (
          <div className="mb-4 text-sm">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
              <Users className="w-4 h-4" />
              Sucursales ({childCompanies.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {childCompanies.slice(0, 3).map((child) => (
                <span
                  key={child.id}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border"
                >
                  {child.name}
                </span>
              ))}
              {childCompanies.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{childCompanies.length - 3} más
                </span>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="space-y-3 text-sm text-gray-700">
          {(address || location) && (
            <div className="flex gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                {address && <div>{address}</div>}
                {location && (
                  <div className="text-xs text-gray-500">{location}</div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {company.phone}
              </div>
            )}
            {company.cellphone && (
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gray-400" />
                {company.cellphone}
              </div>
            )}
          </div>

          {company.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" />
              <a
                href={
                  company.website.startsWith("http")
                    ? company.website
                    : `https://${company.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:underline"
              >
                {company.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Creado:{" "}
            {new Date(company.created_at).toLocaleDateString("es-MX")}
          </div>
        </div>

      {(canUpdate || canDelete) && (
          <div className="mt-4 flex gap-2">
            {canUpdate && (
              <Button
                size="sm"
                variant="default"
                onClick={handleEdit}
                className="
                  flex-1
                  bg-[#c6a365] text-white
                  hover:bg-[#b59555]
                  transition-colors duration-200
                "
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
            )}

            {canDelete && (
              <Button
                size="sm"
                variant="default"
                onClick={handleDeleteClick}
                className="
                  flex-1
                  bg-red-700 text-white
                  hover:bg-red-800
                  transition-colors duration-200
                "
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
