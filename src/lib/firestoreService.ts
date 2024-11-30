import { db } from "@/entrypoints/background";
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import moment from "moment";

export type NewComment = {
  text: string;
  sender: string;
  currentPath: URLPath;
};

export type CommentData = {
  text: string;
  sender: string;
  timestamp: Timestamp;
  upvotes: number;
};

export type URLPath = {
  baseUrl: string;
  pagePath: string;
};

export async function addComment(
  text: string,
  sender: string,
  currentPath: URLPath
): Promise<void> {
  const { baseUrl, pagePath } = currentPath;
  // Split the pagePath into segments for recursive navigation
  const pathSegments = pagePath.split("/").filter((segment) => segment); // Removes empty segments

  // Initialize a reference starting at the base URL document
  let currentRef = doc(db, "stages", baseUrl);

  // Navigate through each segment, creating or referencing nested `pages` subcollections
  for (const segment of pathSegments) {
    const pagesCollectionRef = collection(currentRef, "pages");
    currentRef = doc(pagesCollectionRef, segment);
  }

  // Reference the `comments` subcollection under the final document
  const commentsCollectionRef = collection(currentRef, "comments");

  // Add a new comment document to the `comments` subcollection
  await addDoc(commentsCollectionRef, {
    text,
    sender,
    timestamp: new Date(),
    upvotes: 0,
  });

  console.log("====================================");
  console.log(`Comment added for page: ${pagePath}`);
  console.log("Timestamp:", moment(new Date()));
  console.log("====================================");
}

export function listenToComments(
  currentPath: URLPath,
  callback: (comments: CommentData[]) => void
) {
  const { baseUrl, pagePath } = currentPath;

  // Split the pagePath into segments for recursive navigation
  const pathSegments = pagePath.split("/").filter((segment) => segment);

  // Initialize a reference starting at the base URL document
  let currentRef = doc(db, "stages", baseUrl);

  // Navigate through each segment to find the target document
  for (const segment of pathSegments) {
    const pagesCollectionRef = collection(currentRef, "pages");
    currentRef = doc(pagesCollectionRef, segment);
  }

  // Reference the `comments` subcollection
  const commentsCollectionRef = collection(currentRef, "comments");

  // Listen for real-time updates in the `comments` subcollection
  return onSnapshot(commentsCollectionRef, (snapshot) => {
    const comments = snapshot.docs.map((doc) => doc.data() as CommentData);
    callback(comments);
  });
}
