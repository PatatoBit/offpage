import { createClient } from "@supabase/supabase-js";
import { isSignedIn } from "./stores/sessionStore";

export const supabaseUrl = "https://blbixtcshtlrvmgkgpco.supabase.co";
export const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsYml4dGNzaHRscnZtZ2tncGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MTg1MDAsImV4cCI6MjA1MTI5NDUwMH0.R--eWEssN7Loz3WIEk8zthDLEcZGHTlnysQ2HX0ZadI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signOut() {
  await supabase.auth.signOut();
  isSignedIn.set(false);

  console.log("Signed out");
}
