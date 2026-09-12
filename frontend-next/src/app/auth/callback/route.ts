import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Gothic Failure #11: auth-reading handlers must never be cached.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * OAuth callback — Supabase-hosted flow code exchange.
 * Supabase redirects here with ?code=...; we exchange it for a session,
 * cookies are set on the response, and the user lands on /dashboard.
 * Failure (invalid/expired code) → /login?error=oauth.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabaseResponse = NextResponse.next({ request });

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
              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // The session cookies live on supabaseResponse — reuse it as the
      // redirect response so they actually reach the browser.
      supabaseResponse.headers.set(
        "Location",
        new URL(next, origin).toString(),
      );
      return new NextResponse(supabaseResponse.body, {
        status: 302,
        headers: supabaseResponse.headers,
      });
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "oauth");
  return NextResponse.redirect(loginUrl);
}
