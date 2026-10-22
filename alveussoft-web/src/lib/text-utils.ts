import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function removeAccentsAndSpecialChars(text: string): string {
  if (!text) return "";

  // Convertir a minúsculas
  let result = text.toLowerCase();

  // Eliminar acentos
  result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Eliminar caracteres especiales, solo mantener letras, números y espacios
  result = result.replace(/[^a-z0-9\s]/g, "");

  // Eliminar espacios múltiples
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

export function generateNameUnaccent(name: string): string {
  return removeAccentsAndSpecialChars(name)
}


// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
