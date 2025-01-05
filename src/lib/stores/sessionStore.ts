import { writable } from "svelte/store";
import { supabase } from "../supabase";

export const isSignedIn = writable(false);

export async function initializeSession() {
  const { session } = await chrome.storage.local.get("session");
  if (session) {
    const { error: supaAuthError } = await supabase.auth.setSession(session);
    if (supaAuthError) {
      throw supaAuthError;
    }

    isSignedIn.set(true); // Update the store
  }
}
