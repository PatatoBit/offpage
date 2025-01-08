import { createClient } from "@supabase/supabase-js";
import { isSignedIn } from "./stores/sessionStore";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log(supabaseUrl, supabaseAnonKey);

  throw new Error("Missing Supabase URL or Anon Key");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signOut() {
  await supabase.auth.signOut();
  isSignedIn.set(false);

  console.log("Signed out");
}
