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

// export async function fetchUserProfile(userId: string) {
//   console.log("====================================");
//   console.log("fetchUserProfile", userId);
//   console.log("====================================");

//   const { data, error } = await supabase
//     .from("profiles")
//     .select("username, avatar_url")
//     .eq("id", "84450ce1-b39c-4503-be92-009a5e6841b2")
//     .single(); // .single() ensures we get only one profile

//   if (error) {
//     console.error("Error fetching user profile:", error);
//     return null;
//   }

//   console.table(data);
//   return data;
// }

interface UserProfileData {
  username: string;
  avatar_url: string;
}

// export async function fetchUserProfile(
//   userId: string,
// ): Promise<UserProfileData | null> {
//   console.log("====================================");
//   console.log("fetchUserProfile", userId);
//   console.log("====================================");

//   const { data, error } = await supabase
//     .from("profiles")
//     .select("username, avatar_url")
//     .eq("id", userId);

//   if (error) {
//     console.error("Error fetching user profile:", error);
//     return null;
//   }

//   return data;
// }

export async function fetchUserProfile(
  userId: string,
): Promise<UserProfileData | null> {
  console.log("====================================");
  console.log("fetchUserProfile", userId);
  console.log("====================================");

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
