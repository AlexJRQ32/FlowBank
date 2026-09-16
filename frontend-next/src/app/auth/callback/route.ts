import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Gothic Failure #11: auth-reading handlers must never be cached.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * OAuth callback — Supabase-hosted flow code exchange.
 * Supabase redirects here with ?code=...; we exchange it for a session,
 * cookies are set on the redirect response, and the user lands on the
 * `next` path (default /dashboard). Failure (invalid/expired code) →
 * /login?error=oauth.
 *
 * Note: NextResponse.next() is not allowed in Route Handlers (Next 16),
 * so the redirect response is built FIRST and session cookies are
 * attached to it directly.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  console.info("[oauth] callback hit:", { next, hasCode: Boolean(code) });

  if (code) {
    const response = NextResponse.redirect(new URL(next, origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      // Backfill the profile with Google OAuth metadata (full_name, name,
      // avatar_url) so the trigger-created row isn't stuck as "Nombre → —".
      // Only fills empty fields; explicit profile edits are never overwritten.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const meta = user.user_metadata ?? {};
        const fullName = String(meta.full_name ?? meta.name ?? "");
        const nombre = String(meta.nombre ?? fullName.split(" ")[0] ?? "").trim();
        const apellido = String(meta.apellido ?? fullName.split(" ").slice(1).join(" ")).trim();
        const avatarUrl = (meta.avatar_url ?? meta.picture) as string | null;

        const { data: profile } = await supabase
          .from("profiles")
          .select("nombre, avatar_url")
          .eq("id", user.id)
          .single();

        if (profile) {
          const patch: Record<string, string> = {};
          if (!profile.nombre && nombre) {
            patch.nombre = nombre;
            patch.apellido = apellido;
          }
          if (!profile.avatar_url && avatarUrl) {
            patch.avatar_url = avatarUrl;
          }
          if (Object.keys(patch).length > 0) {
            await supabase.from("profiles").update(patch).eq("id", user.id);
          }
        }
      }

      console.info("[oauth] exchange success, redirecting");
      return response;
    } catch (err) {
      console.error("[oauth] exchangeCodeForSession error:", err);
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "oauth");
  return NextResponse.redirect(loginUrl);
}
