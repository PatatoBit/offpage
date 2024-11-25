import { db } from "@/entrypoints/background";
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  DocumentReference,
  DocumentData,
} from "firebase/firestore";

export type CommentData = {
  text: string;
  sender: string;
  timestamp: string;
};

export function addComment(
  baseUrl: string,
  sender: string,
  text: string
): Promise<DocumentReference<DocumentData>> {
  const stageDocRef = doc(db, "stages", baseUrl);
  const commentsCollectionRef = collection(stageDocRef, "comments");

  return addDoc(commentsCollectionRef, {
    text,
    sender,
    timestamp: new Date().toISOString(),
  });
}

export function listenToComments(
  baseUrl: string,
  callback: (comments: CommentData[]) => void
) {
  const stageDocRef = doc(db, "stages", baseUrl);
  const commentsCollectionRef = collection(stageDocRef, "comments");

  return onSnapshot(commentsCollectionRef, (snapshot) => {
    const comments = snapshot.docs.map((doc) => doc.data() as CommentData);
    callback(comments);
  });
}
