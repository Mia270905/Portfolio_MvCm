"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  User,
  UserPlus,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  Users,
} from "lucide-react";
import { getAvailableUsersForAttendance } from "@/lib/actions/attendance.actions";
import { toast } from "sonner";

interface UserData {
  id: string;
  email: string;
  full_name?: string | null;
  user_code?: string | null;
  active: boolean;
  profile_id?: string | null;
}

interface SelectUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => Promise<void>;
}

export function SelectUserModal({
  isOpen,
  onClose,
  onSelectUser,
}: SelectUserModalProps) {
  const [allUsers, setAllUsers] = useState<UserData[]>([]); // Todos los usuarios
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]); // Usuarios filtrados
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState(""); // Input de búsqueda
  const [searchQuery, setSearchQuery] = useState(""); // Query con debounce
  const [confirmationStep, setConfirmationStep] = useState(0);

  // Cargar usuarios disponibles
  const loadAvailableUsers = useCallback(async () => {
    if (!isOpen) return;

    try {
      setLoading(true);
      const users = await getAvailableUsersForAttendance();

      // Ordenar por nombre
      const sortedUsers = users.sort((a: UserData, b: UserData) => {
        const nameA = a.full_name || "";
        const nameB = b.full_name || "";
        return nameA.localeCompare(nameB);
      });

      setAllUsers(sortedUsers);
      setFilteredUsers(sortedUsers);

      // Resetear selecciones y búsqueda
      setSelectedUserIds([]);
      setSelectedUsers([]);
      setSearchInput("");
      setSearchQuery("");
      setConfirmationStep(0);
    } catch (error) {
      console.error("Error al cargar usuarios disponibles:", error);
      toast.error("Error al cargar usuarios disponibles");
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen, loadAvailableUsers]);

  // Efecto para búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Aplicar filtros cuando cambie la búsqueda
  useEffect(() => {
    if (allUsers.length === 0) return;

    let filtered = [...allUsers];

    // Filtro de búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          (user.full_name && user.full_name.toLowerCase().includes(query)) ||
          user.email.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [allUsers, searchQuery]);


  // Toggle selección de usuario
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Seleccionar/deseleccionar todos
  const handleSelectAll = () => {
    const allFilteredIds = filteredUsers.map((user) => user.id);
    const allSelected = allFilteredIds.every((id) =>
      selectedUserIds.includes(id)
    );

    if (allSelected) {
      // Deseleccionar todos los filtrados
      setSelectedUserIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id))
      );
    } else {
      // Agregar todos los filtrados no seleccionados
      const newSelections = allFilteredIds.filter(
        (id) => !selectedUserIds.includes(id)
      );
      setSelectedUserIds((prev) => [...prev, ...newSelections]);
    }
  };

  // Proceed to confirmation
  const handleProceedToConfirmation = () => {
    if (selectedUserIds.length === 0) {
      toast.info("No has seleccionado ningún usuario");
      return;
    }
    setConfirmationStep(1);
  };

  // Confirmar y agregar usuarios
  const handleConfirm = async () => {
    if (selectedUserIds.length === 0) return;

    try {
      setSaving(true);

      // Agregar cada usuario seleccionado
      for (const userId of selectedUserIds) {
        await onSelectUser(userId);
      }

      // Éxito - resetear y cerrar
      toast.success(
        `${selectedUserIds.length} usuario(s) agregado(s) al checador`
      );
      handleClose();
    } catch (error) {
      console.error("Error al agregar usuarios:", error);
      // No mostramos toast aquí porque onSelectUser ya lo maneja
    } finally {
      setSaving(false);
    }
  };

  // Cerrar modal
  const handleClose = () => {
    setSelectedUserIds([]);
    setSelectedUsers([]);
    setSearchQuery("");
    setConfirmationStep(0);
    onClose();
  };

  // Verificar si todos los usuarios filtrados están seleccionados
  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((user) => selectedUserIds.includes(user.id));

  // Renderizar paso de confirmación
  if (confirmationStep === 1) {
    return (
      <ConfirmationStep
        selectedUsers={selectedUsers}
        saving={saving}
        onBack={() => setConfirmationStep(0)}
        onConfirm={handleConfirm}
        onCancel={handleClose}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-custom-bg-primary border border-custom-border-secondary">
        {/* Encabezado */}
        <DialogHeader className="border-b border-custom-border-secondary pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-custom-accent-primary/20">
                <Users className="w-5 h-5 text-custom-accent-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-custom-text-primary">
                  Agregar Usuarios al Checador
                </DialogTitle>
                <p className="text-sm text-custom-text-tertiary mt-1">
                  Selecciona los usuarios que quieres agregar al sistema de
                  asistencia
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Contenido principal */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Búsqueda y controles */}
          <div className="p-4 border-b border-custom-border-secondary space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-custom-text-tertiary" />
              </div>
              <Input
                type="text"
                placeholder="Buscar usuarios por nombre ó correo..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 bg-custom-bg-secondary border-custom-border-secondary text-custom-text-primary"
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span
                  className={
                    selectedUserIds.length > 0
                      ? "text-custom-accent-primary"
                      : "text-custom-text-tertiary"
                  }
                >
                  {selectedUserIds.length} usuario(s) seleccionado(s)
                </span>
                <span className="text-custom-text-tertiary ml-2">
                  de {filteredUsers.length} mostrados
                </span>
              </div>
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                className="border-custom-border-secondary text-custom-text-tertiary hover:text-custom-text-primary hover:bg-custom-bg-hover"
                disabled={filteredUsers.length === 0}
              >
                {allFilteredSelected
                  ? "Deseleccionar todos"
                  : "Seleccionar todos"}
              </Button>
            </div>
          </div>

          {/* Lista de usuarios */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="space-y-3 p-4">
                {[...Array(5)].map((_, idx) => (
                  <div
                    key={idx}
                    className="h-16 bg-custom-bg-hover rounded animate-pulse"
                  />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-custom-bg-tertiary mb-3">
                  <AlertCircle className="w-6 h-6 text-custom-text-tertiary" />
                </div>
                <h4 className="text-lg font-medium text-custom-text-primary mb-2">
                  {searchQuery
                    ? "No se encontraron resultados"
                    : "No hay usuarios disponibles"}
                </h4>
                <p className="text-custom-text-tertiary max-w-md mx-auto">
                  {searchQuery
                    ? `No hay usuarios que coincidan con "${searchQuery}"`
                    : "Todos los usuarios ya tienen acceso al checador."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-custom-accent-primary/10 border-custom-accent-primary/50"
                          : "bg-custom-bg-secondary border-custom-border-secondary hover:border-custom-accent-border hover:bg-custom-bg-hover"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Checkbox */}
                          <div
                            className={`w-5 h-5 flex items-center justify-center rounded border flex-shrink-0 ${
                              isSelected
                                ? "bg-custom-accent-primary border-custom-accent-primary"
                                : "bg-custom-bg-tertiary border-custom-border-primary"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>

                          {/* Avatar/Icono */}
                          <div
                            className={`p-2 rounded-full flex-shrink-0 ${
                              isSelected
                                ? "bg-custom-accent-primary text-gray-900"
                                : "bg-custom-bg-tertiary text-custom-text-tertiary"
                            }`}
                          >
                            <User className="w-4 h-4" />
                          </div>

                          {/* Información del usuario */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4
                                className={`font-medium truncate ${
                                  isSelected
                                    ? "text-custom-accent-primary"
                                    : "text-custom-text-primary"
                                }`}
                              >
                                {user.full_name || "Usuario sin nombre"}
                              </h4>
                              {/* {user.user_code && (
                                <span
                                  className={`text-xs px-2 py-1 rounded truncate ${
                                    isSelected
                                      ? "bg-custom-accent-primary/20 text-custom-accent-primary"
                                      : "bg-custom-bg-tertiary text-custom-text-tertiary"
                                  }`}
                                >
                                  {user.user_code}
                                </span>
                              )} */}
                            </div>
                            <p className="text-sm text-custom-text-tertiary truncate">
                              {user.email}
                            </p>
                            {user.profile_id && (
                              <div className="text-xs text-custom-text-secondary mt-1">
                                Perfil: {user.profile_id}
                              </div>
                            )}
                          </div>

                          {/* Indicador de selección */}
                          {isSelected && (
                            <div className="ml-2 flex-shrink-0">
                              <div className="w-5 h-5 rounded-full bg-custom-accent-primary flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-gray-900" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-custom-border-secondary">
          <div className="flex items-center justify-between">
            {/* Estado de selección */}
            <div className="flex-1 min-w-0">
              {selectedUserIds.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-custom-accent-primary animate-pulse" />
                  <span className="text-custom-accent-primary font-medium text-sm truncate">
                    {selectedUserIds.length} seleccionado(s)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-custom-text-tertiary" />
                  <span className="text-custom-text-tertiary text-sm truncate">
                    Selecciona usuarios
                  </span>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-custom-border-secondary text-custom-text-tertiary hover:text-custom-text-primary"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleProceedToConfirmation}
                className={`${
                  selectedUserIds.length === 0
                    ? "bg-custom-bg-tertiary cursor-not-allowed"
                    : "bg-custom-accent-primary hover:bg-custom-accent-secondary"
                } text-gray-900`}
                disabled={saving || selectedUserIds.length === 0}
              >
                {selectedUserIds.length > 0 ? (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Continuar ({selectedUserIds.length})
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Continuar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente para el paso de confirmación
interface ConfirmationStepProps {
  selectedUsers: UserData[];
  saving: boolean;
  onBack: () => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

function ConfirmationStep({
  selectedUsers,
  saving,
  onBack,
  onConfirm,
  onCancel,
}: ConfirmationStepProps) {
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-custom-bg-primary border border-custom-border-secondary">
        {/* Encabezado */}
        <DialogHeader className="border-b border-custom-border-secondary pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-custom-accent-primary/20">
                <AlertTriangle className="w-5 h-5 text-custom-accent-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-custom-text-primary">
                  Confirmar Agregar Usuarios
                </DialogTitle>
                <p className="text-sm text-custom-text-tertiary mt-1">
                  Estás a punto de agregar {selectedUsers.length} usuario(s) al
                  checador
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="rounded-full hover:bg-custom-bg-hover"
              disabled={saving}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mensaje de confirmación */}
          <div className="bg-custom-accent-primary/10 border border-custom-accent-primary/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-custom-accent-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-custom-accent-primary mb-2">
                  Confirmar acción
                </h4>
                <p className="text-sm text-custom-text-tertiary">
                  Los usuarios seleccionados podrán usar el sistema de
                  asistencia/checador.
                </p>
              </div>
            </div>
          </div>

          {/* Lista de usuarios seleccionados */}
          <div>
            <h4 className="font-medium text-custom-text-primary mb-3">
              Usuarios seleccionados:
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-custom-bg-secondary border border-custom-border-secondary rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-custom-bg-tertiary">
                        <User className="w-4 h-4 text-custom-text-tertiary" />
                      </div>
                      <div>
                        <div className="font-medium text-custom-text-primary">
                          {user.full_name || "Usuario sin nombre"}
                        </div>
                        <div className="text-sm text-custom-text-tertiary">
                          {user.email}
                        </div>
                        {/* {user.user_code && (
                          <div className="text-xs text-custom-text-secondary mt-1">
                            Código: {user.user_code}
                          </div>
                        )} */}
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-custom-accent-primary" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Información importante */}
          <div className="bg-custom-bg-secondary border border-custom-border-secondary rounded-lg p-4">
            <h4 className="font-medium text-custom-text-primary mb-2">
              ⚠️ Información importante
            </h4>
            <ul className="space-y-2 text-sm text-custom-text-tertiary">
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-custom-text-tertiary rounded-full mt-1.5 flex-shrink-0" />
                <span>
                  Los usuarios podrán marcar entrada/salida en el sistema
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-custom-text-tertiary rounded-full mt-1.5 flex-shrink-0" />
                <span>
                  Podrás remover usuarios del checador posteriormente si es
                  necesario
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 bg-custom-text-tertiary rounded-full mt-1.5 flex-shrink-0" />
                <span>Asegúrate de que sean los usuarios correctos</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-custom-border-secondary flex justify-between items-center">
          <div className="text-sm text-custom-text-tertiary">
            {selectedUsers.length} usuario(s) seleccionado(s)
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-custom-border-secondary text-custom-text-tertiary hover:text-custom-text-primary hover:bg-custom-bg-hover"
              disabled={saving}
            >
              Regresar
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-custom-accent-primary hover:bg-custom-accent-secondary text-gray-900"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Confirmar y agregar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
