"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <Button
      onClick={logout}
      size="default"
      variant="outline"
      className="border-[#0F172A] text-[#0F172A] hover:bg-gray-200 w-full md:w-auto transition duration-300 ease-in-out"
    >
      Cerrar sesión
    </Button>
  );
}
