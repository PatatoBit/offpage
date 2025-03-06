import { writable } from "svelte/store";
import { supabase } from "../supabase";

export const isSignedIn = writable(false);
export const userId = writable(null);

export async function initializeSession() {
  const { session } = await chrome.storage.local.get("session");
  if (session) {
    const { error: supaAuthError } = await supabase.auth.setSession(session);
    if (supaAuthError) {
      throw supaAuthError;
    }

    isSignedIn.set(true); // Update the store
    userId.set(session.user.id); // Update the store
  }
  console.log("User ID:", userId); // You can now use the userId as needed
}
