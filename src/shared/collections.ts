import { ConversationInfo, MessageData, SavedUser } from "./types";
import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  collection,
  doc,
} from "firebase/firestore";

import { db } from "./firebase";

// Typed references for reading. Writes go through plain references because
// they use dotted field paths and sentinel values.
const converter = <T extends DocumentData>(): FirestoreDataConverter<T> => ({
  toFirestore: (value) => value as DocumentData,
  fromFirestore: (snapshot: QueryDocumentSnapshot) => snapshot.data() as T,
});

export const usersCollection = collection(db, "users").withConverter(
  converter<SavedUser>(),
);

export const conversationsCollection = collection(
  db,
  "conversations",
).withConverter(converter<ConversationInfo>());

export const conversationDoc = (conversationId: string) =>
  doc(conversationsCollection, conversationId);

export const messagesCollection = (conversationId: string) =>
  collection(db, "conversations", conversationId, "messages").withConverter(
    converter<MessageData>(),
  );

export const messageDoc = (conversationId: string, messageId: string) =>
  doc(messagesCollection(conversationId), messageId);
