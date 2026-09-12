import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/actions/auth";
import styles from "./layout.module.scss";

// Sessions are refreshed in src/proxy.ts; auth reads must never be cached.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <span className={styles.brand}>FlowBank</span>
        <form action={signOutAction}>
          <button type="submit" className={styles.signOut}>
            Cerrar sesion
          </button>
        </form>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
