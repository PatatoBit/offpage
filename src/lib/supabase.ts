import { createClient } from "@supabase/supabase-js";
import { isSignedIn } from "./stores/sessionStore";
import "dotenv/config";
import process from "node:process";

const supabaseUrlKey =
  import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey || !supabaseUrlKey) {
  throw new Error(`Missing Supabase URL or Anon Key`);
}
export const supabase = createClient(supabaseUrlKey, supabaseAnonKey);

export function signOut() {
  chrome.runtime.sendMessage({ type: "logout" }, (response) => {
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
