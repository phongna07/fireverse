export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface ConversationInfo {
  users: string[];
  group?: {
    admins?: string[];
    groupName?: null | string;
    groupImage?: null | string;
  };
  seen: {
    [uid: string]: string;
  };
  updatedAt: FirestoreTimestamp | null;
  theme: string;
}

export interface SavedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
}

export type MessageType = "text" | "image" | "file" | "sticker" | "removed";

export interface MessageData {
  sender: string;
  content: string;
  replyTo?: string | null;
  file?: {
    name: string;
    size: number;
  } | null;
  // null while the server timestamp of a just-sent message is still pending
  createdAt: FirestoreTimestamp | null;
  type: MessageType;
  reactions?: {
    [uid: string]: number;
  };
}

export interface MessageItem extends MessageData {
  id: string;
}

export interface StickerCollection {
  name: string;
  thumbnail: string;
  icon: string;
  id: string;
  stickers: {
    id: string;
    spriteURL: string;
  }[];
}

export type StickerCollections = StickerCollection[];

interface GiphyRendition {
  url: string;
  width?: string;
  height?: string;
}

export interface GiphyGif {
  id: string;
  title?: string;
  images: {
    original: GiphyRendition;
    fixed_height_small?: GiphyRendition;
    fixed_height?: GiphyRendition;
  };
}

export interface GiphyResponse {
  data: GiphyGif[];
}
