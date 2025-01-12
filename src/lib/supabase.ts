import { createClient } from "@supabase/supabase-js";
import { isSignedIn } from "./stores/sessionStore";
import { supabaseAnonKey, supabaseUrl } from "./utils";

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
