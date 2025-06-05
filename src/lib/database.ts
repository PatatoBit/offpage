import { ModerationStatus } from "../stores/AppStatus";
import { supabase } from "./supabase";
import { getBaseUrlAndPath } from "./utils";

export interface CommentData {
  id: number;
  page_id: number;
  created_at: string;
  author: string;
  content: string;
  profiles?: UserProfileData | null;

  moderation_status: "pending" | "pass" | "flagged";
  moderation_scores?: ModerationStatus | null;
  moderated_at: Date | null;

  image_url: string | null;
}

export interface PageVoteData {
  id: number;
  vote: number;
  user_id: string;
  page_id: number;
  created_at: string;
}

export interface UserProfileData {
  username: string;
  avatar_url: string;
}

export async function findPageByRoute(domain: string, route: string) {
  // Always encode route before querying
  let { data: page, error } = await supabase
    .from("pages")
    .select("*")
    .eq("domain", domain)
    .eq("route", route)
    .single();

  if (error && error.code === "PGRST116") {
    // If the page doesn't exist, create it
    console.log(
      "Page not found, creating new page:",
      domain,
      "Route:",
      route,
      "Encoded Route:",
      route,
    );

    const { data: newPage, error: createPageError } = await supabase
      .from("pages")
      .insert([{ domain, route: route }]) // <-- encode here too
      .select()
      .single();

    if (createPageError) {
      console.error("Failed to create page:", createPageError.message);
      return null;
    }
    page = newPage;
  } else if (error) {
    console.error("Error fetching page:", error.message);
    return null;
  }

  if (!page) return null;

  console.log(
    "Found page:",
    page.id,
    "for domain:",
    domain,
    "and route:",
    route,
  );
  return page.id;
}

export async function addComment(
  domain: string,
  route: string, // Optional, if you want to pass route
  content: string,
  image_url: string | null,
) {
  const { data, error } = await supabase.functions.invoke("submit-comment", {
    body: {
      domain,
      route,
      content,
      imageData: image_url,
    },
  });
}

export async function findCommentsDataByPageId(
  id: string,
): Promise<CommentData[] | undefined> {
  const { data: comments, error } = await supabase
    .from("comments")
    .select(
      `
    id, content, created_at, author, page_id, image_url,
    moderation_status, moderated_at, moderation_scores,
    profiles!comments_author_fkey (username, avatar_url)
  `,
    )
    .eq("page_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching comments:", error);
  }

  if (!comments) {
    return;
  }

  return comments.map((comment) => ({
    id: comment.id as number,
    page_id: comment.page_id as number,
    created_at: comment.created_at as string,
    author: comment.author as string,
    content: comment.content as string,
    profiles:
      comment.profiles && !Array.isArray(comment.profiles)
        ? {
            username: (
              comment.profiles as { username: string; avatar_url: string }
            ).username,
            avatar_url: (
              comment.profiles as { username: string; avatar_url: string }
            ).avatar_url,
          }
        : undefined,
    moderation_status: comment.moderation_status as
      | "pending"
      | "pass"
      | "flagged",
    moderation_scores: comment.moderation_scores as ModerationStatus | null,
    moderated_at: comment.moderated_at as Date | null,
    image_url: comment.image_url as string | null,
  }));
}

export async function uploadProfilePicture(
  file: File,
  userId: string,
): Promise<string> {
  // Delete old file if it exists (jpg or png)
  const { data: existingFiles, error: listError } = await supabase.storage
    .from("profile-pictures")
    .list("", { search: userId });

  if (existingFiles?.length) {
    const oldFilePaths = existingFiles.map((f) => f.name);
    await supabase.storage.from("profile-pictures").remove(oldFilePaths);
  }

  const fileName: string = `${userId}-${Date.now()}-${file.name}`; // Unique file name
  const { data, error } = await supabase.storage
    .from("profile-pictures") // Replace with your Supabase bucket
    .upload(fileName, file);

  if (error) {
    console.error("Upload error:", error.message);
    alert("Upload failed!");
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("profile-pictures")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

export async function uploadCommentImage(
  file: File,
  pageId: string,
  userId: string,
): Promise<string | null> {
  const uniqueFileName = `${Date.now()}-${file.name}`;
  const path = `comments-images/${pageId}/${userId}${uniqueFileName}`;

  const { data, error } = await supabase.storage
    .from("comments-images")
    .upload(path, file);

  if (error) {
    console.error("Error uploading comment image:", error.message);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from("comments-images")
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
}

export async function getLikeDislikeCount(
  id: string,
): Promise<{ likes: number; dislikes: number } | null> {
  const { data, error } = await supabase
    .from("page_votes")
    .select("vote")
    .eq("page_id", id);

  if (error) {
    console.error("Error fetching votes of page:", id, error);
    return null;
  }

  const likes = data.filter((v) => v.vote === 1).length;
  const dislikes = data.filter((v) => v.vote === -1).length;

  return { likes, dislikes };
}

export async function getUserVote(pageId: string, userId: string) {
  const { data, error } = await supabase
    .from("page_votes")
    .select("vote")
    .eq("page_id", pageId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user vote:", error.message);
    return null;
  }

  return data?.vote ?? null; // Return null if no vote found
}

export async function votePage(
  pageId: string | null,
  userId: string,
  value: 1 | 0 | -1,
  domain: string,
  route: string,
): Promise<string | null> {
  console.log("Voting for page:", pageId, userId, value);

  // Step 0: Ensure the page exists
  let { data: page, error: pageFetchError } = await supabase
    .from("pages")
    .select("id")
    .eq("domain", domain)
    .eq("route", route)
    .single();

  if (pageFetchError && pageFetchError.code === "PGRST116") {
    const { data: newPage, error: createPageError } = await supabase
      .from("pages")
      .insert([{ domain, route: route }])
      .select()
      .single();

    if (createPageError) {
      console.error("Failed to create page:", createPageError.message);
      return null;
    }
    page = newPage;
  } else if (pageFetchError) {
    console.error("Error fetching page:", pageFetchError.message);
    return null;
  }

  if (!page) return null;

  const ensuredPageId = page.id;

  // Step 1: Check if user already voted
  const { data, error: fetchError } = await supabase
    .from("page_votes")
    .select("vote")
    .eq("page_id", ensuredPageId)
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching vote:", fetchError.message);
    return null;
  }

  // Step 2: Remove vote if same
  if (data && data.vote === value) {
    const { error: deleteError } = await supabase
      .from("page_votes")
      .delete()
      .eq("page_id", ensuredPageId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting vote:", deleteError.message);
    }
    return ensuredPageId;
  }

  // Step 3: Upsert
  const { error: upsertError } = await supabase.from("page_votes").upsert(
    {
      page_id: ensuredPageId,
      user_id: userId,
      vote: value,
    },
    {
      onConflict: "page_id, user_id",
    },
  );

  if (upsertError) {
    console.error("Error voting for page:", upsertError.message);
  }

  return ensuredPageId;
}
