// Project-specific replacement for the generated `attachSupabaseAuth`.
// Attaches the Supabase bearer token to every server-fn RPC and short-circuits
// the call (with a clean error) when there is no active session, so we don't
// blow up the app with a server-side "Unauthorized" runtime error.
import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export class NotSignedInError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "NotSignedInError";
  }
}

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    // Only attach on the client; on the server during SSR there is no session.
    if (typeof window === "undefined") {
      return next({ headers: {} });
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      // Avoid triggering the server-side "Unauthorized" throw which surfaces
      // as a runtime error overlay. Let React Query treat this as a normal
      // failure that the UI can recover from on next sign-in.
      throw new NotSignedInError();
    }
    return next({ headers: { Authorization: `Bearer ${token}` } });
  },
);
