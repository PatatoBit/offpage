import { supabase } from "./supabase";
import { getBaseUrlAndPath } from "./utils";

export interface CommentData {
  id: number;
  page_id: number;
  created_at: string;
  author: string;
  content: string;
  profiles?: UserProfileData | null;
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

export async function addComment(baseURL: string, content: string) {
  // Step 1: Get the currently authenticated user's ID
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error(
      "Error fetching user or user is not authenticated:",
      authError?.message,
    );
    return;
  }
  const userId = user.id; // This is the unique identifier for the user
  const result = getBaseUrlAndPath(baseURL);
  if (!result) {
    console.error(`Failed to parse base URL and path for: ${baseURL}`);
    return;
  }
  console.log(result);
  const { baseUrl, domain: domainName, route: pagePath } = result;

  // Step 2: Fetch or create the page document
  let { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id")
    .eq("domain", domainName)
    .eq("route", pagePath)
    .single();

  if (pageError && pageError.code === "PGRST116") {
    // If the page doesn't exist, create it
    const { data: newPage, error: createPageError } = await supabase
      .from("pages")
      .insert([{ domain: domainName, route: pagePath }])
      .select()
      .single();

    if (createPageError) {
      console.error(
        `Failed to create page for URL: ${baseUrl}`,
        createPageError.message,
      );
      return;
    }

    page = newPage;
  } else if (pageError) {
    console.error(`Error fetching page for URL: ${baseUrl}`, pageError.message);
    return;
  }

  if (!page) {
    console.error(`Page not found for URL: ${baseUrl}`);
    return;
  }
  const pageId = page.id;

  // Step 3: Insert the new comment with the user's ID as the author
  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .insert([
      {
        content,
        page_id: pageId,
      },
    ])
    .select()
    .single();

  if (commentError) {
    console.error("Error adding comment:", commentError.message);
    return;
  }

  console.log("Comment added successfully:", comment);
  return comment;
}

export async function findPageByRoute(domain: string, route: string) {
  const { data: page, error } = await supabase
    .from("pages")
    .select("id")
    .eq("domain", domain)
    .eq("route", route)
    .single(); // Use single() since there's only one match
  if (error) {
    console.error("Page not found:", error);
    return;
  }

  return page.id;
}

export async function findCommentsDataByPageId(
  id: string,
): Promise<CommentData[] | undefined> {
  const { data: comments, error } = await supabase
    .from("comments")
    .select(
      `
    id, content, created_at, author, page_id,
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

export async function findVotesByPageId(id: string): Promise<number | null> {
  const { data: votes, error } = await supabase
    .from("page_votes")
    .select("vote")
    .eq("page_id", id);

  if (error) {
    console.error("Error fetching votes of page:", id, error);
    return null;
  }

  const totalVotes = votes.reduce((acc, voteDoc) => acc + voteDoc.vote, 0);
  return totalVotes;
}

export async function votePage(
  pageId: string,
  userId: string,
  value: 1 | 0 | -1,
) {
  await supabase.from("page_votes").upsert({
    page_id: pageId,
    user_id: userId,
    vote: value,
  });
}
