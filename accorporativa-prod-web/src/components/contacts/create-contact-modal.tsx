"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContactForm } from "./create-contact-form";
import { UserPlus, X } from "lucide-react";
import type { Contact } from "@/lib/actions/contact.actions";

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (contact: Contact) => void;
}

export function CreateContactModal({ isOpen, onClose, onCreated }: CreateContactModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col bg-[#0A0F17] border border-gray-700">
        <DialogHeader className="border-b border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-400/20">
                <UserPlus className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-200">Crear Cliente</DialogTitle>
                <p className="text-sm text-gray-400 mt-1">Crea un nuevo cliente rápidamente</p>
              </div>
            </div>
            <div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-200 p-1">
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4">
          {/* <ContactForm
            onCreated={(contact) => {
              if (onCreated) onCreated(contact);
              onClose();
            }}
            onCancel={onClose}
          /> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
