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

interface UserProfileData {
  username: string;
  avatar_url: string;
}

export async function fetchUserProfile(
  userId: string,
): Promise<UserProfileData | null> {
  console.log("Fetching user profile for user ID:", userId);

  const { data, error } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", userId)
    .maybeSingle(); // Use maybeSingle() instead of single()

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  if (!data) {
    console.log("No profile found for this user.");
    return null; // Handle the case where no profile is found
  }

  return data;
}
