import { createClient } from "@supabase/supabase-js";
import { isSignedIn } from "./stores/sessionStore";
import { supabaseAnonKey, supabaseUrl } from "./utils";

if (!supabaseUrl || !supabaseAnonKey) {
  console.log(supabaseUrl, supabaseAnonKey);

  throw new Error("Missing Supabase URL or Anon Key");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signOut() {
  chrome.runtime.sendMessage({ action: "logout" }, (response) => {
    if (response.success) {
      console.log("Logged out successfully");
      isSignedIn.set(false);
    }
  });

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

export async function updateUserProfile(
  userId: string,
  username?: string,
  avatar_url?: string,
) {
  console.log("Updating user profile for user ID:", userId);

  const { data, error } = await supabase.from("profiles").upsert({
    id: userId,
    username,
    avatar_url,
  });

  if (error) {
    console.error("Error updating user profile:", error);
    return null;
  }

  return data;
}
