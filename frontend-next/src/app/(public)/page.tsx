import { createClient } from "@/lib/supabase/server";
import LandingView from "./_components/landing-view";

// Reads the auth cookie to greet signed-in users and must never be cached.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  let isAuthed = false;
  let nombre: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isAuthed = true;
      const { data: profile } = await supabase
        .from("profiles")
        .select("nombre")
        .eq("id", user.id)
        .single();
      nombre = profile?.nombre ?? undefined;
    }
  } catch {
    // If the session cannot be read, render the public landing variant.
  }

  return <LandingView isAuthed={isAuthed} nombre={nombre} />;
}
