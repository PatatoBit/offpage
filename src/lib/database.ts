import { supabase } from "./supabase";

export interface Comment {
  content: string;
  createdAt: Date;
  author: string;
}

export async function addComment(baseUrl: string, content: string) {
  // Step 1: Get the currently authenticated user's ID
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error(
      "Error fetching user or user is not authenticated:",
      authError?.message
    );
    return;
  }
  const userId = user.id; // This is the unique identifier for the user

  // Step 2: Fetch or create the page document
  let { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id")
    .eq("route", baseUrl)
    .single();

  if (pageError && pageError.code === "PGRST116") {
    // If the page doesn't exist, create it
    const { data: newPage, error: createPageError } = await supabase
      .from("pages")
      .insert([{ route: baseUrl }])
      .select()
      .single();

    if (createPageError) {
      console.error(
        `Failed to create page for URL: ${baseUrl}`,
        createPageError.message
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
        timestamp: new Date().toISOString(),
        page_id: pageId,
        author: userId, // Store the authenticated user's ID as the author
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

export function listenToComments(
  baseUrl: string,
  callback: (comments: Comment[]) => void
) {
  // Step 1: Try to fetch the page by its baseUrl
  supabase
    .from("pages")
    .select("id")
    .eq("route", baseUrl)
    .single()
    .then(async ({ data: page, error }) => {
      if (error && error.code === "PGRST116") {
        // If no page exists, return an empty array
        console.log(
          `No page found for URL: ${baseUrl}. Returning an empty array.`
        );
        callback([]);
        return;
      } else if (error) {
        console.error(`Error fetching page for URL: ${baseUrl}`, error.message);
        return;
      }

      const pageId = page.id;

      // Step 2: Fetch initial comments and pass them to the callback
      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("content, timestamp, author")
        .eq("page_id", pageId);

      if (commentsError) {
        console.error("Error fetching comments:", commentsError.message);
        return;
      }

      callback(
        (comments || []).map((comment) => ({
          content: comment.content,
          createdAt: new Date(comment.timestamp),
          author: comment.author,
        }))
      ); // Pass an empty array if no comments are found

      // Step 3: Set up a real-time subscription for future updates
      const subscription = supabase
        .channel("comments")
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to INSERT, UPDATE, and DELETE events
            schema: "public",
            table: "comments",
            filter: `page_id=eq.${pageId}`,
          },
          (payload) => {
            console.log("Change detected:", payload);

            // Fetch updated comments and pass them to the callback
            supabase
              .from("comments")
              .select("content, timestamp, author")
              .eq("page_id", pageId)
              .then(
                ({ data: updatedComments, error: updatedCommentsError }) => {
                  if (updatedCommentsError) {
                    console.error(
                      "Error fetching updated comments:",
                      updatedCommentsError.message
                    );
                    return;
                  }
                  callback(
                    (updatedComments || []).map((comment) => ({
                      content: comment.content,
                      createdAt: new Date(comment.timestamp),
                      author: comment.author,
                    }))
                  );
                }
              );
          }
        )
        .subscribe();

      // Return a cleanup function to unsubscribe
      return () => {
        supabase.removeChannel(subscription);
      };
    });
}
