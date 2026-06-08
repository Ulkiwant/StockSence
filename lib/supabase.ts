import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== ""
  );
}

// Null-safe Supabase client — returns a stub when not configured
export function createClient() {
  if (!isSupabaseConfigured()) {
    return createStubClient();
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Stub that mimics the Supabase auth API but always returns "no user"
function createStubClient() {
  const stub = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ error: { message: "Supabase not configured" } }),
      signUp: async () => ({ error: { message: "Supabase not configured" } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: (_event: unknown, _cb: unknown) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ data: [], error: null }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
      upsert: () => ({ data: null, error: null }),
      delete: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
  };
  return stub as unknown as ReturnType<typeof createBrowserClient>;
}
