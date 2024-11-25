import { db } from "@/entrypoints/background";
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  DocumentReference,
  DocumentData,
} from "firebase/firestore";

export function addComment(
  baseUrl: string,
  text: string
): Promise<DocumentReference<DocumentData>> {
  const stageDocRef = doc(db, "stages", baseUrl);
  const commentsCollectionRef = collection(stageDocRef, "comments");

  return addDoc(commentsCollectionRef, {
    text,
    timestamp: new Date().toISOString(),
  });
}

export function listenToComments(
  baseUrl: string,
  callback: (comments: { text: string; timestamp: string }[]) => void
) {
  const stageDocRef = doc(db, "stages", baseUrl);
  const commentsCollectionRef = collection(stageDocRef, "comments");

  return onSnapshot(commentsCollectionRef, (snapshot) => {
    const comments = snapshot.docs.map(
      (doc) => doc.data() as { text: string; timestamp: string }
    );
    callback(comments);
  });
}
