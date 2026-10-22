import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnUrl = url.searchParams.get("returnUrl") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${url.origin}/auth/error`);
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error("Error exchanging code:", error);
      return NextResponse.redirect(`${url.origin}/auth/error`);
    }

    const user = data.user;

    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    const userNotFound =
      selectError && selectError.code === "PGRST116";

    if (userNotFound) {
      const profile = {
        id: user.id,
        full_name:
          user.user_metadata.full_name ??
          user.user_metadata.name ??
          null,
        email: user.email,
        avatar: user.user_metadata.avatar_url ?? null,
        provider: user.app_metadata.provider,
      };

      const { error: insertError } = await supabase
        .from("users")
        .insert(profile);

      if (insertError) {
        console.error("Error creating user profile:", insertError);
      }
    }

    return NextResponse.redirect(`${url.origin}${returnUrl}`);

  } catch (err) {
    console.error("Callback ERROR:", err);
    return NextResponse.redirect(`${url.origin}/auth/error`);
  }
}
