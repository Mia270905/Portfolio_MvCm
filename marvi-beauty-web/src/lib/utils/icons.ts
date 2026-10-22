import * as LucideIcons from 'lucide-react';

export function getIcon(iconName: string | null) {
  if (!iconName) return LucideIcons.FileText
  const Icon = (LucideIcons as any)[iconName]
  return Icon || LucideIcons.FileText
}