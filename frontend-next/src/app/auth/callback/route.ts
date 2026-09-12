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

  console.error("[oauth] callback hit:", {
    origin: request.url,
    next,
    hasCode: Boolean(code),
  });

  if (code) {
    const supabaseResponse = NextResponse.next({ request });

    let cookieNames: string[] = [];
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value);
                supabaseResponse.cookies.set(name, value, options);
              });
              cookieNames = cookiesToSet.map(({ name }) => name);
            } catch (err) {
              console.error("[oauth] exception inside setAll:", err);
              throw err;
            }
          },
        },
      },
    );

    console.error(
      "[oauth] pre-exchange request cookies:",
      request.cookies.getAll().map((c) => c.name),
    );

    let exchangeError: unknown = null;
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      exchangeError = error;
    } catch (err) {
      exchangeError = err;
      console.error("[oauth] exchangeCodeForSession threw:", err);
    }
    if (exchangeError) {
      console.error("[oauth] exchangeCodeForSession error:", exchangeError);
    } else {
      console.error("[oauth] exchange success, cookies set:", cookieNames);
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
